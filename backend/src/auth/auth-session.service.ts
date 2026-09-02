import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { AuthSessionSurface as PrismaAuthSessionSurface } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSurface } from './auth.types';
import { AuthSecurityEvent, AuthSecurityEventsService } from './auth-security-events.service';
import {
  AuthSessionRecord,
  AuthSessionRevokeReason,
  buildRotationUpdate,
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

type AuthSessionRotationOutcome =
  | { ok: true; value: RotatedAuthSession; event: AuthSecurityEvent }
  | { ok: false; message: string; event: AuthSecurityEvent };

function hashMetadata(value: string | undefined): string | undefined {
  return value ? createHash('sha256').update(value, 'utf8').digest('hex') : undefined;
}

function toPrismaSurface(surface: AuthSurface): PrismaAuthSessionSurface {
  return surface === 'ADMIN' ? PrismaAuthSessionSurface.ADMIN : PrismaAuthSessionSurface.PUBLIC;
}

function toPolicyRecord(record: {
  id: string;
  userId: string;
  surface: PrismaAuthSessionSurface;
  tokenFamilyId: string;
  refreshTokenHash: string;
  createdAt: Date;
  lastUsedAt: Date;
  absoluteExpiresAt: Date;
  idleExpiresAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
  replacedById: string | null;
}): AuthSessionRecord {
  return { ...record, surface: record.surface, revokeReason: record.revokeReason as AuthSessionRevokeReason | null };
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
    private readonly prisma: PrismaService,
    private readonly refreshTokenCrypto: RefreshTokenCryptoService,
    private readonly securityEvents: AuthSecurityEventsService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  async createSession(userId: string, surface: AuthSurface, metadata: AuthSessionMetadata = {}, now = new Date()): Promise<CreatedAuthSession> {
    const generated = this.refreshTokenCrypto.generate();
    const sessionId = randomUUID();
    const tokenFamilyId = randomUUID();
    const absoluteExpiresAt = new Date(now.getTime() + AUTH_SESSION_ABSOLUTE_LIFETIME_MS);
    if (this.d1?.isEnabled()) {
      const row = await this.d1.createAuthSession({
        id: sessionId, userId, surface, tokenFamilyId, refreshTokenHash: generated.hash,
        createdAt: now.toISOString(), lastUsedAt: now.toISOString(), absoluteExpiresAt: absoluteExpiresAt.toISOString(),
        idleExpiresAt: nextIdleExpiry(now, absoluteExpiresAt).toISOString(), userAgentHash: hashMetadata(metadata.userAgent) ?? null, ipHash: hashMetadata(metadata.ip) ?? null,
      });
      this.securityEvents.emit({ type: 'LOGIN_SUCCEEDED', occurredAt: now, userId: row.userId, sessionId: row.id, surface });
      return { sessionId: row.id, userId: row.userId, surface, tokenFamilyId: row.tokenFamilyId, refreshToken: generated.token };
    }
    const row = await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId,
        surface: toPrismaSurface(surface),
        tokenFamilyId,
        refreshTokenHash: generated.hash,
        createdAt: now,
        lastUsedAt: now,
        absoluteExpiresAt,
        idleExpiresAt: nextIdleExpiry(now, absoluteExpiresAt),
        userAgentHash: hashMetadata(metadata.userAgent),
        ipHash: hashMetadata(metadata.ip),
      },
    });

    this.securityEvents.emit({ type: 'LOGIN_SUCCEEDED', occurredAt: now, userId: row.userId, sessionId: row.id, surface });
    return { sessionId: row.id, userId: row.userId, surface, tokenFamilyId: row.tokenFamilyId, refreshToken: generated.token };
  }

  async rotate(refreshToken: string, surface: AuthSurface, now = new Date()): Promise<RotatedAuthSession> {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is invalid');
    }
    const refreshTokenHash = this.refreshTokenCrypto.hash(refreshToken);
    if (this.d1?.isEnabled()) return this.rotateOnD1(refreshTokenHash, surface, now);
    const outcome: AuthSessionRotationOutcome = await this.prisma.$transaction(async (tx): Promise<AuthSessionRotationOutcome> => {
      const current = await tx.authSession.findUnique({ where: { refreshTokenHash } });
      if (!current || current.surface !== toPrismaSurface(surface)) {
        return {
          ok: false,
          message: 'Refresh token is invalid',
          event: { type: 'REFRESH_REJECTED', occurredAt: now, surface, reason: 'NOT_FOUND_OR_SURFACE_MISMATCH' },
        };
      }

      if (current.revokedAt) {
        if (current.revokeReason === 'ROTATED') {
          await tx.authSession.updateMany({
            where: { tokenFamilyId: current.tokenFamilyId, surface: current.surface, revokedAt: null },
            data: { revokedAt: now, revokeReason: 'REFRESH_REUSE' },
          });
          return {
            ok: false,
            message: 'Refresh token reuse detected',
            event: { type: 'REFRESH_REUSE_DETECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: 'ROTATED_TOKEN_REPLAY' },
          };
        } else {
          return {
            ok: false,
            message: 'Refresh token is revoked',
            event: { type: 'REFRESH_REJECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: current.revokeReason ?? 'REVOKED' },
          };
        }
      }

      const validation = validateAuthSession(toPolicyRecord(current), now);
      if (validation.valid === false) {
        await tx.authSession.updateMany({ where: { id: current.id, revokedAt: null }, data: { revokedAt: now, revokeReason: 'EXPIRED' } });
        return {
          ok: false,
          message: 'Refresh session has expired',
          event: { type: 'REFRESH_REJECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: validation.reason },
        };
      }

      const replacementId = randomUUID();
      const generated = this.refreshTokenCrypto.generate();
      const update = buildRotationUpdate(toPolicyRecord(current), replacementId, now);
      const rotation = await tx.authSession.updateMany({ where: { id: current.id, revokedAt: null }, data: update });
      if (rotation.count !== 1) {
        await tx.authSession.updateMany({
          where: { tokenFamilyId: current.tokenFamilyId, surface: current.surface, revokedAt: null },
          data: { revokedAt: now, revokeReason: 'REFRESH_REUSE' },
        });
        return {
          ok: false,
          message: 'Refresh token reuse detected',
          event: { type: 'REFRESH_REUSE_DETECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: 'CONCURRENT_ROTATION' },
        };
      }

      const successor = await tx.authSession.create({
        data: {
          id: replacementId,
          userId: current.userId,
          surface: current.surface,
          tokenFamilyId: current.tokenFamilyId,
          refreshTokenHash: generated.hash,
          createdAt: now,
          lastUsedAt: now,
          absoluteExpiresAt: current.absoluteExpiresAt,
          idleExpiresAt: nextIdleExpiry(now, current.absoluteExpiresAt),
          userAgentHash: current.userAgentHash,
          ipHash: current.ipHash,
        },
      });
      return {
        ok: true,
        value: { sessionId: successor.id, userId: successor.userId, surface, tokenFamilyId: successor.tokenFamilyId, refreshToken: generated.token },
        event: { type: 'REFRESH_SUCCEEDED', occurredAt: now, userId: successor.userId, sessionId: successor.id, surface },
      };
    });

    this.securityEvents.emit(outcome.event);
    if (outcome.ok === false) {
      throw new UnauthorizedException(outcome.message);
    }
    return outcome.value;
  }

  async listSessions(userId: string, surface: AuthSurface) {
    if (this.d1?.isEnabled()) {
      const rows = await this.d1.listUserAuthSessions(userId, surface);
      return rows.map((row) => ({
        id: row.id, surface: row.surface, createdAt: row.createdAt, lastUsedAt: row.lastUsedAt,
        absoluteExpiresAt: row.absoluteExpiresAt, idleExpiresAt: row.idleExpiresAt, revokedAt: row.revokedAt,
        revokeReason: row.revokeReason, userAgentHash: row.userAgentHash, ipHash: row.ipHash,
      }));
    }
    return this.prisma.authSession.findMany({
      where: { userId, surface: toPrismaSurface(surface) },
      orderBy: { lastUsedAt: 'desc' },
      take: 100,
      select: { id: true, surface: true, createdAt: true, lastUsedAt: true, absoluteExpiresAt: true, idleExpiresAt: true, revokedAt: true, revokeReason: true, userAgentHash: true, ipHash: true },
    });
  }

  async revokeSession(userId: string, surface: AuthSurface, sessionId: string, reason: AuthSessionRevokeReason = 'LOGOUT', now = new Date()): Promise<{ revoked: boolean }> {
    if (!sessionId) {
      throw new UnauthorizedException('Session identity is missing');
    }
    if (this.d1?.isEnabled()) {
      const revoked = await this.d1.revokeAuthSession(userId, surface, sessionId, reason, now.toISOString());
      if (revoked) this.securityEvents.emit({ type: 'LOGOUT', occurredAt: now, userId, sessionId, surface, reason });
      return { revoked };
    }
    const result = await this.prisma.authSession.updateMany({
      where: { id: sessionId, userId, surface: toPrismaSurface(surface), revokedAt: null },
      data: { revokedAt: now, revokeReason: reason },
    });
    if (result.count > 0) {
      this.securityEvents.emit({ type: 'LOGOUT', occurredAt: now, userId, sessionId, surface, reason });
    }
    return { revoked: result.count > 0 };
  }

  async revokeAll(userId: string, surface: AuthSurface, now = new Date()): Promise<{ revokedCount: number }> {
    if (this.d1?.isEnabled()) {
      const revokedCount = await this.d1.revokeAllAuthSessions(userId, surface, now.toISOString());
      this.securityEvents.emit({ type: 'LOGOUT_ALL', occurredAt: now, userId, surface, reason: 'LOGOUT_ALL' });
      return { revokedCount };
    }
    const result = await this.prisma.authSession.updateMany({
      where: { userId, surface: toPrismaSurface(surface), revokedAt: null },
      data: { revokedAt: now, revokeReason: 'LOGOUT_ALL' },
    });
    this.securityEvents.emit({ type: 'LOGOUT_ALL', occurredAt: now, userId, surface, reason: 'LOGOUT_ALL' });
    return { revokedCount: result.count };
  }

  private async rotateOnD1(refreshTokenHash: string, surface: AuthSurface, now: Date): Promise<RotatedAuthSession> {
    const current = await this.d1!.getAuthSessionByHash(refreshTokenHash);
    if (!current || current.surface !== surface) {
      this.securityEvents.emit({ type: 'REFRESH_REJECTED', occurredAt: now, surface, reason: 'NOT_FOUND_OR_SURFACE_MISMATCH' });
      throw new UnauthorizedException('Refresh token is invalid');
    }
    if (current.revokedAt) {
      if (current.revokeReason === 'ROTATED') await this.d1!.revokeAllAuthSessions(current.userId, surface, now.toISOString());
      this.securityEvents.emit({ type: current.revokeReason === 'ROTATED' ? 'REFRESH_REUSE_DETECTED' : 'REFRESH_REJECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: current.revokeReason ?? 'REVOKED' });
      throw new UnauthorizedException(current.revokeReason === 'ROTATED' ? 'Refresh token reuse detected' : 'Refresh token is revoked');
    }
    const policy = d1PolicyRecord(current);
    const validation = validateAuthSession(policy, now);
    if (validation.valid === false) {
      await this.d1!.revokeAuthSession(current.userId, surface, current.id, 'EXPIRED', now.toISOString());
      this.securityEvents.emit({ type: 'REFRESH_REJECTED', occurredAt: now, userId: current.userId, sessionId: current.id, surface, reason: validation.reason });
      throw new UnauthorizedException('Refresh session has expired');
    }
    const replacementId = randomUUID();
    const generated = this.refreshTokenCrypto.generate();
    buildRotationUpdate(policy, replacementId, now);
    const successor = await this.d1!.rotateAuthSession(current.id, {
      id: replacementId, userId: current.userId, surface, tokenFamilyId: current.tokenFamilyId, refreshTokenHash: generated.hash,
      createdAt: now.toISOString(), lastUsedAt: now.toISOString(), absoluteExpiresAt: current.absoluteExpiresAt, idleExpiresAt: nextIdleExpiry(now, policy.absoluteExpiresAt).toISOString(),
      userAgentHash: current.userAgentHash, ipHash: current.ipHash,
    }, now.toISOString());
    this.securityEvents.emit({ type: 'REFRESH_SUCCEEDED', occurredAt: now, userId: successor.userId, sessionId: successor.id, surface });
    return { sessionId: successor.id, userId: successor.userId, surface, tokenFamilyId: successor.tokenFamilyId, refreshToken: generated.token };
  }
}
