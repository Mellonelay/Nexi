import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { ReferralVipController } from '../../src/referral-vip/referral-vip.controller';
import { ReferralVipService } from '../../src/referral-vip/referral-vip.service';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

describe('referral history', () => {
  it('scopes both histories to the authenticated account and returns truthful event fields', async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn()
        .mockResolvedValueOnce({ results: [
          { referredUserCode: 100201, status: 'ATTRIBUTED', attributedAt: '2026-10-11 10:12:13' },
          { referredUserCode: 100202, status: 'ATTRIBUTED', attributedAt: null },
          { referredUserCode: 100203, status: 'ATTRIBUTED', attributedAt: '2026-10-09 08:00:00' },
        ] })
        .mockResolvedValueOnce({ results: [
          { id: 'reward-event-1', referredUserCode: 100201, amount: '0.12500000', asset: 'NEXI', status: 'COMPLETED', rewardedAt: '2026-10-11 10:13:00' },
        ] }),
    };
    const service = new ReferralVipService(d1 as any);

    const result = await service.getReferralHistory('referrer-account', 2, 4);

    expect(d1.select).toHaveBeenCalledTimes(2);
    expect(d1.select.mock.calls[0][0]).toContain('WHERE referred."referredBy"=?');
    expect(d1.select.mock.calls[0][1]).toEqual(['ATTRIBUTED', 'referrer-account', 3, 4]);
    expect(d1.select.mock.calls[1][0]).toContain('WHERE e."referrerUserId"=?');
    expect(d1.select.mock.calls[1][1]).toEqual(['referrer-account', 3, 4]);
    expect(result).toEqual({
      referrals: {
        items: [
          { referredUserCode: 100201, status: 'ATTRIBUTED', attributedAt: '2026-10-11 10:12:13' },
          { referredUserCode: 100202, status: 'ATTRIBUTED', attributedAt: null },
        ],
        limit: 2,
        offset: 4,
        hasMore: true,
      },
      rewards: {
        items: [
          { id: 'reward-event-1', referredUserCode: 100201, amount: '0.12500000', asset: 'NEXI', status: 'COMPLETED', rewardedAt: '2026-10-11 10:13:00' },
        ],
        limit: 2,
        offset: 4,
        hasMore: false,
      },
    });
    expect(JSON.stringify(result)).not.toContain('walletAddress');
  });

  it('clamps pagination bounds before querying', async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn().mockResolvedValue({ results: [] }),
    };
    const service = new ReferralVipService(d1 as any);

    const result = await service.getReferralHistory('account-a', 1000, -10);

    expect(d1.select.mock.calls[0][1]).toEqual(['ATTRIBUTED', 'account-a', 101, 0]);
    expect(d1.select.mock.calls[1][1]).toEqual(['account-a', 101, 0]);
    expect(result.referrals).toMatchObject({ limit: 100, offset: 0, hasMore: false });
  });

  it('binds the history read to the authenticated request user, not a query parameter', async () => {
    const response = { referrals: { items: [], limit: 50, offset: 0, hasMore: false }, rewards: { items: [], limit: 50, offset: 0, hasMore: false } };
    const service = { getReferralHistory: jest.fn().mockResolvedValue(response) };
    const controller = new ReferralVipController(service as any);

    await expect(controller.referralHistory({ user: { userId: 'authenticated-user' } } as any, '25', '10')).resolves.toEqual(response);
    expect(service.getReferralHistory).toHaveBeenCalledWith('authenticated-user', 25, 10);
  });
});

describe('D1 referral event migration', () => {
  it('records new attribution and only actual affiliate reward credit postings without backfilling legacy rows', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(`
        PRAGMA foreign_keys=ON;
        CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "userCode" INTEGER NOT NULL UNIQUE);
        CREATE TABLE "Affiliate" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL UNIQUE,
          "referralCode" TEXT NOT NULL UNIQUE,
          "referredBy" TEXT,
          "totalEarnings" TEXT NOT NULL DEFAULT '0',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id")
        );
        CREATE TABLE "LedgerAccount" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL);
        CREATE TABLE "LedgerPosting" (
          "id" TEXT PRIMARY KEY,
          "accountId" TEXT NOT NULL,
          "asset" TEXT NOT NULL,
          "kind" TEXT NOT NULL,
          "amount" TEXT NOT NULL,
          "availableDelta" TEXT NOT NULL,
          "referenceType" TEXT NOT NULL,
          "referenceId" TEXT NOT NULL,
          "correlationId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE "Activity" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "referenceType" TEXT NOT NULL,
          "referenceId" TEXT NOT NULL,
          "idempotencyKey" TEXT NOT NULL UNIQUE,
          "ledgerCorrelationId" TEXT NOT NULL,
          "ledgerPostingId" TEXT,
          "asset" TEXT,
          "amount" TEXT,
          "details" TEXT,
          "createdAt" DATETIME NOT NULL
        );
        CREATE TABLE "EventOutbox" (
          "id" TEXT PRIMARY KEY,
          "idempotencyKey" TEXT NOT NULL UNIQUE,
          "aggregateType" TEXT NOT NULL,
          "aggregateId" TEXT NOT NULL,
          "eventType" TEXT NOT NULL,
          "eventVersion" INTEGER NOT NULL,
          "correlationId" TEXT,
          "payload" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "availableAt" DATETIME NOT NULL,
          "attempts" INTEGER NOT NULL,
          "createdAt" DATETIME NOT NULL,
          "updatedAt" DATETIME NOT NULL
        );
        INSERT INTO "User" ("id","userCode") VALUES ('referrer',100101),('referred-new',100102),('referred-legacy',100103),('other',100104);
        INSERT INTO "Affiliate" ("id","userId","referralCode","referredBy") VALUES
          ('affiliate-referrer','referrer','NEXI100101',NULL),
          ('affiliate-new','referred-new','NEXI100102',NULL),
          ('affiliate-legacy','referred-legacy','NEXI100103','referrer'),
          ('affiliate-other','other','NEXI100104',NULL);
        INSERT INTO "LedgerAccount" ("id","userId") VALUES ('account-referrer','referrer'),('account-other','other');
      `);
      db.exec(readFileSync('prisma/migrations-d1/0014_referral_history_events.sql', 'utf8'));

      expect(db.prepare('SELECT COUNT(*) AS count FROM "ReferralAttributionEvent"').get().count).toBe(0);
      db.prepare('UPDATE "Affiliate" SET "referredBy"=? WHERE "userId"=?').run('referrer', 'referred-new');
      expect(db.prepare('SELECT "referrerUserId","referredUserId","referralCode","status" FROM "ReferralAttributionEvent"').get()).toEqual({
        referrerUserId: 'referrer',
        referredUserId: 'referred-new',
        referralCode: 'NEXI100101',
        status: 'ATTRIBUTED',
      });
      expect(db.prepare('SELECT COUNT(*) AS count FROM "ReferralAttributionEvent" WHERE "referredUserId"=?').get('referred-legacy').count).toBe(0);

      db.prepare(`INSERT INTO "LedgerPosting"
        ("id","accountId","asset","kind","amount","availableDelta","referenceType","referenceId","correlationId","createdAt")
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run('posting-valid','account-referrer','NEXI','CREDIT','0.12500000','0.12500000','AFFILIATE_REWARD','referred-new','corr-valid','2026-10-11 10:13:00');
      db.prepare(`INSERT INTO "LedgerPosting"
        ("id","accountId","asset","kind","amount","availableDelta","referenceType","referenceId","correlationId","createdAt")
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run('posting-negative','account-referrer','NEXI','CREDIT','-1','-1','AFFILIATE_REWARD','referred-new','corr-negative','2026-10-11 10:14:00');
      db.prepare(`INSERT INTO "LedgerPosting"
        ("id","accountId","asset","kind","amount","availableDelta","referenceType","referenceId","correlationId","createdAt")
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run('posting-unrelated','account-other','NEXI','CREDIT','1','1','AFFILIATE_REWARD','referred-new','corr-unrelated','2026-10-11 10:15:00');

      expect(db.prepare('SELECT "referrerUserId","referredUserId","amount","asset","status","rewardedAt" FROM "ReferralRewardEvent"').get()).toEqual({
        referrerUserId: 'referrer',
        referredUserId: 'referred-new',
        amount: '0.12500000',
        asset: 'NEXI',
        status: 'COMPLETED',
        rewardedAt: '2026-10-11 10:13:00',
      });
      const outbox = db.prepare('SELECT "eventType","payload" FROM "EventOutbox" ORDER BY "eventType"').all();
      expect(outbox.map((row: any) => row.eventType)).toEqual(['AFFILIATE_REWARD_RECORDED', 'REFERRAL_ATTRIBUTED']);
      expect(outbox.every((row: any) => !row.payload.includes('walletAddress'))).toBe(true);

      db.exec(readFileSync('prisma/migrations-d1/0015_referral_reward_activity.sql', 'utf8'));
      expect(db.prepare('SELECT "userId","type","status","referenceId","ledgerCorrelationId","ledgerPostingId","asset","amount" FROM "Activity"').all()).toEqual([{
        userId: 'referrer', type: 'REFERRAL_REWARD', status: 'COMPLETED', referenceId: 'referral-reward-posting-valid', ledgerCorrelationId: 'corr-valid', ledgerPostingId: 'posting-valid', asset: 'NEXI', amount: '0.12500000',
      }]);

      db.prepare(`INSERT INTO "LedgerPosting"
        ("id","accountId","asset","kind","amount","availableDelta","referenceType","referenceId","correlationId","createdAt")
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run('posting-triggered','account-referrer','NEXI','CREDIT','0.25','0.25','AFFILIATE_REWARD','referred-new','corr-triggered','2026-10-11 10:16:00');
      expect(db.prepare('SELECT COUNT(*) AS count FROM "Activity"').get().count).toBe(2);
      db.exec(readFileSync('prisma/migrations-d1/0015_referral_reward_activity.sql', 'utf8'));
      expect(db.prepare('SELECT COUNT(*) AS count FROM "Activity"').get().count).toBe(2);
    } finally {
      db.close();
    }
  });
});
