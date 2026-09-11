import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAddress, verifyMessage } from 'viem';
import { ParsedMessage } from '@spruceid/siwe-parser';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { AuthSessionMetadata } from './auth-session.service';
import { AuthService } from './auth.service';
import { WalletChallengeDto, WalletVerifyDto } from './auth.dto';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { ReferralVipService } from '../referral-vip/referral-vip.service';

const CHALLENGE_TTL_SECONDS = 5 * 60;
const CHALLENGE_PREFIX = 'nexi:wallet-auth:challenge:';
const USER_CODE_MIN = 100000;
const USER_CODE_MAX = 1000000;

interface WalletChallengeRecord {
  address: string;
  chainId: number;
  domain: string;
  uri: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}

function normalizeAddress(address: string): string {
  try { return getAddress(address).toLowerCase(); } catch { throw new BadRequestException('Wallet address is invalid'); }
}

export function validateSiweOrigin(domain: string, uri: string): { scheme: string; domain: string; uri: string } {
  const parsed = new URL(uri);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('SIWE URI must use HTTP or HTTPS');
  if (parsed.host !== domain || parsed.origin !== `${parsed.protocol}//${domain}`) throw new Error('SIWE domain and URI do not describe the same origin');
  return { scheme: parsed.protocol.slice(0, -1), domain, uri: parsed.origin };
}

export function isSiweOriginMatch(expected: { scheme: string; domain: string; uri: string }, actual: { scheme?: string; domain: string; uri: string }): boolean {
  return actual.scheme === expected.scheme && actual.domain === expected.domain && actual.uri === expected.uri;
}

export function buildSiweMessage(input: { scheme: string; domain: string; address: string; statement: string; uri: string; chainId: number; nonce: string; issuedAt: string; expirationTime: string }): string {
  return `${input.scheme}://${input.domain} wants you to sign in with your Ethereum account:\n${getAddress(input.address)}\n\n${input.statement}\n\nURI: ${input.uri}\nVersion: 1\nChain ID: ${input.chainId}\nNonce: ${input.nonce}\nIssued At: ${input.issuedAt}\nExpiration Time: ${input.expirationTime}`;
}

@Injectable()
export class WalletAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly auth: AuthService,
    private readonly referralVip: ReferralVipService,
    private readonly d1: D1FinancialCommandGateway,
  ) {}

  private policy() {
    const chainIds = (this.config.get<string>('WALLET_AUTH_SUPPORTED_CHAIN_IDS') ?? '').split(',').map((value) => Number(value.trim())).filter((value) => Number.isSafeInteger(value) && value > 0);
    const domain = this.config.get<string>('WALLET_AUTH_DOMAIN');
    const uri = this.config.get<string>('WALLET_AUTH_URI');
    if (chainIds.length === 0 || !domain || !uri) throw new ServiceUnavailableException('Wallet authentication policy is not configured');
    try { return { chainIds, ...validateSiweOrigin(domain, uri) }; }
    catch { throw new ServiceUnavailableException('Wallet authentication origin policy is invalid'); }
  }

  async createChallenge(input: WalletChallengeDto) {
    const policy = this.policy();
    if (!policy.chainIds.includes(input.chainId)) throw new BadRequestException('Wallet network is not supported');
    const address = normalizeAddress(input.address);
    const issuedAt = new Date();
    const expirationTime = new Date(issuedAt.getTime() + CHALLENGE_TTL_SECONDS * 1000);
    const nonce = randomBytes(16).toString('hex');
    const message = buildSiweMessage({ scheme: policy.scheme, domain: policy.domain, address, statement: 'Sign in to NEXI.', uri: policy.uri, chainId: input.chainId, nonce, issuedAt: issuedAt.toISOString(), expirationTime: expirationTime.toISOString() });
    const record: WalletChallengeRecord = { address, chainId: input.chainId, domain: policy.domain, uri: policy.uri, nonce, issuedAt: issuedAt.toISOString(), expirationTime: expirationTime.toISOString() };
    try { await this.redis.set(`${CHALLENGE_PREFIX}${nonce}`, JSON.stringify(record), CHALLENGE_TTL_SECONDS); } catch { throw new ServiceUnavailableException('Wallet challenge storage is unavailable'); }
    return { message, nonce, domain: policy.domain, uri: policy.uri, chainId: input.chainId, issuedAt: record.issuedAt, expirationTime: record.expirationTime };
  }

  async verifyChallenge(input: WalletVerifyDto, metadata: AuthSessionMetadata) {
    const policy = this.policy();
    let message: ParsedMessage;
    try { message = new ParsedMessage(input.message); } catch { throw new UnauthorizedException('Wallet authentication message is invalid'); }
    if (!isSiweOriginMatch(policy, message) || message.version !== '1' || !policy.chainIds.includes(message.chainId)) throw new UnauthorizedException('Wallet authentication message is not accepted');
    const address = normalizeAddress(message.address);
    const key = `${CHALLENGE_PREFIX}${message.nonce}`;
    let raw: string | null;
    try { raw = await this.redis.get(key); } catch { throw new ServiceUnavailableException('Wallet challenge storage is unavailable'); }
    if (!raw) throw new UnauthorizedException('Wallet challenge is expired or already consumed');
    let record: WalletChallengeRecord;
    try { record = JSON.parse(raw) as WalletChallengeRecord; } catch { throw new UnauthorizedException('Wallet challenge is invalid'); }
    if (record.address !== address || record.chainId !== message.chainId || record.domain !== message.domain || record.uri !== message.uri || record.issuedAt !== message.issuedAt || record.expirationTime !== message.expirationTime || new Date(record.expirationTime).getTime() <= Date.now()) throw new UnauthorizedException('Wallet challenge does not match');
    let validSignature = false;
    try { validSignature = await verifyMessage({ address: getAddress(address), message: input.message, signature: input.signature as `0x${string}` }); } catch { validSignature = false; }
    if (!validSignature) throw new UnauthorizedException('Wallet signature is invalid');
    const consumed = await this.redis.getClient().eval("local value = redis.call('GET', KEYS[1]); if value then redis.call('DEL', KEYS[1]); end; return value", 1, key);
    if (typeof consumed !== 'string' || consumed !== raw) throw new UnauthorizedException('Wallet challenge is expired or already consumed');

    const user = await this.getOrCreateUserOnD1(address, message.chainId);

    const account = await this.referralVip.ensureAccountState(user.id, Number(user.userCode), input.referralCode);
    const session = await this.auth.login({ id: user.id, publicId: user.userCode.toString(), email: user.email, role: user.role, kycStatus: user.kyc?.status ?? 'NOT_SUBMITTED' }, 'PUBLIC', metadata);
    return {
      ...session,
      profile: {
        id: user.userCode.toString(),
        email: user.email,
        displayName: user.displayName,
        walletAddress: user.walletIdentity?.address ?? address,
        chainId: user.walletIdentity?.chainId ?? message.chainId,
        kycStatus: user.kyc?.status ?? 'NOT_SUBMITTED',
        referral: account?.referral ?? null,
        vip: account?.vip ?? null,
      },
      metadata: { sessionSurface: 'PUBLIC' },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.d1.getUserById(userId);
    if (!user) throw new UnauthorizedException('Authenticated user is unavailable');
    const account = await this.referralVip.ensureAccountState(userId, Number(user.userCode));
    return { id: String(user.userCode), email: user.email ?? null, displayName: user.displayName ?? null, walletAddress: user.walletAddress ?? null, chainId: user.walletChainId ?? null, kycStatus: user.kycStatus ?? 'NOT_SUBMITTED', referral: account.referral, vip: account.vip };
  }

  private async getOrCreateUserOnD1(address: string, chainId: number): Promise<any> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const existing = await this.d1!.getUserByWallet(address);
      if (existing) return { id: existing.id, userCode: existing.userCode, email: existing.email ?? null, displayName: existing.displayName ?? null, role: existing.role, walletIdentity: { address: existing.walletAddress, chainId: existing.walletChainId }, kyc: existing.kycStatus ? { status: existing.kycStatus } : null };
      try {
        const created = await this.d1!.createWalletUser({ userId: randomUUID(), userCode: randomInt(USER_CODE_MIN, USER_CODE_MAX), address, chainId });
        return { id: created.id, userCode: created.userCode, email: created.email ?? null, displayName: created.displayName ?? null, role: created.role, walletIdentity: { address: created.walletAddress, chainId: created.walletChainId }, kyc: created.kycStatus ? { status: created.kycStatus } : null };
      } catch (error) {
        if (!(error instanceof BadRequestException) || !error.message.includes('D1 wallet user could not be created') || attempt === 7) throw error;
      }
    }
    throw new ServiceUnavailableException('D1 wallet user allocation is unavailable');
  }
}
