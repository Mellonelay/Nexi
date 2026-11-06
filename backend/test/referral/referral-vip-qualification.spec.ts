import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { validate } from 'class-validator';
import { ReferralVipService } from '../../src/referral-vip/referral-vip.service';
import { InvalidateExternalDepositDto } from '../../src/referral-vip/referral-vip.dto';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
const migrationPath = new URL('../../prisma/migrations-d1/0020_deposit_qualification_referral_policy.sql', import.meta.url);

describe('VIP qualification and referral first-deposit recovery', () => {
  it('excludes an invalidated credited deposit before creating qualification or referral effects', async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn(async (sql: string) => sql.includes('Gate2Deposit')
        ? { results: [{ userId: 'customer-1', asset: 'USDT', amount: '25', creditPostingId: 'credit-1', creditedAt: '2026-11-01' }] }
        : { results: [{ status: 'PENDING' }] }),
      batch: jest.fn(),
    };
    const financial = { convertExactAmount: jest.fn(), postReferralReward: jest.fn(), applyAdminFinancialCorrection: jest.fn() };
    const service = new ReferralVipService(d1 as any, financial as any);

    await expect(service.processCreditedExternalDeposit('DEPOSIT', 'deposit-1'))
      .resolves.toEqual({ status: 'DEPOSIT_INVALIDATED', depositRef: 'DEPOSIT:deposit-1' });
    expect(d1.select).toHaveBeenCalledTimes(2);
    expect(d1.batch).not.toHaveBeenCalled();
    expect(financial.convertExactAmount).not.toHaveBeenCalled();
    expect(financial.postReferralReward).not.toHaveBeenCalled();
  });

  it('recovers credited principal and an issued reward using stable audited Ledger corrections', async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn(async (sql: string) => {
        if (sql.includes('Gate2Deposit')) return { results: [{ userId: 'customer-1', asset: 'USDT', amount: '25' }] };
        if (sql.includes('SELECT "status","reason"')) return { results: [{ status: 'PENDING', reason: 'provider reversal' }] };
        if (sql.includes('ReferralFirstDepositDecision')) return { results: [{ status: 'REWARDED', referrerUserId: 'referrer-1', rewardAsset: 'NEXI', rewardAmount: '2', ledgerPostingId: 'reward-original-posting' }] };
        if (sql.includes('SystemConfig')) return { results: [{ value: JSON.stringify({ baseAsset: 'USDT' }) }] };
        if (sql.includes('VipDepositQualification')) return { results: [] };
        if (sql.includes('VipLevel')) return { results: [{ id: 'vip-zero', level: 0, threshold: '0' }] };
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
      batch: jest.fn().mockResolvedValue(undefined),
    };
    const financial = { applyAdminFinancialCorrection: jest.fn(async () => ({ posting: { postingId: 'correction-posting' } })) };
    const service = new ReferralVipService(d1 as any, financial as any);

    const result = await service.adminInvalidateExternalDeposit('admin-1', 'DEPOSIT', 'deposit-1', 'provider reversal');

    expect(result).toMatchObject({ status: 'RECOVERED', depositRef: 'DEPOSIT:deposit-1', principalPostingId: 'correction-posting', rewardPostingId: 'correction-posting' });
    expect(financial.applyAdminFinancialCorrection).toHaveBeenCalledTimes(2);
    expect(financial.applyAdminFinancialCorrection).toHaveBeenNthCalledWith(1, expect.objectContaining({
      userId: 'customer-1', asset: 'USDT', amount: '25', direction: 'DEBIT', scope: 'MAIN',
      idempotencyKey: 'deposit-invalidation:principal:DEPOSIT:deposit-1', adminId: 'admin-1',
    }));
    expect(financial.applyAdminFinancialCorrection).toHaveBeenNthCalledWith(2, expect.objectContaining({
      userId: 'referrer-1', asset: 'NEXI', amount: '2', direction: 'DEBIT', scope: 'MAIN',
      idempotencyKey: 'deposit-invalidation:referral-reward:DEPOSIT:deposit-1', adminId: 'admin-1',
    }));
    const allStatements = d1.batch.mock.calls.flatMap(call => call[0] as Array<{ sql: string }>);
    const allSql = allStatements.map(statement => statement.sql).join('\n');
    expect(allSql).toContain('AdminAuditLog');
    expect(allStatements.flatMap(statement => (statement as any).params ?? [])).toContain('EXTERNAL_DEPOSIT_INVALIDATED');
    expect(allSql).toContain('UPDATE "ReferralRewardEvent" SET "status"=\'RECOVERED\'');
    expect(allStatements.flatMap(statement => (statement as any).params ?? [])).toContain('reward-original-posting');
    expect(allSql).toContain("'RECOVERED'");
    expect(allSql).toContain("'INVALIDATED'");
  });

  it('validates the Admin invalidation DTO source and reason fields', async () => {
    const valid = Object.assign(new InvalidateExternalDepositDto(), { sourceType: 'DEPOSIT_CLAIM', sourceId: 'claim-1', reason: 'confirmed provider reversal' });
    const invalid = Object.assign(new InvalidateExternalDepositDto(), { sourceType: 'INTERNAL_TRANSFER', sourceId: '', reason: 'x' });
    await expect(validate(valid)).resolves.toHaveLength(0);
    await expect(validate(invalid)).resolves.toHaveLength(3);
  });

  it('applies the additive qualification migration to a disposable SQLite schema', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('CREATE TABLE "UserVipState" ("id" TEXT PRIMARY KEY)');
      db.exec(readFileSync(migrationPath, 'utf8'));
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row: any) => row.name);
      expect(tables).toEqual(expect.arrayContaining(['VipDepositQualification', 'ReferralFirstDepositDecision', 'DepositInvalidationRecovery']));
      const columns = db.prepare('PRAGMA table_info("UserVipState")').all().map((row: any) => row.name);
      expect(columns).toEqual(expect.arrayContaining(['manualOverride', 'overrideAdminId', 'overrideReason', 'overrideAt']));
    } finally {
      db.close();
    }
  });
});
