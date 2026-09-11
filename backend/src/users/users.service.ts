import { Injectable } from '@nestjs/common';
import { User, Prisma } from '../prisma/d1-client';
import * as bcrypt from 'bcrypt';
import { SignupDto } from '../auth/auth.dto';
import { randomInt } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

const PASSWORD_HASH_ROUNDS = 12;
const USER_CODE_MIN = 100000;
const USER_CODE_MAX = 1000000;
type UserWithKyc = Prisma.UserGetPayload<{ include: { kyc: { select: { status: true } } } }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly d1: D1FinancialCommandGateway,
  ) {}

  async findOne(email: string): Promise<UserWithKyc | null> {
    const user = await this.d1.getUserByEmail(email);
    if (!user) return null;
    return { ...user, kyc: user.kycStatus ? { status: user.kycStatus } : null } as unknown as UserWithKyc;
  }
  
  async findById(id: string): Promise<User | null> {
      return (await this.d1.getUserById(id)) as unknown as User | null;
  }

  async findByUserCode(userCode: number): Promise<Record<string, unknown> | null> {
    return this.d1.getUserByUserCode(userCode);
  }

  async updateProfile(userId: string, patch: { displayName?: string; email?: string }) {
    return this.d1.updateUserProfile(userId, patch);
  }

  async getPreferences(userId: string) {
    return this.normalizePreference(await this.d1.getUserPreference(userId));
  }

  async updatePreferences(userId: string, patch: { locale?: string; timezone?: string; theme?: string; notificationSettings?: Record<string, boolean>; tradingSettings?: Record<string, unknown> }) {
    return this.normalizePreference(await this.d1.updateUserPreference(userId, patch));
  }

  private normalizePreference(row: Record<string, unknown>) {
    const decode = (value: unknown) => {
      if (typeof value !== 'string') return value ?? null;
      try { return JSON.parse(value); } catch { return null; }
    };
    return {
      ...row,
      notificationSettings: decode(row.notificationSettings),
      tradingSettings: decode(row.tradingSettings),
    };
  }

  async createUser(data: SignupDto): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, PASSWORD_HASH_ROUNDS);

    const user = await this.d1.createPasswordUser({
      id: randomUUID(),
      userCode: randomInt(USER_CODE_MIN, USER_CODE_MAX),
      email: data.email,
      password: hashedPassword,
    });
    return user as unknown as User;
  }

  async createAdminUser(data: SignupDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, PASSWORD_HASH_ROUNDS);
    const user = await this.d1.createPasswordAdminUser({
      id: randomUUID(),
      userCode: randomInt(USER_CODE_MIN, USER_CODE_MAX),
      email: data.email,
      password: hashedPassword,
    });
    return user as unknown as User;
  }

  async changeSecurityPassword(userId: string, currentSecurityPassword: string | undefined, newSecurityPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User is not available');
    if (user.securityPasswordHash) {
      if (!currentSecurityPassword) throw new Error('Current security password is required');
      const matches = await bcrypt.compare(currentSecurityPassword, user.securityPasswordHash);
      if (!matches) throw new Error('Current security password is incorrect');
    }
    const hashed = await bcrypt.hash(newSecurityPassword, PASSWORD_HASH_ROUNDS);
    await this.d1.updateUserSecurityPassword(userId, hashed);
  }

  async getUserMfa(userId: string): Promise<Record<string, unknown> | null> {
    return this.d1.getUserMfa(userId);
  }

  async updateUserMfa(userId: string, enabled: boolean, secret: string | null, backupCodes: string | null): Promise<Record<string, unknown>> {
    return this.d1.upsertUserMfa(userId, enabled, secret, backupCodes);
  }
}
