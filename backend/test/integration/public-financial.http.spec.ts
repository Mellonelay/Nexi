import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FinancialOperationsController } from '../../src/financial/financial-operations.controller';
import { FinancialOperationsService } from '../../src/financial/financial-operations.service';
import { WalletController } from '../../src/wallet/wallet.controller';
import { WalletService } from '../../src/wallet/wallet.service';
import { LedgerAuthorityService } from '../../src/ledger/ledger-authority.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { AuthService } from '../../src/auth/auth.service';
import { D1PrismaService } from '../../src/d1/d1-prisma.service';
import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';
import { Gate2WithdrawalDto } from '../../src/financial/financial-operations.dto';

class D1FinancialHarness {
  private readonly accounts = new Map([['user-1:USDT', { id: 'acct-user-1-usdt', userId: 'user-1', asset: 'USDT', scope: 'MAIN', available: '100', locked: '0', status: 'ACTIVE' }]]);
  readonly withdrawals: Array<Record<string, unknown>> = [];
  readonly activities: Array<Record<string, unknown>> = [];
  isEnabled() { return true; }
  async hasAssetCapability(asset: string, _network: string, capability: string) { return asset.toUpperCase() === 'USDT' && capability === 'withdraw'; }
  async getWalletAssetNetworkConfig(asset: string, network: string) { return asset.toUpperCase() === 'USDT' && network.toUpperCase() === 'TRC20' ? { assetActive: 1, withdrawEnabled: 1, networkActive: 1, networkWithdrawEnabled: 1, minWithdrawal: '1', maxWithdrawal: '1000', withdrawalFee: '0.2' } : null; }
  async getSystemConfigValue(key: string) { return key === 'gate2.withdrawal.fee.USDT.TRC20' ? '0.2' : null; }
  async getWithdrawal(requestKey: string) { return this.withdrawals.find((row) => row.requestKey === requestKey) ?? null; }
  async reserveWithdrawal(input: Record<string, string>) {
    const account = this.accounts.get(`${input.userId}:${input.asset.toUpperCase()}`);
    if (!account) throw new Error('D1 account missing');
    const reserved = Number(input.reservedAmount);
    if (Number(account.available) < reserved) throw new Error('insufficient funds');
    account.available = String(Number(account.available) - reserved);
    account.locked = String(Number(account.locked) + reserved);
    const withdrawal = { id: `withdrawal-${this.withdrawals.length + 1}`, userId: input.userId, asset: input.asset.toUpperCase(), network: input.network, address: input.address, amount: input.amount, fee: input.fee, reservedAmount: input.reservedAmount, state: 'PENDING_REVIEW', requestKey: input.requestKey };
    this.withdrawals.push(withdrawal);
    this.activities.push({ id: `activity-${this.activities.length + 1}`, type: 'WITHDRAWAL', status: 'PENDING_REVIEW', asset: withdrawal.asset, amount: withdrawal.amount, ledgerCorrelationId: input.requestKey, ledgerPostingId: `posting-${this.withdrawals.length}` });
    return withdrawal;
  }
  async listLedgerAccounts(userId: string) { return [...this.accounts.values()].filter((account) => account.userId === userId); }
  async listUserActivity(userId: string) { return userId === 'user-1' ? this.activities : []; }
}

describe('Public financial C2 contract path', () => {
  let app: INestApplication;
  let d1: D1FinancialHarness;
  const requestUser = { user: { userId: 'user-1', role: 'USER' } } as any;
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } });

  beforeAll(async () => {
    d1 = new D1FinancialHarness();
    const module = await Test.createTestingModule({
      controllers: [FinancialOperationsController, WalletController],
      providers: [FinancialOperationsService, WalletService, { provide: LedgerAuthorityService, useValue: {} }, { provide: D1FinancialCommandGateway, useValue: d1 }, { provide: D1PrismaService, useValue: d1 }, { provide: AuthService, useValue: { verifySensitiveAction: jest.fn().mockResolvedValue(undefined) } }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: (context: any) => { context.switchToHttp().getRequest().user = requestUser.user; return true; } }).overrideGuard(AuthSurfaceGuard).useValue({ canActivate: () => true }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => { if (app) await app.close(); });

  it('proves Public-shaped JSON through controller, DTO validation, D1 reservation, and wallet read-back', async () => {
    const financial = app.get(FinancialOperationsController);
    const wallet = app.get(WalletController);
    const raw = { asset: 'USDT', network: 'TRC20', address: 'T-public-c2-destination', amount: '10', idempotencyKey: 'public-c2-withdrawal-001', securityPassword: 'test-security-password' };
    const body = await pipe.transform(raw, { type: 'body', metatype: Gate2WithdrawalDto } as any) as Gate2WithdrawalDto;
    const withdrawal = await financial.requestWithdrawal(body, requestUser);
    expect(withdrawal).toMatchObject({ replayed: false, providerLive: false, withdrawal: { state: 'PENDING_REVIEW', requestKey: raw.idempotencyKey } });
    expect(await wallet.getMyWallet(requestUser)).toMatchObject({ USDT: { available: '89.8', locked: '10.2', total: '100' } });
    expect(await wallet.getActivity(requestUser)).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'WITHDRAWAL', ledgerCorrelationId: raw.idempotencyKey, ledgerPostingId: 'posting-1' })]));
    const replay = await financial.requestWithdrawal(body, requestUser);
    expect(replay).toMatchObject({ replayed: true, withdrawal: { id: 'withdrawal-1' } });
    expect(d1.withdrawals).toHaveLength(1);
  });

  it('rejects malformed Public withdrawal input before D1 mutation', async () => {
    await expect(pipe.transform({ asset: 'USDT', network: 'TRC20', address: 'T-public-c2-destination', amount: 'not-a-decimal', idempotencyKey: 'public-c2-invalid', securityPassword: 'test' }, { type: 'body', metatype: Gate2WithdrawalDto } as any)).rejects.toBeDefined();
    expect(d1.withdrawals).toHaveLength(1);
  });
});
