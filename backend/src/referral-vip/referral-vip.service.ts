import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { D1WorkerBridgeService } from '../d1/d1-worker-bridge.service';

interface ReferralRow {
  id: string;
  userId: string;
  referralCode: string;
  referredBy: string | null;
  totalEarnings: string;
  userCode?: number | null;
  referredByUserCode?: number | null;
  referralCount?: number | string | null;
}

interface VipRow {
  stateId: string;
  userId: string;
  progress: string;
  evaluatedAt: string;
  qualifiedAt: string | null;
  levelId: string;
  level: number;
  name: string;
  threshold: string;
  benefits: string | null;
}

@Injectable()
export class ReferralVipService {
  constructor(private readonly d1: D1WorkerBridgeService) {}

  private assertD1() {
    if (!this.d1.isEnabled()) throw new ServiceUnavailableException('D1 account authority is unavailable');
  }

  private referralCodeFor(userCode: number) {
    return `NEXI${String(userCode).padStart(6, '0')}`;
  }

  async ensureAccountState(userId: string, userCode: number, suppliedReferralCode?: string) {
    this.assertD1();
    const now = new Date().toISOString();
    const referralCode = this.referralCodeFor(userCode);
    await this.d1.batch([
      {
        sql: `INSERT INTO "UserPreference" ("id","userId","locale","timezone","theme","notificationSettings","tradingSettings","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO NOTHING`,
        params: [randomUUID(), userId, 'en', 'UTC', 'dark', null, null],
      },
      {
        sql: `INSERT INTO "Affiliate" ("id","userId","referralCode","referredBy","totalEarnings","createdAt","updatedAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO NOTHING`,
        params: [randomUUID(), userId, referralCode, null, '0'],
      },
      {
        sql: `INSERT INTO "UserVipState" ("id","userId","vipLevelId","progress","evaluatedAt","qualifiedAt","createdAt","updatedAt") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO NOTHING`,
        params: [randomUUID(), userId, 'vip-level-0', '0', now, now],
      },
    ]);
    if (suppliedReferralCode?.trim()) await this.claimReferral(userId, suppliedReferralCode.trim());
    return this.getAccountSummary(userId);
  }

  async claimReferral(userId: string, referralCode: string) {
    this.assertD1();
    const own = await this.d1.select<ReferralRow>(`SELECT * FROM "Affiliate" WHERE "userId"=? LIMIT 1`, [userId]);
    const current = own.results[0];
    if (!current) throw new NotFoundException('Referral identity is unavailable');
    if (current.referredBy) return this.getReferral(userId);

    const referrer = await this.d1.select<ReferralRow>(`SELECT * FROM "Affiliate" WHERE upper("referralCode")=upper(?) LIMIT 1`, [referralCode]);
    const source = referrer.results[0];
    if (!source) throw new NotFoundException('Referral code not found');
    if (source.userId === userId) throw new BadRequestException('Self-referral is not allowed');

    await this.d1.batch([
      {
        sql: `UPDATE "Affiliate" SET "referredBy"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=? AND "referredBy" IS NULL`,
        params: [source.userId, userId],
      },
    ]);
    return this.getReferral(userId);
  }

  async getReferral(userId: string) {
    this.assertD1();
    const result = await this.d1.select<ReferralRow>(
      `SELECT a.*,u."userCode" AS "userCode",ru."userCode" AS "referredByUserCode",(SELECT COUNT(*) FROM "Affiliate" r WHERE r."referredBy"=a."userId") AS "referralCount" FROM "Affiliate" a JOIN "User" u ON u."id"=a."userId" LEFT JOIN "User" ru ON ru."id"=a."referredBy" WHERE a."userId"=? LIMIT 1`,
      [userId],
    );
    const row = result.results[0];
    if (!row) throw new NotFoundException('Referral identity not found');
    return {
      referralCode: row.referralCode,
      referralCount: Number(row.referralCount ?? 0),
      totalEarnings: String(row.totalEarnings ?? '0'),
      referredByUserCode: row.referredByUserCode ?? null,
    };
  }

  async getVip(userId: string) {
    this.assertD1();
    const result = await this.d1.select<VipRow>(
      `SELECT s."id" AS "stateId",s."userId",s."progress",s."evaluatedAt",s."qualifiedAt",v."id" AS "levelId",v."level",v."name",v."threshold",v."benefits" FROM "UserVipState" s JOIN "VipLevel" v ON v."id"=s."vipLevelId" WHERE s."userId"=? LIMIT 1`,
      [userId],
    );
    const row = result.results[0];
    if (!row) throw new NotFoundException('VIP state not found');
    return {
      level: row.level,
      name: row.name,
      progress: String(row.progress ?? '0'),
      threshold: String(row.threshold ?? '0'),
      benefits: this.decodeJson(row.benefits),
      evaluatedAt: row.evaluatedAt,
      qualifiedAt: row.qualifiedAt,
    };
  }

  async listVipLevels() {
    this.assertD1();
    const result = await this.d1.select<Record<string, unknown>>(`SELECT "id","level","name","threshold","benefits","enabled" FROM "VipLevel" WHERE "enabled"=1 ORDER BY "level" ASC`);
    return result.results.map((row) => ({ ...row, benefits: this.decodeJson(row.benefits) }));
  }

  async getAccountSummary(userId: string) {
    const [referral, vip] = await Promise.all([this.getReferral(userId), this.getVip(userId)]);
    return { referral, vip };
  }

  async adminReferralOverview(limit = 100) {
    this.assertD1();
    const bounded = Math.min(Math.max(Math.trunc(limit), 1), 250);
    const result = await this.d1.select<Record<string, unknown>>(
      `SELECT a."userId",u."userCode",u."walletAddress",a."referralCode",a."referredBy",ru."userCode" AS "referredByUserCode",a."totalEarnings",(SELECT COUNT(*) FROM "Affiliate" r WHERE r."referredBy"=a."userId") AS "referralCount",a."createdAt" FROM "Affiliate" a JOIN "User" u ON u."id"=a."userId" LEFT JOIN "User" ru ON ru."id"=a."referredBy" ORDER BY a."createdAt" DESC LIMIT ?`,
      [bounded],
    );
    return result.results;
  }

  async adminVipOverview(limit = 100) {
    this.assertD1();
    const bounded = Math.min(Math.max(Math.trunc(limit), 1), 250);
    const result = await this.d1.select<Record<string, unknown>>(
      `SELECT s."userId",u."userCode",u."walletAddress",v."level",v."name",s."progress",v."threshold",s."evaluatedAt",s."qualifiedAt" FROM "UserVipState" s JOIN "VipLevel" v ON v."id"=s."vipLevelId" JOIN "User" u ON u."id"=s."userId" ORDER BY v."level" DESC,s."progress" DESC LIMIT ?`,
      [bounded],
    );
    return result.results;
  }

  private decodeJson(value: unknown) {
    if (value == null) return null;
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return null; }
  }
}
