import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Keeps legacy development/sandbox routes unavailable outside development.
 * These routes must still be role-gated and audited before any production use.
 */
@Injectable()
export class DevelopmentOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(_context: ExecutionContext): boolean {
    if (this.config.get<string>('NODE_ENV') !== 'development') {
      throw new ForbiddenException('Development-only route');
    }

    return true;
  }
}
