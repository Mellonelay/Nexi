import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_OPERATION = 'auth_rate_limit_operation';
export type AuthRateLimitOperation = 'login' | 'signup' | 'admin-login' | 'refresh' | 'admin-refresh' | 'message-attachment' | 'wallet-challenge' | 'wallet-verify';

export const AuthRateLimit = (operation: AuthRateLimitOperation) =>
  SetMetadata(AUTH_RATE_LIMIT_OPERATION, operation);
