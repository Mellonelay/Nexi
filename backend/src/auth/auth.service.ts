import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './auth.dto';
import { AuthSurface, LoginUser } from './auth.types';
import { Role } from '@prisma/client';
import { randomUUID, randomBytes } from 'node:crypto';
import { AuthSessionService } from './auth-session.service';
import type { AuthSessionMetadata } from './auth-session.service';
import { AuthSecurityEventsService } from './auth-security-events.service';
import { TOTP } from 'otpauth';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Optional() private readonly authSessionService?: AuthSessionService,
    @Optional() private readonly securityEvents?: AuthSecurityEventsService,
  ) {}

  async validateUser(credentials: LoginDto): Promise<LoginUser | null> {
    const user = await this.usersService.findOne(credentials.email);
    if (user?.password && (await bcrypt.compare(credentials.password, user.password))) {
      return {
        id: user.id,
        publicId: user.userCode.toString(),
        email: user.email,
        role: user.role,
        kycStatus: user.kyc?.status ?? 'NOT_SUBMITTED',
      };
    }
    return null;
  }

  async validateAdmin(credentials: LoginDto): Promise<LoginUser | null> {
    const user = await this.validateUser(credentials);
    return user?.role === Role.ADMIN ? user : null;
  }

  async login(user: LoginUser, surface: AuthSurface = 'PUBLIC', metadata: AuthSessionMetadata = {}) {
    const session = this.authSessionService
      ? Object.keys(metadata).length > 0
        ? await this.authSessionService.createSession(user.id, surface, metadata)
        : await this.authSessionService.createSession(user.id, surface)
      : undefined;
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      surface,
      ...(session ? { sid: session.sessionId, jti: randomUUID() } : {}),
    };
    return {
      access_token: this.jwtService.sign(payload),
      ...(session ? { refresh_token: session.refreshToken } : {}),
      user: {
          id: user.publicId ?? user.id,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus || 'NOT_SUBMITTED'
      }
    };
  }

  async refresh(refreshToken: string, surface: AuthSurface) {
    if (!this.authSessionService) {
      throw new UnauthorizedException('Session persistence is unavailable');
    }
    const rotated = await this.authSessionService.rotate(refreshToken, surface);
    const user = await this.usersService.findById(rotated.userId);
    if (!user || (surface === 'ADMIN' && user.role !== Role.ADMIN)) {
      await this.authSessionService.revokeSession(rotated.userId, surface, rotated.sessionId, 'SECURITY_ACTION');
      throw new UnauthorizedException('Authentication principal is not authorized');
    }
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      surface,
      sid: rotated.sessionId,
      jti: randomUUID(),
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: rotated.refreshToken,
      user: { id: user.userCode.toString(), email: user.email, role: user.role, kycStatus: 'NOT_SUBMITTED' },
    };
  }

  async updateProfile(userId: string, patch: { displayName?: string; email?: string }) {
    await this.usersService.updateProfile(userId, patch);
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Authentication principal is unavailable');
    return this.usersService.findById(userId);
  }

  async getPreferences(userId: string) {
    return this.usersService.getPreferences(userId);
  }

  async updatePreferences(userId: string, patch: { locale?: string; timezone?: string; theme?: string; notificationSettings?: Record<string, boolean>; tradingSettings?: Record<string, unknown> }) {
    return this.usersService.updatePreferences(userId, patch);
  }

  async changeSecurityPassword(userId: string, currentSecurityPassword: string | undefined, newSecurityPassword: string) {
    await this.usersService.changeSecurityPassword(userId, currentSecurityPassword, newSecurityPassword);
    if (this.authSessionService) {
      await this.authSessionService.revokeAll(userId, 'PUBLIC');
    }
    this.securityEvents?.emit({ type: 'SECURITY_PASSWORD_CHANGED', occurredAt: new Date(), userId });
  }

  async setupMfa(userId: string, label: string) {
    const totp = new TOTP({
      issuer: 'NEXI',
      label: label || `user-${userId}`,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const secret = totp.secret.base32;
    const uri = totp.toString();
    await this.usersService.updateUserMfa(userId, false, secret, null);
    return { secret, uri };
  }

  async verifyMfaSetup(userId: string, token: string) {
    const mfa = await this.usersService.getUserMfa(userId);
    if (!mfa?.secret) throw new Error('MFA setup not initiated');
    const totp = new TOTP({
      issuer: 'NEXI',
      label: `user-${userId}`,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: mfa.secret as string,
    });
    const delta = totp.validate({ token, window: 1 });
    if (delta === null) throw new Error('Invalid MFA token');
    await this.usersService.updateUserMfa(userId, true, mfa.secret as string, null);
    this.securityEvents?.emit({ type: 'MFA_ENABLED', occurredAt: new Date(), userId });
    return { enabled: true };
  }

  async generateBackupCodes(userId: string) {
    const mfa = await this.usersService.getUserMfa(userId);
    if (!mfa || !mfa.enabled) throw new Error('MFA is not enabled');
    const rawCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      rawCodes.push(randomBytes(8).toString('hex').slice(0, 10).toUpperCase());
    }
    const hashedCodes = await Promise.all(rawCodes.map((code) => bcrypt.hash(code, 10)));
    await this.usersService.updateUserMfa(userId, true, mfa.secret as string, JSON.stringify(hashedCodes));
    return { codes: rawCodes };
  }

  async consumeBackupCode(userId: string, code: string): Promise<boolean> {
    const mfa = await this.usersService.getUserMfa(userId);
    if (!mfa?.backupCodes) return false;
    const codes: string[] = JSON.parse(mfa.backupCodes as string);
    for (let i = 0; i < codes.length; i++) {
      if (await bcrypt.compare(code, codes[i])) {
        codes.splice(i, 1);
        await this.usersService.updateUserMfa(userId, true, mfa.secret as string, JSON.stringify(codes));
        return true;
      }
    }
    return false;
  }

  async disableMfa(userId: string, securityPassword: string, token?: string) {
    await this.verifySecurityPassword(userId, securityPassword);
    const mfa = await this.usersService.getUserMfa(userId);
    if (mfa?.enabled && typeof mfa.secret === 'string') {
      if (!token) throw new Error('MFA token is required to disable');
      await this.validateMfaToken(userId, token, mfa.secret, true);
    }
    await this.usersService.updateUserMfa(userId, false, null, null);
    this.securityEvents?.emit({ type: 'MFA_DISABLED', occurredAt: new Date(), userId });
    return { enabled: false };
  }

  private async verifySecurityPassword(userId: string, securityPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.securityPasswordHash) throw new UnauthorizedException('Security password is not set');
    const passwordValid = await bcrypt.compare(securityPassword, user.securityPasswordHash);
    if (!passwordValid) throw new UnauthorizedException('Security password is incorrect');
  }

  private async validateMfaToken(userId: string, token: string, secret: string, allowBackup = false) {
    const totp = new TOTP({
      issuer: 'NEXI',
      label: `user-${userId}`,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });
    const delta = totp.validate({ token, window: 1 });
    if (delta === null) {
      if (allowBackup && (await this.consumeBackupCode(userId, token))) return;
      throw new Error('Invalid MFA token');
    }
  }

  async verifySensitiveAction(userId: string, securityPassword: string, mfaToken?: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user?.securityPasswordHash || typeof securityPassword !== 'string' || securityPassword.length === 0) {
      throw new UnauthorizedException('Sensitive action confirmation failed');
    }
    if (!await bcrypt.compare(securityPassword, user.securityPasswordHash)) {
      throw new UnauthorizedException('Sensitive action confirmation failed');
    }

    const mfa = await this.usersService.getUserMfa(userId);
    if (!mfa?.enabled) return;
    if (typeof mfaToken !== 'string' || mfaToken.length === 0) {
      throw new UnauthorizedException('MFA token is required');
    }
    if (typeof mfa.secret !== 'string' || mfa.secret.length === 0) {
      throw new UnauthorizedException('MFA confirmation is unavailable');
    }
    try {
      await this.validateMfaToken(userId, mfaToken, mfa.secret, true);
    } catch {
      throw new UnauthorizedException('Invalid MFA token');
    }
  }

  async getMfaState(userId: string) {
    const mfa = await this.usersService.getUserMfa(userId);
    if (!mfa) return { enabled: false };
    return {
      enabled: Boolean(mfa.enabled),
      hasSecret: Boolean(mfa.secret),
      hasBackupCodes: Boolean(mfa.backupCodes),
    };
  }

  async getSecurityState(userId: string) {
    const [user, mfa] = await Promise.all([this.usersService.findById(userId), this.usersService.getUserMfa(userId)]);
    return {
      passwordSet: Boolean(user?.securityPasswordHash),
      mfa: {
        enabled: Boolean(mfa?.enabled),
        hasSecret: Boolean(mfa?.secret),
        hasBackupCodes: Boolean(mfa?.backupCodes),
      },
    };
  }

  async listSessions(user: { userId: string; surface?: AuthSurface }) {
    if (!this.authSessionService || !user.surface) throw new UnauthorizedException('Authentication session is missing');
    return this.authSessionService.listSessions(user.userId, user.surface);
  }

  async revokeSession(user: { userId: string; surface?: AuthSurface }, sessionId: string) {
    if (!this.authSessionService || !user.surface) throw new UnauthorizedException('Authentication session is missing');
    return this.authSessionService.revokeSession(user.userId, user.surface, sessionId, 'SECURITY_ACTION');
  }

  async logout(user: { userId: string; surface?: AuthSurface; sessionId?: string }) {
    if (!this.authSessionService || !user.surface || !user.sessionId) {
      throw new UnauthorizedException('Authentication session is missing');
    }
    return this.authSessionService.revokeSession(user.userId, user.surface, user.sessionId);
  }

  async logoutAll(user: { userId: string; surface?: AuthSurface }) {
    if (!this.authSessionService || !user.surface) {
      throw new UnauthorizedException('Authentication session is missing');
    }
    return this.authSessionService.revokeAll(user.userId, user.surface);
  }
}
