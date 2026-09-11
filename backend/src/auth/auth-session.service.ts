import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { AuthSurface } from './auth.types';
import { AuthSecurityEventsService } from './auth-security-events.service';
import {
  AuthSessionRecord,
  AuthSessionRevokeReason,
  validateAuthSession,
} from './auth-session.policy';
import { RefreshTokenCryptoService } from './refresh-token-crypto.service';
import { D1AuthSessionRow, D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

export const AUTH_SESSION_ABSOLUTE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
export const AUTH_SESSION_IDLE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthSessionMetadata {
  readonly userAgent?: string;
  readonly ip?: string;
}

export interface CreatedAuthSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly surface: AuthSurface;
  readonly tokenFamilyId: string;
  readonly refreshToken: string;
}

export type RotatedAuthSession = CreatedAuthSession;

function hashMetadata(value: string | undefined): string | undefined {
  return value ? createHash('sha256').update(value, 'utf8').digest('hex') : undefined;
}

function nextIdleExpiry(now: Date, absoluteExpiresAt: Date): Date {
  const proposed = new Date(now.getTime() + AUTH_SESSION_IDLE_LIFETIME_MS);
  return proposed < absoluteExpiresAt ? proposed : absoluteExpiresAt;
}

function d1PolicyRecord(row: D1AuthSessionRow): AuthSessionRecord {
  return {
    id: row.id, userId: row.userId, surface: row.surface as AuthSurface, tokenFamilyId: row.tokenFamilyId,
    refreshTokenHash: row.refreshTokenHash, createdAt: new Date(row.createdAt), lastUsedAt: new Date(row.lastUsedAt),
    absoluteExpiresAt: new Date(row.absoluteExpiresAt), idleExpiresAt: new Date(row.idleExpiresAt),
    revokedAt: row.revokedAt ? new Date(row.revokedAt) : null,
    revokeReason: row.revokeReason as AuthSessionRevokeReason | null, replacedById: row.replacedById,
  };
}

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly refreshTokenCrypto: RefreshTokenCryptoService,
    private readonly securityEvents: AuthSecurityEventsService,
    private readonly d1: D1FinancialCommandGateway,
  ) {}

  async createSession(userId: string, surface: AuthSurface, metadata: AuthSessionMetadata = {}, now = new Date()): Promise<CreatedAuthSession> {
    const generated = this.refreshTokenCrypto.generate();
    const sessionId = randomUUID();
    const tokenFamilyId = randomUUID();
    const absoluteExpiresAt = new Date(now.getTime() + AUTH_SESSION_ABSOLUTE_LIFETIME_MS);
    const row = await this.d1.createAuthSession({
      id: sessionId, userId, surface, tokenFamilyId, refreshTokenHash: generated.hash,
      createdAt: now.toISOString(), lastUsedAt: now.toISOString(), absoluteExpiresAt: absoluteExpiresAt.toISOString(),
      idleExpiresAt: nextIdleExpiry(now, absoluteExpiresAt).toISOString(), userAgentHash: hashMetadata(metadata.userAgent) ?? null, ipHash: hashMetadata(metadata.ip) ?? null,
    });

    this.securityEvents.emit({ type: 'LOGIN_SUCCEEDED', occurredAt: now, userId: row.userId, sessionId: row.id, surface });
    return { sessionId: row.id, userId: row.userId, surface, tokenFamilyId: row.tokenFamilyId, refreshToken: generated.token };
  }

  async rotate(refreshToken: string, surface: AuthSurface, now = new Date()): Promise<RotatedAuthSession> {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is invalid');
    }
    const refreshTokenHash = this.refreshTokenCrypto.hash(refreshToken);
    return this.rotateOnD1(refreshTokenHash, surface, now);
  }

  async listSessions(userId: string, surface: AuthSurface) {
    const rows = await this.d1.listUserAuthSessions(userId, surface);
    return rows.map((row) => ({
      id: row.id, surface: row.surface, createdAt: row.createdAt, lastUsedAt: row.lastUsedAt,
      absoluteExpiresAt: row.absoluteExpiresAt, idleExpiresAt: row.idleExpiresAt, revokedAt: row.revokedAt,
      revokeReason: row.revokeReason, userAgentHash: row.userAgentHash, ipHash: row.ipHash,
    }));
  }

  async revokeSession(userId: string, surface: AuthSurface, sessionId: string, reason: AuthSessionRevokeReason = 'LOGOUT', now = new Date()): Promise<{ revoked: boolean }> {
    if (!sessionId) {
      throw new UnauthorizedException('Session identity is missing');
    }
    const revoked = await this.d1.revokeAuthSession(userId, surface, sessionId, reason, now.toISOString());
    if (revoked) {
      this.securityEvents.emit({ type: 'LOGOUT', occurredAt: now, userId, sessionId, surface, reason });
    }
    return { revoked };
  }

  async revokeAll(userId: string, surface: AuthSurface, now = new Date()): Promise<{ revokedCount: number }> {
    const revokedCount = await this.d1.revokeAllAuthSessions(userId, surface, now.toISOString());
    this.securityEvents.emit({ type: 'LOGOUT_ALL', occurredAt: now, userId, surface, reason: 'LOGOUT_ALL' });
    return { revokedCount };
  }

  private async rotateOnD1(refreshTokenHash: string, surface: AuthSurface, now: Date): Promise<RotatedAuthSession> {
    const current = await this.d1.getAuthSessionByHash(refreshTokenHash);
    if (!current || current.surface !== surface) {
      this.securityEvents.emit({ type: 'REFRESH_REJECTED', occurredAt: now, surface, reason: 'NOT_FOUND_OR_SURFACE_MISMATCH' });
      throw new UnauthorizedException('Refresh token is invalid');
    }
    if (current.revokedAt) {
      if (current.revokeReason === 'ROTATED') await this.d1.revokeAllAuthSessions(current.userId, surface, now.toISOString());
      this.securityEvents.emit({ type: current.revokeReason === 'ROTATED' ? 'REFRESH_REUSE_DETECTED' : 'REFRESH_REJECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: current.revokeReason ?? 'REVOKED' });
      throw new UnauthorizedException(current.revokeReason === 'ROTATED' ? 'Refresh token reuse detected' : 'Refresh token is revoked');
    }
    const policy = d1PolicyRecord(current);
    const validation = validateAuthSession(policy, now);
    if (validation.valid === false) {
      await this.d1.revokeAuthSession(current.userId, surface, current.id, 'EXPIRED', now.toISOString());
      this.securityEvents.emit({ type: 'REFRESH_REJECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: validation.reason });
      throw new UnauthorizedException('Refresh session has expired');
    }
    const replacementId = randomUUID();
    const generated = this.refreshTokenCrypto.generate();
    const successor = await this.d1.rotateAuthSession(current.id, {
      id: replacementId, userId: current.userId, surface, tokenFamilyId: current.tokenFamilyId, refreshTokenHash: generated.hash,
      createdAt: now.toISOString(), lastUsedAt: now.toISOString(), absoluteExpiresAt: current.absoluteExpiresAt, idleExpiresAt: nextIdleExpiry(now, policy.absoluteExpiresAt).toISOString(),
      userAgentHash: current.userAgentHash, ipHash: current.ipHash,
    }, now.toISOString());
    this.securityEvents.emit({ type: 'REFRESH_SUCCEEDED', occurredAt: now, userId: successor.userId, sessionId: successor.id, surface });
    return { sessionId: successor.id, userId: successor.userId, surface, tokenFamilyId: successor.tokenFamilyId, refreshToken: generated.token };
  }
}
