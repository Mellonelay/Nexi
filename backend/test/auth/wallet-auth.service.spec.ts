import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

jest.unstable_mockModule('viem', () => ({
  getAddress: (value: string) => value.toLowerCase(),
  verifyMessage: jest.fn().mockResolvedValue(true),
}));

jest.unstable_mockModule('@spruceid/siwe-parser', () => ({
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
const { WalletAuthService } = await import('../../src/auth/wallet-auth.service');
const { verifyMessage } = await import('viem') as unknown as { verifyMessage: jest.Mock };

function makeService(chainIds = '1') {
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
  const referralVip = { ensureAccountState: jest.fn().mockResolvedValue({ referral: null, vip: null }) };
  const d1 = {
    getUserByWallet: jest.fn().mockResolvedValue(user),
    getUserById: jest.fn().mockResolvedValue({ id: 'user-1', userCode: 100001, walletAddress: '0xabc', walletChainId: 1 }),
    createWalletUser: jest.fn().mockResolvedValue(user),
    ensureDefaultUserAccounts: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: (key: string) => ({ WALLET_AUTH_SUPPORTED_CHAIN_IDS: chainIds, WALLET_AUTH_DOMAIN: 'nexi.local', WALLET_AUTH_URI: 'http://nexi.local' } as Record<string, string>)[key] };
  return { service: new WalletAuthService(config as any, redis as any, auth as any, referralVip as any, d1 as any), redis, prisma, auth, d1 };
}

describe('WalletAuthService', () => {
  beforeEach(() => verifyMessage.mockClear());

  it('fails closed when the wallet policy is not configured', async () => {
    const service = new WalletAuthService({ get: () => undefined } as any, {} as any, {} as any, {} as any, {} as any);
    await expect(service.createChallenge({ address: '0xabc', chainId: 1 })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('fails closed when configuration includes a non-mainnet chain', async () => {
    const { service, redis } = makeService('1,137');
    await expect(service.createChallenge({ address: '0xabc', chainId: 1 })).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(service.createChallenge({ address: '0xabc', chainId: 137 })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('creates a single-use challenge and rejects unsupported chains', async () => {
    const { service, redis } = makeService();
    const challenge = await service.createChallenge({ address: '0xabc', chainId: 1 });
    expect(challenge.message).toContain('Chain ID: 1');
    expect(redis.set).toHaveBeenCalledTimes(1);
    await expect(service.createChallenge({ address: '0xabc', chainId: 137 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('consumes a challenge and rejects replay', async () => {
    const { service, auth, d1 } = makeService();
    const challenge = await service.createChallenge({ address: '0xabc', chainId: 1 });
    await service.verifyChallenge({ message: challenge.message, signature: '0xsigned' }, {});
    expect(d1.ensureDefaultUserAccounts).toHaveBeenCalledWith('user-1');
    expect(auth.login).toHaveBeenCalledTimes(1);
    await expect(service.verifyChallenge({ message: challenge.message, signature: '0xsigned' }, {})).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('reconciles account readiness for an existing authenticated session', async () => {
    const { service, d1 } = makeService();
    await service.getCurrentUser('user-1');
    expect(d1.ensureDefaultUserAccounts).toHaveBeenCalledWith('user-1');
  });

  it('does not issue a session if account provisioning fails', async () => {
    const { service, auth, d1 } = makeService();
    d1.ensureDefaultUserAccounts.mockRejectedValueOnce(new Error('Ledger initialization failed'));
    const challenge = await service.createChallenge({ address: '0xabc', chainId: 1 });
    await expect(service.verifyChallenge({ message: challenge.message, signature: '0xsigned' }, {})).rejects.toThrow('Ledger initialization failed');
    expect(auth.login).not.toHaveBeenCalled();
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
      expect(call[0].userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(call[0].userCode).toBeGreaterThanOrEqual(100000);
      expect(call[0].userCode).toBeLessThan(1000000);
    }
  });

});
