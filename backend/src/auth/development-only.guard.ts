import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Keeps legacy development/sandbox routes unavailable outside development.
 * These routes must still be role-gated and audited before any production use.
 */
@Injectable()
export class DevelopmentOnlyGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException('Development-only route');
    }

    return true;
  }
}
