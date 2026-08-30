import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { D1WorkerBridgeService } from '../d1/d1-worker-bridge.service';
import { D1BridgeParameter } from '../d1/d1-worker-bridge.service';
import { ReferralVipService } from '../referral-vip/referral-vip.service';
import { UpdatePreferencesDto, UpdateProfileDto } from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly d1: D1WorkerBridgeService,
    private readonly referralVip: ReferralVipService,
  ) {}

  private assertD1() {
    if (!this.d1.isEnabled()) throw new ServiceUnavailableException('D1 profile authority is unavailable');
  }

  async getProfile(userId: string) {
    this.assertD1();
    const result = await this.d1.select<Record<string, unknown>>(
      `SELECT u."id",u."userCode",u."email",u."displayName",u."role",u."createdAt",u."lastActive",wi."address" AS "walletAddress",wi."chainId",k."status" AS "kycStatus",k."country",p."locale",p."timezone",p."theme",p."notificationSettings",p."tradingSettings" FROM "User" u LEFT JOIN "WalletIdentity" wi ON wi."userId"=u."id" LEFT JOIN "KYC" k ON k."userId"=u."id" LEFT JOIN "UserPreference" p ON p."userId"=u."id" WHERE u."id"=? LIMIT 1`,
      [userId],
    );
    const row = result.results[0];
    if (!row) throw new NotFoundException('Profile not found');
    await this.referralVip.ensureAccountState(userId, Number(row.userCode));
    const account = await this.referralVip.getAccountSummary(userId);
    return {
      id: String(row.userCode),
      email: row.email ?? null,
      displayName: row.displayName ?? null,
      walletAddress: row.walletAddress ?? null,
      chainId: row.chainId ?? null,
      kycStatus: row.kycStatus ?? 'NOT_SUBMITTED',
      country: row.country ?? null,
      role: row.role,
      createdAt: row.createdAt,
      lastActive: row.lastActive,
      preferences: {
        locale: row.locale ?? 'en',
        timezone: row.timezone ?? 'UTC',
        theme: row.theme ?? 'dark',
        notificationSettings: this.decodeJson(row.notificationSettings),
        tradingSettings: this.decodeJson(row.tradingSettings),
      },
      referral: account.referral,
      vip: account.vip,
    };
  }

  async updateProfile(userId: string, patch: UpdateProfileDto) {
    this.assertD1();
    const assignments: string[] = [];
    const params: D1BridgeParameter[] = [];
    if (patch.displayName !== undefined) { assignments.push(`"displayName"=?`); params.push(patch.displayName.trim()); }
    if (patch.email !== undefined) { assignments.push(`"email"=?`); params.push(patch.email.trim().toLowerCase()); }
    if (assignments.length) {
      assignments.push(`"updatedAt"=CURRENT_TIMESTAMP`);
      params.push(userId);
      await this.d1.batch([{ sql: `UPDATE "User" SET ${assignments.join(',')} WHERE "id"=?`, params }]);
    }
    return this.getProfile(userId);
  }

  async getPreferences(userId: string) {
    const profile = await this.getProfile(userId);
    return profile.preferences;
  }

  async updatePreferences(userId: string, patch: UpdatePreferencesDto) {
    this.assertD1();
    const current = await this.getPreferences(userId);
    const notificationSettings = patch.notificationSettings === undefined ? current.notificationSettings : patch.notificationSettings;
    const tradingSettings = patch.tradingSettings === undefined ? current.tradingSettings : patch.tradingSettings;
    await this.d1.batch([{
      sql: `INSERT INTO "UserPreference" ("id","userId","locale","timezone","theme","notificationSettings","tradingSettings","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO UPDATE SET "locale"=excluded."locale","timezone"=excluded."timezone","theme"=excluded."theme","notificationSettings"=excluded."notificationSettings","tradingSettings"=excluded."tradingSettings","updatedAt"=CURRENT_TIMESTAMP`,
      params: [
        randomUUID(), userId,
        String(patch.locale ?? current.locale ?? 'en'),
        String(patch.timezone ?? current.timezone ?? 'UTC'),
        String(patch.theme ?? current.theme ?? 'dark'),
        notificationSettings == null ? null : JSON.stringify(notificationSettings),
        tradingSettings == null ? null : JSON.stringify(tradingSettings),
      ],
    }]);
    return this.getPreferences(userId);
  }

  private decodeJson(value: unknown) {
    if (value == null) return null;
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return null; }
  }
}
