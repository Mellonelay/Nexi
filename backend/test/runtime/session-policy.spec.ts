import {
  AuthSessionRecord,
  AuthSessionPolicyError,
  buildRotationUpdate,
  validateAuthSession,
} from '../../src/auth/auth-session.policy';

function session(overrides: Partial<AuthSessionRecord> = {}): AuthSessionRecord {
  const createdAt = new Date('2026-08-01T00:00:00.000Z');
  return {
    id: 'session-1',
    userId: 'user-1',
    surface: 'PUBLIC',
    tokenFamilyId: 'family-1',
    refreshTokenHash: 'a'.repeat(64),
    createdAt,
    lastUsedAt: new Date('2026-08-01T00:10:00.000Z'),
    absoluteExpiresAt: new Date('2026-08-02T00:00:00.000Z'),
    idleExpiresAt: new Date('2026-08-01T01:00:00.000Z'),
    revokedAt: null,
    revokeReason: null,
    replacedById: null,
    ...overrides,
  };
}

describe('B1 auth session policy', () => {
  const now = new Date('2026-08-01T00:30:00.000Z');

  it('accepts an active public or Admin session before either expiry boundary', () => {
    expect(validateAuthSession(session(), now)).toEqual({ valid: true });
    expect(validateAuthSession(session({ surface: 'ADMIN' }), now)).toEqual({ valid: true });
  });

  it.each([
    ['revoked', { revokedAt: new Date('2026-08-01T00:20:00.000Z') }, 'REVOKED'],
    ['absolute expiry', { absoluteExpiresAt: now }, 'ABSOLUTE_EXPIRED'],
    ['idle expiry', { idleExpiresAt: now }, 'IDLE_EXPIRED'],
  ] as const)('rejects a session at the %s boundary', (_label, overrides, reason) => {
    expect(validateAuthSession(session(overrides), now)).toEqual({ valid: false, reason });
  });

  it('builds a rotation update without mutating the predecessor record', () => {
    const predecessor = session();
    const rotatedAt = new Date('2026-08-01T00:31:00.000Z');

    expect(buildRotationUpdate(predecessor, 'session-2', rotatedAt)).toEqual({
      revokedAt: rotatedAt,
      revokeReason: 'ROTATED',
      replacedById: 'session-2',
      lastUsedAt: rotatedAt,
    });
    expect(predecessor.revokedAt).toBeNull();
    expect(predecessor.replacedById).toBeNull();
  });

  it('does not rotate revoked or expired sessions', () => {
    expect(() => buildRotationUpdate(session({ revokedAt: now }), 'session-2', now)).toThrow(AuthSessionPolicyError);
    expect(() => buildRotationUpdate(session({ idleExpiresAt: now }), 'session-2', now)).toThrow(AuthSessionPolicyError);
  });
});
