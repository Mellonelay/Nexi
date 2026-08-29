import { AuthSessionSurface } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { AuthSecurityEventsService, AuthSecurityEvent } from '../../src/auth/auth-security-events.service';
import {
  AUTH_SESSION_ABSOLUTE_LIFETIME_MS,
  AuthSessionService,
} from '../../src/auth/auth-session.service';
import { RefreshTokenCryptoService } from '../../src/auth/refresh-token-crypto.service';

function activeRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-08-01T00:00:00.000Z');
  return {
    id: 'session-1',
    userId: 'user-1',
    surface: AuthSessionSurface.PUBLIC,
    tokenFamilyId: 'family-1',
    refreshTokenHash: 'hash',
    createdAt: now,
    lastUsedAt: now,
    absoluteExpiresAt: new Date(now.getTime() + AUTH_SESSION_ABSOLUTE_LIFETIME_MS),
    idleExpiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    revokedAt: null,
    revokeReason: null,
    replacedById: null,
    userAgentHash: 'ua-hash',
    ipHash: 'ip-hash',
    ...overrides,
  };
}

function serviceWith(prisma: Record<string, unknown>) {
  return new AuthSessionService(
    prisma as never,
    new RefreshTokenCryptoService(),
    new AuthSecurityEventsService(),
  );
}

describe('B1 durable AuthSession persistence', () => {
  it('creates a hashed, surface-scoped session without persisting raw metadata', async () => {
    const create = jest.fn().mockImplementation(async ({ data }) => ({ ...data }));
    const events: AuthSecurityEvent[] = [];
    const securityEvents = new AuthSecurityEventsService();
    securityEvents.on((event) => events.push(event));
    const service = new AuthSessionService(
      { authSession: { create } } as never,
      new RefreshTokenCryptoService(),
      securityEvents,
    );

    const result = await service.createSession('user-1', 'PUBLIC', {
      userAgent: 'Mozilla/5.0',
      ip: '192.0.2.10',
    }, new Date('2026-08-01T00:00:00.000Z'));

    expect(result.refreshToken).toEqual(expect.any(String));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        surface: AuthSessionSurface.PUBLIC,
        refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        userAgentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    }));
    expect(create.mock.calls[0][0].data).not.toHaveProperty('refreshToken');
    expect(create.mock.calls[0][0].data.userAgentHash).not.toBe('Mozilla/5.0');
    expect(create.mock.calls[0][0].data.ipHash).not.toBe('192.0.2.10');
    expect(events).toEqual([expect.objectContaining({ type: 'LOGIN_SUCCEEDED', sessionId: result.sessionId, surface: 'PUBLIC' })]);
  });

  it('rotates exactly one predecessor and keeps the token family', async () => {
    const crypto = new RefreshTokenCryptoService();
    const first = crypto.generate();
    const current = activeRecord({ refreshTokenHash: first.hash });
    const tx = {
      authSession: {
        findUnique: jest.fn().mockResolvedValue(current),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockImplementation(async ({ data }) => ({ ...data })),
      },
    };
    const prisma = { $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
    const service = new AuthSessionService(prisma as never, crypto, new AuthSecurityEventsService());

    const result = await service.rotate(first.token, 'PUBLIC', new Date('2026-08-01T00:30:00.000Z'));

    expect(result.userId).toBe('user-1');
    expect(result.tokenFamilyId).toBe('family-1');
    expect(result.refreshToken).not.toBe(first.token);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'session-1', revokedAt: null },
      data: expect.objectContaining({ revokeReason: 'ROTATED', replacedById: expect.any(String) }),
    }));
    expect(tx.authSession.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tokenFamilyId: 'family-1', userId: 'user-1', surface: AuthSessionSurface.PUBLIC }),
    }));
  });

  it('revokes the active family when a rotated predecessor is replayed', async () => {
    const crypto = new RefreshTokenCryptoService();
    const replayed = crypto.generate();
    const tx = {
      authSession: {
        findUnique: jest.fn().mockResolvedValue(activeRecord({ refreshTokenHash: replayed.hash, revokedAt: new Date(), revokeReason: 'ROTATED' })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
    };
    const prisma = { $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
    const service = serviceWith(prisma);

    await expect(service.rotate(replayed.token, 'PUBLIC')).rejects.toThrow(UnauthorizedException);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { tokenFamilyId: 'family-1', surface: AuthSessionSurface.PUBLIC, revokedAt: null },
      data: { revokedAt: expect.any(Date), revokeReason: 'REFRESH_REUSE' },
    });
    expect(tx.authSession.create).not.toHaveBeenCalled();
  });

  it('enforces user and surface ownership for idempotent logout', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = serviceWith({ authSession: { updateMany } });

    await expect(service.revokeSession('user-1', 'ADMIN', 'session-1')).resolves.toEqual({ revoked: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'user-1', surface: AuthSessionSurface.ADMIN, revokedAt: null },
      data: { revokedAt: expect.any(Date), revokeReason: 'LOGOUT' },
    });
  });
});
