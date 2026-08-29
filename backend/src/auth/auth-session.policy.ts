export type AuthSessionSurface = 'PUBLIC' | 'ADMIN';
export type AuthSessionRevokeReason = 'LOGOUT' | 'LOGOUT_ALL' | 'ROTATED' | 'REFRESH_REUSE' | 'SECURITY_ACTION' | 'EXPIRED';

export interface AuthSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly surface: AuthSessionSurface;
  readonly tokenFamilyId: string;
  readonly refreshTokenHash: string;
  readonly createdAt: Date;
  readonly lastUsedAt: Date;
  readonly absoluteExpiresAt: Date;
  readonly idleExpiresAt: Date;
  readonly revokedAt: Date | null;
  readonly revokeReason: AuthSessionRevokeReason | null;
  readonly replacedById: string | null;
}

export type AuthSessionInvalidReason = 'REVOKED' | 'ABSOLUTE_EXPIRED' | 'IDLE_EXPIRED';

export type AuthSessionValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: AuthSessionInvalidReason };

export interface AuthSessionRotationUpdate {
  readonly revokedAt: Date;
  readonly revokeReason: 'ROTATED';
  readonly replacedById: string;
  readonly lastUsedAt: Date;
}

export class AuthSessionPolicyError extends Error {
  constructor(readonly reason: AuthSessionInvalidReason) {
    super(`Auth session cannot be rotated: ${reason}`);
  }
}

export function validateAuthSession(record: AuthSessionRecord, now: Date = new Date()): AuthSessionValidation {
  if (record.revokedAt) {
    return { valid: false, reason: 'REVOKED' };
  }
  if (now >= record.absoluteExpiresAt) {
    return { valid: false, reason: 'ABSOLUTE_EXPIRED' };
  }
  if (now >= record.idleExpiresAt) {
    return { valid: false, reason: 'IDLE_EXPIRED' };
  }
  return { valid: true };
}

export function buildRotationUpdate(
  record: AuthSessionRecord,
  replacementId: string,
  now: Date = new Date(),
): AuthSessionRotationUpdate {
  if (!replacementId || replacementId === record.id) {
    throw new Error('Replacement session id is invalid');
  }

  const validation = validateAuthSession(record, now);
  if (validation.valid === false) {
    throw new AuthSessionPolicyError(validation.reason);
  }

  return {
    revokedAt: now,
    revokeReason: 'ROTATED',
    replacedById: replacementId,
    lastUsedAt: now,
  };
}
