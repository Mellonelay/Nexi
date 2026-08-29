import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export const REFRESH_TOKEN_BYTES = 32;

export interface GeneratedRefreshToken {
  readonly token: string;
  readonly hash: string;
}

/**
 * Handles only token material. Durable session state and rotation transactions
 * belong to the approval-gated persistence slice.
 */
@Injectable()
export class RefreshTokenCryptoService {
  generate(): GeneratedRefreshToken {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  matches(token: string, persistedHash: string): boolean {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(persistedHash)) {
      return false;
    }

    const candidate = Buffer.from(this.hash(token), 'hex');
    const expected = Buffer.from(persistedHash, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  }
}
