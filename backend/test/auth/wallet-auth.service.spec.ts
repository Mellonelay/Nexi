import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

jest.mock('viem', () => ({
  getAddress: (value: string) => value.toLowerCase(),
  verifyMessage: jest.fn().mockResolvedValue(true),
}));

jest.mock('@spruceid/siwe-parser', () => ({
  ParsedMessage: class {
    version = '1';
    scheme = '';
    domain = '';
    uri = '';
    chainId = 0;
    address = '';
    nonce = '';
    issuedAt = '';
    expirationTime = '';

    constructor(raw: string) {
      const lines = raw.split('\n');
      const origin = lines[0]?.split(' wants')[0] ?? '';
      this.scheme = origin.split('://')[0] ?? '';
      this.domain = origin.replace(/^[a-z]+:\/\//, '');
      this.address = lines[1] ?? '';
      for (const line of lines) {
        const [key, ...parts] = line.split(': ');
        const value = parts.join(': ');
        if (key === 'URI') this.uri = value;
        if (key === 'Chain ID') this.chainId = Number(value);
        if (key === 'Nonce') this.nonce = value;
        if (key === 'Issued At') this.issuedAt = value;
        if (key === 'Expiration Time') this.expirationTime = value;
      }
    }
  },
}));

// Load after module mocks so the parser and signature boundary stay deterministic.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WalletAuthService } = require('../../src/auth/wallet-auth.service') as typeof import('../../src/auth/wallet-auth.service');
const { verifyMessage } = jest.requireMock('viem') as { verifyMessage: jest.Mock };

function makeService() {
  const records = new Map<string, string>();
  const redis = {
    set: jest.fn(async (key: string, value: string) => { records.set(key, value); }),
    get: jest.fn(async (key: string) => records.get(key) ?? null),
    getClient: () => ({ eval: jest.fn(async (_script: string, _count: number, key: string) => { const value = records.get(key) ?? null; records.delete(key); return value; }) }),
  };
  const user = { id: 'user-1', userCode: 100001, email: null, displayName: null, role: 'USER', walletIdentity: { address: '0xabc', chainId: 1 }, kyc: { status: 'NOT_SUBMITTED' } };
  const prisma = {
    $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback({
      walletIdentity: { findUnique: jest.fn().mockResolvedValue(null) },
      user: { create: jest.fn().mockResolvedValue(user), findUniqueOrThrow: jest.fn().mockResolvedValue(user) },
    })),
  };
  const auth = { login: jest.fn().mockResolvedValue({ access_token: 'opaque-test-token' }) };
  const config = { get: (key: string) => ({ WALLET_AUTH_SUPPORTED_CHAIN_IDS: '1', WALLET_AUTH_DOMAIN: 'nexi.local', WALLET_AUTH_URI: 'http://nexi.local' } as Record<string, string>)[key] };
  return { service: new WalletAuthService(config as any, prisma as any, redis as any, auth as any, {} as any), redis, prisma, auth };
}

describe('WalletAuthService', () => {
  beforeEach(() => verifyMessage.mockClear());

  it('fails closed when the wallet policy is not configured', async () => {
    const service = new WalletAuthService({ get: () => undefined } as any, {} as any, {} as any, {} as any, {} as any);
    await expect(service.createChallenge({ address: '0xabc', chainId: 1 })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('creates a single-use challenge and rejects unsupported chains', async () => {
    const { service, redis } = makeService();
    const challenge = await service.createChallenge({ address: '0xabc', chainId: 1 });
    expect(challenge.message).toContain('Chain ID: 1');
    expect(redis.set).toHaveBeenCalledTimes(1);
    await expect(service.createChallenge({ address: '0xabc', chainId: 137 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('consumes a challenge and rejects replay', async () => {
    const { service, auth } = makeService();
    const challenge = await service.createChallenge({ address: '0xabc', chainId: 1 });
    await service.verifyChallenge({ message: challenge.message, signature: '0xsigned' }, {});
    expect(auth.login).toHaveBeenCalledTimes(1);
    await expect(service.verifyChallenge({ message: challenge.message, signature: '0xsigned' }, {})).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('retries D1 user allocation after a six-digit userCode collision', async () => {
    const { service } = makeService();
    const created = { id: 'user-2', userCode: 100002, email: null, displayName: null, role: 'USER', walletAddress: '0xdef', walletChainId: 1, kycStatus: null };
    const d1 = {
      isEnabled: jest.fn(() => true),
      getUserByWallet: jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(created),
      createWalletUser: jest.fn()
        .mockRejectedValueOnce(new BadRequestException('D1 wallet user could not be created'))
        .mockResolvedValueOnce(created),
    };
    (service as any).d1 = d1;

    await expect((service as any).getOrCreateUserOnD1('0xdef', 1)).resolves.toMatchObject({ id: 'user-2', userCode: 100002 });
    expect(d1.createWalletUser).toHaveBeenCalledTimes(2);
    for (const call of d1.createWalletUser.mock.calls) {
      expect(call[0].userCode).toBeGreaterThanOrEqual(100000);
      expect(call[0].userCode).toBeLessThan(1000000);
    }
  });

});
