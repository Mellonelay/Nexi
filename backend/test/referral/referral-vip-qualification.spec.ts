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
        if (sql.includes('SELECT "status" FROM "DepositInvalidationRecovery"')) return { results: [{ status: 'RECOVERED' }] };
        if (sql.includes('FROM "AdminAuditLog"')) return { results: [{ id: 'invalidation-audit' }] };
        if (sql.includes('ReferralFirstDepositDecision')) return { results: [{ status: 'REWARDED', referrerUserId: 'referrer-1', rewardAsset: 'NEXI', rewardAmount: '2', ledgerPostingId: 'reward-original-posting' }] };
        if (sql.includes('SystemConfig')) return { results: [{ value: JSON.stringify({ baseAsset: 'USDT' }) }] };
        if (sql.includes('VipDepositQualification')) return { results: [{ baseAmount: '10' }] };
        if (sql.includes('VipLevel')) return { results: [
          { id: 'vip-zero', level: 0, threshold: '0' },
          { id: 'vip-three', level: 3, threshold: '50' },
        ] };
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
      batch: jest.fn().mockResolvedValue(undefined),
    };
    const financial = { applyAdminFinancialCorrection: jest.fn(async () => ({ posting: { postingId: 'correction-posting' } })) };
    const service = new ReferralVipService(d1 as any, financial as any);

    const result = await service.adminInvalidateExternalDeposit('admin-1', 'DEPOSIT', 'deposit-1', 'provider reversal');

    expect(result).toMatchObject({ status: 'RECOVERED', depositRef: 'DEPOSIT:deposit-1', principalPostingId: 'correction-posting', rewardPostingId: 'correction-posting', auditId: 'invalidation-audit' });
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
    const vipStateUpdate = allStatements.find(statement => statement.sql.includes('UPDATE "UserVipState"'));
    expect(vipStateUpdate?.sql).toContain('"vipLevelId"=?');
    expect(vipStateUpdate?.params).toContain('vip-zero');
    expect(allStatements.flatMap(statement => (statement as any).params ?? [])).toContain('reward-original-posting');
    expect(allSql).toContain("'RECOVERED'");
    expect(allSql).toContain("'INVALIDATED'");
    const finalBatch = d1.batch.mock.calls.map(call => call[0] as Array<{ sql: string }>).find(statements =>
      statements.some(statement => statement.sql.includes('UPDATE "UserVipState"'))
      && statements.some(statement => statement.sql.includes('UPDATE "DepositInvalidationRecovery" SET "status"=\'RECOVERED\''))
      && statements.some(statement => statement.sql.includes('INSERT INTO "AdminAuditLog"')),
    );
    expect(finalBatch).toBeDefined();
    expect(finalBatch?.findIndex(statement => statement.sql.includes('UPDATE "UserVipState"')))
      .toBeLessThan(finalBatch?.findIndex(statement => statement.sql.includes('UPDATE "DepositInvalidationRecovery" SET "status"=\'RECOVERED\'')) ?? -1);
  });


  it('keeps invalidation pending after an interrupted final batch and safely resumes on retry', async () => {
    let recoveryStatus = 'PENDING';
    let failFirstFinalization = true;
    const appliedKeys: string[] = [];
    const d1: any = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn(async (sql: string) => {
        if (sql.includes('FROM "Gate2Deposit"')) return { results: [{ userId: 'customer-1', asset: 'USDT', amount: '25' }] };
        if (sql.includes('SELECT "status","reason"')) return { results: [{ status: recoveryStatus, reason: 'provider reversal' }] };
        if (sql.includes('FROM "ReferralFirstDepositDecision"')) return { results: [{ status: 'REWARDED', referrerUserId: 'referrer-1', rewardAsset: 'NEXI', rewardAmount: '2', ledgerPostingId: 'reward-original-posting' }] };
        if (sql.includes('SystemConfig')) return { results: [{ value: JSON.stringify({ baseAsset: 'USDT' }) }] };
        if (sql.includes('VipDepositQualification')) return { results: [] };
        if (sql.includes('WHERE "enabled"=1')) return { results: [{ id: 'vip-zero', level: 0, threshold: '0' }] };
        if (sql.includes('SELECT "status" FROM "DepositInvalidationRecovery"')) return { results: [{ status: recoveryStatus }] };
        if (sql.includes('FROM "AdminAuditLog"')) return { results: [{ id: 'invalidation-audit' }] };
        throw new Error('Unexpected SQL: ' + sql);
      }),
      batch: jest.fn(async (statements: Array<{ sql: string }>) => {
        const sql = statements.map(statement => statement.sql).join('\n');
        if (sql.includes('INSERT OR IGNORE INTO "DepositInvalidationRecovery"')) recoveryStatus = 'PENDING';
        if (sql.includes('UPDATE "DepositInvalidationRecovery" SET "status"=\'RECOVERED\'')) {
          if (failFirstFinalization) {
            failFirstFinalization = false;
            throw new Error('simulated interruption before atomic final commit');
          }
          recoveryStatus = 'RECOVERED';
        }
      }),
    };
    const financial = {
      applyAdminFinancialCorrection: jest.fn(async (command: { idempotencyKey: string }) => {
        appliedKeys.push(command.idempotencyKey);
        return { posting: { postingId: command.idempotencyKey.includes('principal') ? 'principal-posting' : 'reward-posting' } };
      }),
    };
    const service = new ReferralVipService(d1, financial as any);

    await expect(service.adminInvalidateExternalDeposit('admin-1', 'DEPOSIT', 'deposit-1', 'provider reversal'))
      .rejects.toThrow('simulated interruption');
    expect(recoveryStatus).toBe('PENDING');

    await expect(service.adminInvalidateExternalDeposit('admin-1', 'DEPOSIT', 'deposit-1', 'provider reversal'))
      .resolves.toMatchObject({ status: 'RECOVERED', replayed: false, principalPostingId: 'principal-posting' });
    expect(recoveryStatus).toBe('RECOVERED');
    expect(appliedKeys).toEqual([
      'deposit-invalidation:principal:DEPOSIT:deposit-1',
      'deposit-invalidation:referral-reward:DEPOSIT:deposit-1',
      'deposit-invalidation:principal:DEPOSIT:deposit-1',
      'deposit-invalidation:referral-reward:DEPOSIT:deposit-1',
    ]);
  });

  it('uses the default Member row when no enabled tier is eligible', async () => {
    const d1: any = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn(async (sql: string) => {
        if (sql.includes('VipDepositQualification')) return { results: [{ baseAmount: '12.5' }] };
        if (sql.includes('WHERE "enabled"=1')) return { results: [] };
        if (sql.includes('WHERE "level"=0')) return { results: [{ id: 'vip-level-0', level: 0 }] };
        throw new Error('Unexpected SQL: ' + sql);
      }),
    };
    const service = new ReferralVipService(d1, {} as any);

    await expect((service as any).resolveAutomaticVipState('customer-1', 'USDT'))
      .resolves.toEqual({ id: 'vip-level-0', level: 0, progress: '12.5' });
  });

  it('recalculates automatic qualification atomically when clearing a manual VIP override', async () => {
    const tx: any[] = [];
    const d1: any = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn(async (sql: string) => {
        if (sql.includes('SELECT "id" FROM "User"')) return { results: [{ id: 'customer-1' }] };
        if (sql.includes('VipDepositQualification')) return { results: [{ baseAmount: '125' }] };
        if (sql.includes('WHERE "enabled"=1')) return { results: [
          { id: 'vip-zero', level: 0, threshold: '0' },
          { id: 'vip-two', level: 2, threshold: '100' },
        ] };
        if (sql.includes('SELECT s."id" AS "stateId"')) return { results: [{
          stateId: 'state-1', userId: 'customer-1', progress: '125', evaluatedAt: 'now',
          qualifiedAt: 'now', levelId: 'vip-two', level: 2, name: 'Tier 2', threshold: '100',
          benefits: '{}', manualOverride: 0,
        }] };
        if (sql.includes('SystemConfig')) return { results: [{ value: JSON.stringify({ baseAsset: 'USDT' }) }] };
        if (sql.includes('ReferralFirstDepositDecision')) return { results: [] };
        throw new Error('Unexpected SQL: ' + sql);
      }),
      batch: jest.fn(async (statements: Array<{ sql: string; params?: unknown[] }>) => { tx.push(statements); }),
    };
    const service = new ReferralVipService(d1, {} as any);

    await expect(service.adminClearVipOverride('admin-1', 1001, 'rechecked external deposits'))
      .resolves.toMatchObject({ userCode: 1001, vip: { level: 2, manualOverride: false, progress: '125' } });
    const update = tx[0].find(statement => statement.sql.includes('UPDATE "UserVipState"'));
    expect(update.sql).toContain('"manualOverride"=0');
    expect(update.params).toContain('vip-two');
    expect(update.params).toContain('125');
  });

  it('preserves a manual VIP override and audit state when automatic policy is missing or malformed', async () => {
    for (const configRows of [[], [{ value: JSON.stringify({ baseAsset: 'USDT !!' }) }]]) {
      const d1: any = {
        isEnabled: jest.fn().mockReturnValue(true),
        select: jest.fn(async (sql: string) => {
          if (sql.includes('SELECT \"id\" FROM \"User\"')) return { results: [{ id: 'customer-1' }] };
          if (sql.includes('SystemConfig')) return { results: configRows };
          throw new Error('Unexpected SQL: ' + sql);
        }),
        batch: jest.fn(),
      };
      const service = new ReferralVipService(d1, {} as any);

      await expect(service.adminClearVipOverride('admin-1', 1001, 'clear after review'))
        .rejects.toThrow('VIP automatic qualification policy is unavailable');
      expect(d1.batch).not.toHaveBeenCalled();
    }
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
