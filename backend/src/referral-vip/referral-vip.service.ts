import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../prisma/d1-client';
import { FinancialOperationsService } from '../financial/financial-operations.service';
import { D1WorkerBridgeService } from '../d1/d1-worker-bridge.service';
import { AssignVipDto, UpdateReferralRewardPolicyDto, UpdateVipLevelDto, UpdateVipPolicyDto } from './referral-vip.dto';

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

interface ReferralHistoryAttributionRow {
  referredUserCode: number;
  status: string;
  attributedAt: string | null;
}

interface ReferralHistoryRewardRow {
  id: string;
  referredUserCode: number;
  amount: string;
  asset: string;
  status: string;
  rewardedAt: string;
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
  constructor(
    private readonly d1: D1WorkerBridgeService,
    private readonly financial: FinancialOperationsService,
  ) {}

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
      { sql: `INSERT INTO "UserPreference" ("id","userId","locale","timezone","theme","notificationSettings","tradingSettings","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO NOTHING`, params: [randomUUID(), userId, 'en', 'UTC', 'dark', null, null] },
      { sql: `INSERT INTO "Affiliate" ("id","userId","referralCode","referredBy","totalEarnings","createdAt","updatedAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO NOTHING`, params: [randomUUID(), userId, referralCode, null, '0'] },
      { sql: `INSERT INTO "UserVipState" ("id","userId","vipLevelId","progress","evaluatedAt","qualifiedAt","createdAt","updatedAt") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO NOTHING`, params: [randomUUID(), userId, 'vip-level-0', '0', now, now] },
    ]);
    if (suppliedReferralCode?.trim()) await this.claimReferral(userId, suppliedReferralCode.trim());
    return this.getAccountSummary(userId);
  }

  async claimReferral(userId: string, referralCode: string) {
    this.assertD1();
    const credited = await this.d1.select<{ id: string }>('SELECT "id" FROM "Gate2Deposit" WHERE "userId"=? AND "state"=\'CREDITED\' UNION ALL SELECT "id" FROM "DepositClaim" WHERE "userId"=? AND "state"=\'CREDITED\' LIMIT 1', [userId, userId]);
    if (credited.results.length) throw new BadRequestException('Referral attribution cannot be added after a credited external deposit');
    const own = await this.d1.select<ReferralRow>(`SELECT * FROM "Affiliate" WHERE "userId"=? LIMIT 1`, [userId]);
    const current = own.results[0];
    if (!current) throw new NotFoundException('Referral identity is unavailable');
    if (current.referredBy) return this.getReferral(userId);
    const referrer = await this.d1.select<ReferralRow>(`SELECT * FROM "Affiliate" WHERE upper("referralCode")=upper(?) LIMIT 1`, [referralCode]);
    const source = referrer.results[0];
    if (!source) throw new NotFoundException('Referral code not found');
    if (source.userId === userId) throw new BadRequestException('Self-referral is not allowed');
    await this.d1.batch([{ sql: `UPDATE "Affiliate" SET "referredBy"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=? AND "referredBy" IS NULL`, params: [source.userId, userId] }]);
    return this.getReferral(userId);
  }

  async getReferral(userId: string) {
    this.assertD1();
    const result = await this.d1.select<ReferralRow>(`SELECT a.*,u."userCode" AS "userCode",ru."userCode" AS "referredByUserCode",(SELECT COUNT(*) FROM "Affiliate" r WHERE r."referredBy"=a."userId") AS "referralCount" FROM "Affiliate" a JOIN "User" u ON u."id"=a."userId" LEFT JOIN "User" ru ON ru."id"=a."referredBy" WHERE a."userId"=? LIMIT 1`, [userId]);
    const row = result.results[0];
    if (!row) throw new NotFoundException('Referral identity not found');
    const rewards = await this.d1.select<{ amount: string }>('SELECT "amount" FROM "ReferralRewardEvent" WHERE "referrerUserId"=? AND "status"=\'COMPLETED\'', [userId]);
    const totalEarnings = rewards.results.reduce((sum, reward) => sum.plus(new Prisma.Decimal(reward.amount)), new Prisma.Decimal(0));
    return { referralCode: row.referralCode, referralCount: Number(row.referralCount ?? 0), totalEarnings: totalEarnings.toString(), referredByUserCode: row.referredByUserCode ?? null };
  }

  async getReferralHistory(userId: string, limit = 50, offset = 0) {
    this.assertD1();
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 100) : 50;
    const safeOffset = Number.isFinite(offset) ? Math.min(Math.max(Math.trunc(offset), 0), 1_000_000) : 0;
    const queryLimit = safeLimit + 1;

    const [attributionResult, rewardResult] = await Promise.all([
      this.d1.select<ReferralHistoryAttributionRow>(
        'SELECT u."userCode" AS "referredUserCode",COALESCE(e."status",?) AS "status",e."attributedAt" AS "attributedAt" ' +
        'FROM "Affiliate" referred JOIN "User" u ON u."id"=referred."userId" ' +
        'LEFT JOIN "ReferralAttributionEvent" e ON e."referredUserId"=referred."userId" ' +
        'WHERE referred."referredBy"=? ' +
        'ORDER BY CASE WHEN e."attributedAt" IS NULL THEN 1 ELSE 0 END,e."attributedAt" DESC,u."userCode" DESC LIMIT ? OFFSET ?',
        ['ATTRIBUTED', userId, queryLimit, safeOffset],
      ),
      this.d1.select<ReferralHistoryRewardRow>(
        'SELECT e."id",u."userCode" AS "referredUserCode",e."amount",e."asset",e."status",e."rewardedAt" ' +
        'FROM "ReferralRewardEvent" e JOIN "User" u ON u."id"=e."referredUserId" ' +
        'WHERE e."referrerUserId"=? ORDER BY e."rewardedAt" DESC,e."id" DESC LIMIT ? OFFSET ?',
        [userId, queryLimit, safeOffset],
      ),
    ]);

    const referralRows = attributionResult.results;
    const rewardRows = rewardResult.results;
    return {
      referrals: {
        items: referralRows.slice(0, safeLimit).map((row) => ({
          referredUserCode: Number(row.referredUserCode),
          status: String(row.status),
          attributedAt: row.attributedAt == null ? null : String(row.attributedAt),
        })),
        limit: safeLimit,
        offset: safeOffset,
        hasMore: referralRows.length > safeLimit,
      },
      rewards: {
        items: rewardRows.slice(0, safeLimit).map((row) => ({
          id: String(row.id),
          referredUserCode: Number(row.referredUserCode),
          amount: String(row.amount),
          asset: String(row.asset),
          status: String(row.status),
          rewardedAt: String(row.rewardedAt),
        })),
        limit: safeLimit,
        offset: safeOffset,
        hasMore: rewardRows.length > safeLimit,
      },
    };
  }

  async getVip(userId: string) {
    this.assertD1();
    const result = await this.d1.select<VipRow & { manualOverride?: number; overrideAdminId?: string | null; overrideReason?: string | null; overrideAt?: string | null }>(`SELECT s."id" AS "stateId",s."userId",s."progress",s."evaluatedAt",s."qualifiedAt",s."manualOverride",s."overrideAdminId",s."overrideReason",s."overrideAt",v."id" AS "levelId",v."level",v."name",v."threshold",v."benefits" FROM "UserVipState" s JOIN "VipLevel" v ON v."id"=s."vipLevelId" WHERE s."userId"=? LIMIT 1`, [userId]);
    const row = result.results[0];
    if (!row) throw new NotFoundException('VIP state not found');
    const benefits = this.decodeJson(row.benefits);
    const policy = await this.getVipPolicy();
    const decision = (await this.d1.select<Record<string, unknown>>('SELECT "status","decisionReason","depositRef" FROM "ReferralFirstDepositDecision" WHERE "referredUserId"=? LIMIT 1', [userId])).results[0] ?? null;
    return {
      level: row.level, name: row.name, progress: String(row.progress ?? '0'),
      threshold: String(row.threshold ?? '0'), baseAsset: policy?.baseAsset ?? null,
      benefits, manualOverride: Number(row.manualOverride ?? 0) === 1,
      overrideAdminId: row.overrideAdminId ?? null, overrideReason: row.overrideReason ?? null,
      overrideAt: row.overrideAt ?? null, firstDepositReferral: decision,
      evaluatedAt: row.evaluatedAt, qualifiedAt: row.qualifiedAt,
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

  async adminReferralOverview(limit = 100, userCode?: number) {
    this.assertD1();
    if (userCode !== undefined && (!Number.isInteger(userCode) || userCode < 100000 || userCode > 999999)) throw new BadRequestException('NEXI user code is invalid');
    const bounded = Math.min(Math.max(Math.trunc(limit), 1), 250);
    const filter = userCode === undefined ? '' : 'WHERE u."userCode"=?';
    const params = userCode === undefined ? [bounded] : [userCode, bounded];
    const result = await this.d1.select<Record<string, unknown>>(`SELECT a."userId",u."userCode",wi."address" AS "walletAddress",a."referralCode",a."referredBy",ru."userCode" AS "referredByUserCode",a."totalEarnings",(SELECT COUNT(*) FROM "Affiliate" r WHERE r."referredBy"=a."userId") AS "referralCount",a."createdAt" FROM "Affiliate" a JOIN "User" u ON u."id"=a."userId" LEFT JOIN "WalletIdentity" wi ON wi."userId"=a."userId" LEFT JOIN "User" ru ON ru."id"=a."referredBy" ${filter} ORDER BY a."createdAt" DESC LIMIT ?`, params);
    return result.results;
  }

  async adminVipOverview(limit = 100, userCode?: number) {
    this.assertD1();
    if (userCode !== undefined && (!Number.isInteger(userCode) || userCode < 100000 || userCode > 999999)) throw new BadRequestException('NEXI user code is invalid');
    const bounded = Math.min(Math.max(Math.trunc(limit), 1), 250);
    const filter = userCode === undefined ? '' : 'WHERE u."userCode"=?';
    const params = userCode === undefined ? [bounded] : [userCode, bounded];
    const result = await this.d1.select<Record<string, unknown>>(`SELECT s."userId",u."userCode",wi."address" AS "walletAddress",v."level",v."name",s."progress",v."threshold",v."benefits",s."evaluatedAt",s."qualifiedAt",s."manualOverride",s."overrideAdminId",s."overrideReason",s."overrideAt",d."status" AS "firstDepositStatus",d."decisionReason" AS "firstDepositReason",d."depositRef" AS "firstDepositRef",d."rewardAmount" AS "firstDepositRewardAmount",d."rewardAsset" AS "firstDepositRewardAsset",ru."userCode" AS "firstDepositReferrerUserCode" FROM "UserVipState" s JOIN "VipLevel" v ON v."id"=s."vipLevelId" JOIN "User" u ON u."id"=s."userId" LEFT JOIN "WalletIdentity" wi ON wi."userId"=s."userId" LEFT JOIN "ReferralFirstDepositDecision" d ON d."referredUserId"=s."userId" LEFT JOIN "User" ru ON ru."id"=d."referrerUserId" ${filter} ORDER BY v."level" DESC,s."progress" DESC LIMIT ?`, params);
    const [policy, levels] = await Promise.all([this.getVipPolicy(), this.listAllVipLevels()]);
    return result.results.map((row) => {
      const progress = new Prisma.Decimal(String(row.progress ?? '0'));
      const next = levels
        .filter((level) => level.enabled && level.level > Number(row.level))
        .find((level) => new Prisma.Decimal(level.threshold).gt(progress));
      const firstDepositStatus = row.firstDepositStatus == null ? null : String(row.firstDepositStatus);
      return {
        ...row,
        benefits: this.decodeJson(row.benefits),
        manualOverride: Number(row.manualOverride) === 1,
        baseAsset: policy?.baseAsset ?? null,
        nextTier: next ? {
          level: next.level,
          name: next.name,
          threshold: next.threshold,
          remaining: new Prisma.Decimal(next.threshold).minus(progress).toString(),
        } : null,
        firstDepositReferral: firstDepositStatus ? {
          status: firstDepositStatus,
          reason: row.firstDepositReason == null ? null : String(row.firstDepositReason),
          depositRef: row.firstDepositRef == null ? null : String(row.firstDepositRef),
          rewardAmount: row.firstDepositRewardAmount == null ? null : String(row.firstDepositRewardAmount),
          rewardAsset: row.firstDepositRewardAsset == null ? null : String(row.firstDepositRewardAsset),
          referrerUserCode: row.firstDepositReferrerUserCode == null ? null : Number(row.firstDepositReferrerUserCode),
        } : null,
      };
    });
  }

  async adminUpsertVipLevel(adminId: string, input: UpdateVipLevelDto) {
    this.assertD1();
    if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(input.threshold)) throw new BadRequestException('VIP threshold must be an exact non-negative decimal');
    const threshold = new Prisma.Decimal(input.threshold);
    if (!threshold.isFinite() || threshold.lt(0)) throw new BadRequestException('VIP threshold must be an exact non-negative decimal');
    const existing = await this.d1.select<Record<string, unknown>>(`SELECT "id" FROM "VipLevel" WHERE "level"=? LIMIT 1`, [input.level]);
    const levelId = String(existing.results[0]?.id ?? `vip-level-${input.level}`);
    const auditId = randomUUID();
    await this.d1.batch([
      {
        sql: `INSERT INTO "VipLevel" ("id","level","name","threshold","benefits","enabled","createdAt","updatedAt") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("level") DO UPDATE SET "name"=excluded."name","threshold"=excluded."threshold","benefits"=excluded."benefits","enabled"=excluded."enabled","updatedAt"=CURRENT_TIMESTAMP`,
        params: [levelId, input.level, input.name.trim(), input.threshold.trim(), input.benefits ? JSON.stringify(input.benefits) : null, input.enabled ?? true],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [auditId, adminId, 'VIP_LEVEL_UPSERT', `VIP:${input.level}`, JSON.stringify({ reason: input.reason, name: input.name, threshold: input.threshold, enabled: input.enabled ?? true })],
      },
    ]);
    return { auditId, levels: await this.listAllVipLevels() };
  }

  async adminAssignVip(adminId: string, input: AssignVipDto) {
    this.assertD1();
    const user = await this.d1.select<Record<string, unknown>>(`SELECT "id" FROM "User" WHERE "userCode"=? LIMIT 1`, [input.userCode]);
    const userId = user.results[0]?.id ? String(user.results[0].id) : null;
    if (!userId) throw new NotFoundException('NEXI user not found');
    const level = await this.d1.select<Record<string, unknown>>(`SELECT "id" FROM "VipLevel" WHERE "level"=? AND "enabled"=1 LIMIT 1`, [input.level]);
    const levelId = level.results[0]?.id ? String(level.results[0].id) : null;
    if (!levelId) throw new NotFoundException('VIP level not found');
    const now = new Date().toISOString();
    const auditId = randomUUID();
    await this.d1.batch([
      {
        sql: `INSERT INTO "UserVipState" ("id","userId","vipLevelId","progress","evaluatedAt","qualifiedAt","manualOverride","overrideAdminId","overrideReason","overrideAt","createdAt","updatedAt") VALUES (?,?,?,'0',?,?,1,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO UPDATE SET "vipLevelId"=excluded."vipLevelId","evaluatedAt"=excluded."evaluatedAt","qualifiedAt"=excluded."qualifiedAt","manualOverride"=1,"overrideAdminId"=excluded."overrideAdminId","overrideReason"=excluded."overrideReason","overrideAt"=excluded."overrideAt","updatedAt"=CURRENT_TIMESTAMP`,
        params: [randomUUID(), userId, levelId, now, now, adminId, input.reason.trim(), now],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [auditId, adminId, 'VIP_ASSIGN', `USER:${input.userCode}`, JSON.stringify({ reason: input.reason, level: input.level, progress: input.progress ?? '0' })],
      },
    ]);
    return { auditId, userCode: input.userCode, vip: await this.getVip(userId) };
  }

  async listAllVipLevels(): Promise<Array<{
    id: string;
    level: number;
    name: string;
    threshold: string;
    benefits: unknown;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
  }>> {
    this.assertD1();
    const result = await this.d1.select<Record<string, unknown>>(`SELECT "id","level","name","threshold","benefits","enabled","createdAt","updatedAt" FROM "VipLevel" ORDER BY "level" ASC`);
    return result.results.map((row) => ({
      id: String(row.id),
      level: Number(row.level),
      name: String(row.name),
      threshold: String(row.threshold),
      benefits: this.decodeJson(row.benefits),
      enabled: row.enabled === true || Number(row.enabled) === 1,
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
    }));
  }

  private async readSystemConfig<T>(key: string): Promise<T | null> {
    const result = await this.d1.select<{ value: string }>('SELECT "value" FROM "SystemConfig" WHERE "key"=? LIMIT 1', [key]);
    if (!result.results[0]) return null;
    try { return JSON.parse(result.results[0].value) as T; } catch { return null; }
  }

  private async saveSystemConfig(adminId: string, key: string, value: Record<string, unknown>, action: string, reason: string) {
    const auditId = randomUUID();
    await this.d1.batch([
      { sql: 'INSERT INTO "SystemConfig" ("id","key","value","description","updatedAt") VALUES (?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT("key") DO UPDATE SET "value"=excluded."value","description"=excluded."description","updatedAt"=CURRENT_TIMESTAMP', params: [randomUUID(), key, JSON.stringify(value), reason.trim()] },
      { sql: 'INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)', params: [auditId, adminId, action, key, JSON.stringify({ ...value, reason: reason.trim() })] },
    ]);
    return auditId;
  }

  async getVipPolicy() {
    this.assertD1();
    return this.readSystemConfig<{ baseAsset: string }>('admin.vip.policy');
  }

  async adminUpsertVipPolicy(adminId: string, input: UpdateVipPolicyDto) {
    this.assertD1();
    const baseAsset = input.baseAsset.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,20}$/.test(baseAsset)) throw new BadRequestException('VIP base asset is invalid');
    const existing = await this.getVipPolicy();
    if (existing?.baseAsset && existing.baseAsset !== baseAsset) {
      const recorded = await this.d1.select<{ count: number }>('SELECT COUNT(*) AS "count" FROM "VipDepositQualification"');
      if (Number(recorded.results[0]?.count ?? 0) > 0) throw new BadRequestException('VIP base asset is immutable after deposit qualification records exist');
    }
    const auditId = await this.saveSystemConfig(adminId, 'admin.vip.policy', { baseAsset }, 'VIP_POLICY_UPDATED', input.reason);
    return { auditId, policy: { baseAsset } };
  }

  async getReferralRewardPolicy() {
    this.assertD1();
    return this.readSystemConfig<{ enabled: boolean; mode: 'FIXED' | 'PERCENT'; value: string | null; asset: string | null; minimumFirstDeposit: string | null; baseAsset: string | null }>('admin.referral.rewardPolicy');
  }

  async adminUpsertReferralRewardPolicy(adminId: string, input: UpdateReferralRewardPolicyDto) {
    this.assertD1();
    const mode = input.mode;
    if (!['FIXED', 'PERCENT'].includes(mode)) throw new BadRequestException('Referral reward mode is invalid');
    const valueText = input.value?.trim() || null;
    const minimumText = input.minimumFirstDeposit?.trim() || null;
    const asset = input.asset?.trim().toUpperCase() || null;
    if ((valueText && !/^(?:0|[1-9][0-9]*)(?:[.][0-9]+)?$/.test(valueText)) || (minimumText && !/^(?:0|[1-9][0-9]*)(?:[.][0-9]+)?$/.test(minimumText))) {
      throw new BadRequestException('Referral reward amounts must be exact non-negative decimals');
    }
    const vipPolicy = await this.getVipPolicy();
    if (input.enabled && (!valueText || !minimumText || !asset || !vipPolicy?.baseAsset)) {
      throw new BadRequestException('Configure a base asset, reward value, reward asset, and minimum first deposit before enabling rewards');
    }
    const value = valueText ? new Prisma.Decimal(valueText) : null;
    const minimumFirstDeposit = minimumText ? new Prisma.Decimal(minimumText) : null;
    if ((asset && !/^[A-Z0-9]{2,20}$/.test(asset)) || (value && (!value.isFinite() || value.lte(0)))
      || (minimumFirstDeposit && (!minimumFirstDeposit.isFinite() || minimumFirstDeposit.lt(0)))
      || (input.enabled && mode === 'PERCENT' && value!.gt(100))) {
      throw new BadRequestException('Referral reward policy values are invalid');
    }
    const policy = {
      enabled: input.enabled,
      mode,
      value: value?.toString() ?? null,
      asset,
      minimumFirstDeposit: minimumFirstDeposit?.toString() ?? null,
      baseAsset: vipPolicy?.baseAsset ?? null,
    };
    const auditId = await this.saveSystemConfig(adminId, 'admin.referral.rewardPolicy', policy, 'REFERRAL_REWARD_POLICY_UPDATED', input.reason);
    return { auditId, policy };
  }

  async processCreditedExternalDeposit(sourceType: 'DEPOSIT' | 'DEPOSIT_CLAIM', sourceId: string) {
    this.assertD1();
    if (!['DEPOSIT', 'DEPOSIT_CLAIM'].includes(sourceType) || !sourceId.trim()) throw new BadRequestException('External deposit reference is invalid');
    const sourceSql = sourceType === 'DEPOSIT'
      ? 'SELECT d."userId",d."asset",d."amount",d."creditPostingId",p."createdAt" AS "creditedAt" FROM "Gate2Deposit" d JOIN "LedgerPosting" p ON p."id"=d."creditPostingId" WHERE d."id"=? AND d."state"=\'CREDITED\' AND d."creditPostingId" IS NOT NULL LIMIT 1'
      : 'SELECT d."userId",d."asset",d."claimedAmount" AS "amount",d."creditedLedgerPostingId" AS "creditPostingId",p."createdAt" AS "creditedAt" FROM "DepositClaim" d JOIN "LedgerPosting" p ON p."id"=d."creditedLedgerPostingId" WHERE d."id"=? AND d."state"=\'CREDITED\' AND d."creditedLedgerPostingId" IS NOT NULL LIMIT 1';
    const source = (await this.d1.select<{ userId: string; asset: string; amount: string; creditPostingId: string; creditedAt: string }>(sourceSql, [sourceId])).results[0];
    if (!source) return { status: 'NOT_CREDITED' };
    const depositRef = `${sourceType}:${sourceId}`;
    const invalidation = (await this.d1.select<{ status: string }>(
      'SELECT "status" FROM "DepositInvalidationRecovery" WHERE "depositRef"=? LIMIT 1', [depositRef],
    )).results[0];
    if (invalidation) return { status: 'DEPOSIT_INVALIDATED', depositRef };
    const vipPolicy = await this.getVipPolicy();
    if (vipPolicy?.baseAsset) {
      let contribution = (await this.d1.select<{ baseAmount: string }>('SELECT "baseAmount" FROM "VipDepositQualification" WHERE "depositRef"=? AND "status"=\'ACTIVE\' LIMIT 1', [depositRef])).results[0];
      if (!contribution) {
        const converted = await this.financial.convertExactAmount({ fromAsset: source.asset, toAsset: vipPolicy.baseAsset, amount: source.amount });
        await this.d1.batch([{ sql: 'INSERT OR IGNORE INTO "VipDepositQualification" ("id","depositRef","sourceType","sourceId","userId","asset","amount","baseAsset","baseAmount","rate","rateSource","status","creditedAt","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,\'ACTIVE\',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)', params: [randomUUID(), depositRef, sourceType, sourceId, source.userId, source.asset, source.amount, vipPolicy.baseAsset, converted.amount, converted.rate, converted.source, source.creditedAt] }]);
      }
      const contributions = await this.d1.select<{ baseAmount: string }>('SELECT "baseAmount" FROM "VipDepositQualification" WHERE "userId"=? AND "baseAsset"=? AND "status"=\'ACTIVE\'', [source.userId, vipPolicy.baseAsset]);
      const total = contributions.results.reduce((sum, row) => sum.plus(new Prisma.Decimal(row.baseAmount)), new Prisma.Decimal(0));
      const levelRows = (await this.d1.select<{ id: string; level: number; threshold: string }>('SELECT "id","level","threshold" FROM "VipLevel" WHERE "enabled"=1 ORDER BY "level" ASC')).results;
      const eligible = levelRows.filter(row => new Prisma.Decimal(row.threshold).lte(total));
      const target = eligible.at(-1);
      const current = (await this.d1.select<{ manualOverride: number; level: number }>('SELECT s."manualOverride",v."level" FROM "UserVipState" s JOIN "VipLevel" v ON v."id"=s."vipLevelId" WHERE s."userId"=? LIMIT 1', [source.userId])).results[0];
      if (target && current?.manualOverride !== 1 && target.level >= Number(current?.level ?? 0)) {
        const now = new Date().toISOString();
        await this.d1.batch([{ sql: 'UPDATE "UserVipState" SET "vipLevelId"=?,"progress"=?,"evaluatedAt"=?,"qualifiedAt"=CASE WHEN ?>0 THEN COALESCE("qualifiedAt",?) ELSE NULL END,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=? AND COALESCE("manualOverride",0)=0', params: [target.id, total.toString(), now, target.level, now, source.userId] }]);
      } else {
        await this.d1.batch([{ sql: 'UPDATE "UserVipState" SET "progress"=?,"evaluatedAt"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=? AND COALESCE("manualOverride",0)=0', params: [total.toString(), new Date().toISOString(), source.userId] }]);
      }
    }

    const rewardPolicy = await this.getReferralRewardPolicy();
    const candidates = (await this.d1.select<{ sourceType: string; sourceId: string; asset: string; amount: string; creditedAt: string }>(
      'SELECT "sourceType","sourceId","asset","amount","creditedAt" FROM (' +
      'SELECT \'DEPOSIT\' AS "sourceType",d."id" AS "sourceId",d."asset",d."amount",p."createdAt" AS "creditedAt" FROM "Gate2Deposit" d JOIN "LedgerPosting" p ON p."id"=d."creditPostingId" WHERE d."userId"=? AND d."state"=\'CREDITED\' AND NOT EXISTS (SELECT 1 FROM "DepositInvalidationRecovery" r WHERE r."depositRef"=\'DEPOSIT:\' || d."id") ' +
      'UNION ALL SELECT \'DEPOSIT_CLAIM\' AS "sourceType",d."id" AS "sourceId",d."asset",d."claimedAmount" AS "amount",p."createdAt" AS "creditedAt" FROM "DepositClaim" d JOIN "LedgerPosting" p ON p."id"=d."creditedLedgerPostingId" WHERE d."userId"=? AND d."state"=\'CREDITED\' AND NOT EXISTS (SELECT 1 FROM "DepositInvalidationRecovery" r WHERE r."depositRef"=\'DEPOSIT_CLAIM:\' || d."id")' +
      ') ORDER BY "creditedAt" ASC,"sourceType" ASC,"sourceId" ASC',
      [source.userId, source.userId],
    )).results;
    // The first valid credited external deposit decides referral eligibility once.
    // A later deposit must never turn an ineligible first deposit into a reward.
    const firstDeposit = candidates[0];
    if (!firstDeposit) return { status: 'NO_VALID_DEPOSIT', depositRef };
    const firstConversion = vipPolicy?.baseAsset
      ? await this.financial.convertExactAmount({ fromAsset: firstDeposit.asset, toAsset: vipPolicy.baseAsset, amount: firstDeposit.amount })
      : { amount: firstDeposit.amount, rate: '1', source: 'unconfigured-policy' };
    const firstQualifying = { sourceType: firstDeposit.sourceType, sourceId: firstDeposit.sourceId, baseAmount: firstConversion.amount, rate: firstConversion.rate, rateSource: firstConversion.source };
    if (`${firstQualifying.sourceType}:${firstQualifying.sourceId}` !== depositRef) return { status: 'VIP_UPDATED_NOT_FIRST_QUALIFYING_DEPOSIT' };
    let decision = (await this.d1.select<Record<string, unknown>>('SELECT * FROM "ReferralFirstDepositDecision" WHERE "referredUserId"=? LIMIT 1', [source.userId])).results[0];
    if (!decision) {
      const attribution = (await this.d1.select<{ referredBy: string | null }>('SELECT "referredBy" FROM "Affiliate" WHERE "userId"=? LIMIT 1', [source.userId])).results[0];
      const baseAsset = vipPolicy?.baseAsset ?? source.asset;
      const converted = { amount: firstQualifying.baseAmount, rate: firstQualifying.rate, source: firstQualifying.rateSource };
      let status = 'NO_REFERRER';
      let decisionReason = 'No immutable referral attribution exists';
      let rewardAsset: string | null = null;
      let rewardAmount: string | null = null;
      let policySnapshot: string | null = null;
      if (attribution?.referredBy) {
        if (!vipPolicy?.baseAsset || !rewardPolicy) {
          status = 'POLICY_UNCONFIGURED'; decisionReason = 'Reward and base-asset policy were not configured at first credited deposit';
        } else if (!rewardPolicy.enabled) {
          status = 'DISABLED'; decisionReason = 'Referral rewards were disabled at first credited deposit';
        } else if (new Prisma.Decimal(converted.amount).lt(rewardPolicy.minimumFirstDeposit)) {
          status = 'BELOW_MINIMUM'; decisionReason = 'The first credited external deposit was below the configured minimum';
        } else {
          rewardAsset = rewardPolicy.asset;
          const baseReward = rewardPolicy.mode === 'FIXED'
            ? new Prisma.Decimal(rewardPolicy.value)
            : new Prisma.Decimal(converted.amount).mul(rewardPolicy.value).div(100);
          const payout = rewardPolicy.mode === 'FIXED'
            ? { amount: baseReward.toString() }
            : await this.financial.convertExactAmount({ fromAsset: rewardPolicy.baseAsset, toAsset: rewardPolicy.asset, amount: baseReward.toString() });
          rewardAmount = payout.amount;
          policySnapshot = JSON.stringify({ ...rewardPolicy, depositRef, depositBaseAmount: converted.amount, depositBaseAsset: baseAsset });
          status = new Prisma.Decimal(rewardAmount).gt(0) ? 'REWARD_PENDING' : 'ZERO_REWARD';
          decisionReason = status === 'REWARD_PENDING' ? 'First credited external deposit met configured policy' : 'Configured policy calculated a zero reward';
        }
      }
      await this.d1.batch([{ sql: 'INSERT OR IGNORE INTO "ReferralFirstDepositDecision" ("id","referredUserId","referrerUserId","depositRef","depositBaseAsset","depositBaseAmount","status","decisionReason","rewardAsset","rewardAmount","policySnapshot","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)', params: [randomUUID(), source.userId, attribution?.referredBy ?? null, depositRef, baseAsset, converted.amount, status, decisionReason, rewardAsset, rewardAmount, policySnapshot] }]);
      decision = (await this.d1.select<Record<string, unknown>>('SELECT * FROM "ReferralFirstDepositDecision" WHERE "referredUserId"=? LIMIT 1', [source.userId])).results[0];
    }
    if ((decision?.status === 'REWARD_PENDING' || decision?.status === 'REWARD_POSTING') && decision.referrerUserId && decision.rewardAsset && decision.rewardAmount) {
      await this.d1.batch([{
        sql: `UPDATE "ReferralFirstDepositDecision" SET "status"='REWARD_POSTING',"updatedAt"=CURRENT_TIMESTAMP WHERE "referredUserId"=? AND "status"='REWARD_PENDING' AND NOT EXISTS (SELECT 1 FROM "DepositInvalidationRecovery" WHERE "depositRef"=? AND "status"='PENDING')`,
        params: [source.userId, depositRef],
      }]);
      decision = (await this.d1.select<Record<string, unknown>>(`SELECT * FROM "ReferralFirstDepositDecision" WHERE "referredUserId"=? LIMIT 1`, [source.userId])).results[0];
      const pendingInvalidation = (await this.d1.select<{ status: string }>(`SELECT "status" FROM "DepositInvalidationRecovery" WHERE "depositRef"=? LIMIT 1`, [depositRef])).results[0];
      if (pendingInvalidation && decision?.status === 'REWARD_POSTING') {
        await this.d1.batch([{ sql: `UPDATE "ReferralFirstDepositDecision" SET "status"='DEPOSIT_INVALIDATED',"decisionReason"='Deposit invalidation is pending',"updatedAt"=CURRENT_TIMESTAMP WHERE "referredUserId"=? AND "status"='REWARD_POSTING'`, params: [source.userId] }]);
        return { status: 'DEPOSIT_INVALIDATED', depositRef };
      }
      if (decision?.status === 'REWARD_POSTING' && decision.referrerUserId && decision.rewardAsset && decision.rewardAmount) {
      const posting = await this.financial.postReferralReward({
        referrerUserId: String(decision.referrerUserId), referredUserId: source.userId,
        depositRef: String(decision.depositRef), asset: String(decision.rewardAsset), amount: String(decision.rewardAmount),
      });
      await this.d1.batch([
        { sql: 'UPDATE "ReferralFirstDepositDecision" SET "status"=\'REWARDED\',"ledgerPostingId"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "referredUserId"=? AND "status"=\'REWARD_POSTING\'', params: [posting.postingId, source.userId] },
        { sql: 'INSERT OR IGNORE INTO "ReferralRewardEvent" ("id","referrerUserId","referredUserId","ledgerPostingId","amount","asset","status","rewardedAt","createdAt") VALUES (?,?,?,?,?,?,\'COMPLETED\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)', params: [randomUUID(), String(decision.referrerUserId), source.userId, posting.postingId, String(decision.rewardAmount), String(decision.rewardAsset)] },
      ]);
      decision = { ...decision, status: 'REWARDED', ledgerPostingId: posting.postingId };
      }
    }
    return { status: String(decision?.status ?? 'DECISION_RECORDED'), depositRef, vipProgressUpdated: Boolean(vipPolicy?.baseAsset), referralDecision: decision?.status ?? null };
  }

  async adminInvalidateExternalDeposit(adminId: string, sourceType: 'DEPOSIT' | 'DEPOSIT_CLAIM', sourceId: string, reason: string) {
    this.assertD1();
    if (!['DEPOSIT', 'DEPOSIT_CLAIM'].includes(sourceType) || !sourceId.trim()) throw new BadRequestException('External deposit reference is invalid');
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3) throw new BadRequestException('Deposit invalidation reason must contain at least 3 characters');
    const depositRef = `${sourceType}:${sourceId}`;
    const sourceSql = sourceType === 'DEPOSIT'
      ? `SELECT d."userId",d."asset",d."amount" FROM "Gate2Deposit" d WHERE d."id"=? AND d."state"='CREDITED' AND d."creditPostingId" IS NOT NULL LIMIT 1`
      : `SELECT d."userId",d."asset",d."claimedAmount" AS "amount" FROM "DepositClaim" d WHERE d."id"=? AND d."state"='CREDITED' AND d."creditedLedgerPostingId" IS NOT NULL LIMIT 1`;
    const source = (await this.d1.select<{ userId: string; asset: string; amount: string }>(sourceSql, [sourceId])).results[0];
    if (!source) throw new NotFoundException('Successfully credited external deposit not found');
    await this.d1.batch([{
      sql: `INSERT OR IGNORE INTO "DepositInvalidationRecovery" ("id","depositRef","userId","asset","amount","status","reason","createdAt","updatedAt") VALUES (?,?,?,?,?,'PENDING',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      params: [randomUUID(), depositRef, source.userId, source.asset, source.amount, normalizedReason],
    }]);
    const recovery = (await this.d1.select<{ status: string; reason: string }>(
      `SELECT "status","reason" FROM "DepositInvalidationRecovery" WHERE "depositRef"=? LIMIT 1`, [depositRef],
    )).results[0];
    if (!recovery || recovery.reason !== normalizedReason) throw new BadRequestException('Deposit invalidation already exists with a different reason');
    if (recovery.status === 'RECOVERED') return { depositRef, status: recovery.status, replayed: true };

    let decision = (await this.d1.select<Record<string, unknown>>(
      `SELECT * FROM "ReferralFirstDepositDecision" WHERE "depositRef"=? LIMIT 1`, [depositRef],
    )).results[0];
    if (decision?.status === 'REWARD_POSTING') {
      throw new ServiceUnavailableException('Referral reward posting is in flight; retry deposit invalidation after the event settles');
    }
    if (decision?.status === 'REWARD_PENDING') {
      await this.d1.batch([{
        sql: `UPDATE "ReferralFirstDepositDecision" SET "status"='DEPOSIT_INVALIDATED',"decisionReason"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "depositRef"=? AND "status"='REWARD_PENDING' AND EXISTS (SELECT 1 FROM "DepositInvalidationRecovery" WHERE "depositRef"=? AND "status"='PENDING')`,
        params: [normalizedReason, depositRef, depositRef],
      }]);
      decision = (await this.d1.select<Record<string, unknown>>(
        `SELECT * FROM "ReferralFirstDepositDecision" WHERE "depositRef"=? LIMIT 1`, [depositRef],
      )).results[0];
      if (decision?.status === 'REWARD_POSTING') {
        throw new ServiceUnavailableException('Referral reward posting is in flight; retry deposit invalidation after the event settles');
      }
    }

    const principal = await this.financial.applyAdminFinancialCorrection({
      userId: source.userId, asset: source.asset, amount: source.amount, direction: 'DEBIT', scope: 'MAIN',
      idempotencyKey: `deposit-invalidation:principal:${depositRef}`,
      reason: `Invalid credited deposit ${depositRef}: ${normalizedReason}`, adminId,
    });
    const principalPostingId = String((principal as any)?.posting?.postingId ?? '');
    if (!principalPostingId) throw new ServiceUnavailableException('Deposit recovery correction did not return its ledger posting');

    let rewardPostingId: string | null = null;
    if (decision?.status === 'REWARDED' && decision.referrerUserId && decision.rewardAsset && decision.rewardAmount) {
      const reward = await this.financial.applyAdminFinancialCorrection({
        userId: String(decision.referrerUserId), asset: String(decision.rewardAsset), amount: String(decision.rewardAmount),
        direction: 'DEBIT', scope: 'MAIN', idempotencyKey: `deposit-invalidation:referral-reward:${depositRef}`,
        reason: `Recover referral reward for invalid deposit ${depositRef}: ${normalizedReason}`, adminId,
      });
      rewardPostingId = String((reward as any)?.posting?.postingId ?? '');
      if (!rewardPostingId) throw new ServiceUnavailableException('Referral reward recovery did not return its ledger posting');
    }

    const auditId = randomUUID();
    const now = new Date().toISOString();
    await this.d1.batch([
      { sql: `UPDATE "VipDepositQualification" SET "status"='INVALIDATED',"invalidatedAt"=?,"invalidationReason"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "depositRef"=?`, params: [now, normalizedReason, depositRef] },
      { sql: `UPDATE "ReferralFirstDepositDecision" SET "status"=?,"decisionReason"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "depositRef"=? AND "status"='REWARDED'`, params: [rewardPostingId ? 'REWARD_RECOVERED' : 'DEPOSIT_INVALIDATED', normalizedReason, depositRef] },
      ...(rewardPostingId && decision?.ledgerPostingId ? [{ sql: `UPDATE "ReferralRewardEvent" SET "status"='RECOVERED' WHERE "ledgerPostingId"=? AND "status"='COMPLETED'`, params: [String(decision.ledgerPostingId)] }] : []),
      { sql: `UPDATE "DepositInvalidationRecovery" SET "status"='RECOVERED',"ledgerPostingId"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "depositRef"=? AND "status"='PENDING'`, params: [principalPostingId, depositRef] },
      { sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`, params: [auditId, adminId, 'EXTERNAL_DEPOSIT_INVALIDATED', depositRef, JSON.stringify({ reason: normalizedReason, principalPostingId, rewardPostingId })] },
    ]);

    const vipPolicy = await this.getVipPolicy();
    if (vipPolicy?.baseAsset) {
      const totalRows = await this.d1.select<{ baseAmount: string }>(
        `SELECT "baseAmount" FROM "VipDepositQualification" WHERE "userId"=? AND "baseAsset"=? AND "status"='ACTIVE'`,
        [source.userId, vipPolicy.baseAsset],
      );
      const total = totalRows.results.reduce((sum, row) => sum.plus(new Prisma.Decimal(row.baseAmount)), new Prisma.Decimal(0));
      // Invalidated deposits reduce qualifying progress, never an already attained VIP level.
      await this.d1.batch([{
        sql: `UPDATE "UserVipState" SET "progress"=?,"evaluatedAt"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=? AND COALESCE("manualOverride",0)=0`,
        params: [total.toString(), now, source.userId],
      }]);
    }
    return { auditId, depositRef, status: 'RECOVERED', principalPostingId, rewardPostingId, replayed: false };
  }

  async adminClearVipOverride(adminId: string, userCode: number, reason: string) {
    this.assertD1();
    if (!reason?.trim()) throw new BadRequestException('Override removal reason is required');
    const user = (await this.d1.select<{ id: string }>('SELECT "id" FROM "User" WHERE "userCode"=? LIMIT 1', [userCode])).results[0];
    if (!user) throw new NotFoundException('NEXI user not found');
    const auditId = randomUUID();
    await this.d1.batch([
      { sql: 'UPDATE "UserVipState" SET "manualOverride"=0,"overrideAdminId"=NULL,"overrideReason"=NULL,"overrideAt"=NULL,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=?', params: [user.id] },
      { sql: 'INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)', params: [auditId, adminId, 'VIP_OVERRIDE_CLEARED', `USER:${userCode}`, JSON.stringify({ reason: reason.trim() })] },
    ]);
    return { auditId, userCode, vip: await this.getVip(user.id) };
  }

  private decodeJson(value: unknown) {
    if (value == null) return null;
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return null; }
  }
}
