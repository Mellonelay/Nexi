import { createHash } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_RATE_LIMIT_OPERATION, AuthRateLimitOperation } from './auth-rate-limit.decorator';
import { RedisRateLimitService } from './redis-rate-limit.service';

interface AuthRateLimitRequest {
  readonly ip?: string;
  readonly body?: Record<string, unknown>;
}

interface AuthRateLimitPolicy {
  readonly ipLimit: number;
  readonly accountLimit: number;
  readonly windowSeconds: number;
}

const AUTH_RATE_LIMIT_POLICIES: Record<AuthRateLimitOperation, AuthRateLimitPolicy> = {
  login: { ipLimit: 20, accountLimit: 5, windowSeconds: 60 },
  signup: { ipLimit: 10, accountLimit: 3, windowSeconds: 60 },
  'admin-login': { ipLimit: 10, accountLimit: 3, windowSeconds: 60 },
  refresh: { ipLimit: 20, accountLimit: 5, windowSeconds: 60 },
  'admin-refresh': { ipLimit: 10, accountLimit: 3, windowSeconds: 60 },
};

export class AuthRateLimitExceededException extends HttpException {
  constructor() {
    super('Too many authentication attempts', HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiter: RedisRateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const operation = this.reflector.getAllAndOverride<AuthRateLimitOperation>(AUTH_RATE_LIMIT_OPERATION, [
      context.getHandler(),
      context.getClass(),
    ]) ?? 'login';
    const policy = AUTH_RATE_LIMIT_POLICIES[operation];
    const request = context.switchToHttp().getRequest<AuthRateLimitRequest>();
    const keys = [
      {
        key: `auth:${operation}:ip:${this.digest(request.ip || 'unknown')}`,
        limit: policy.ipLimit,
      },
    ];
    const email = request.body?.email;
    if (typeof email === 'string' && email.trim().length > 0) {
      keys.push({
        key: `auth:${operation}:account:${this.digest(email.trim().toLowerCase())}`,
        limit: policy.accountLimit,
      });
    }
    const refreshToken = request.body?.refreshToken;
    if ((operation === 'refresh' || operation === 'admin-refresh') && typeof refreshToken === 'string' && refreshToken.length > 0) {
      keys.push({
        key: `auth:${operation}:token:${this.digest(refreshToken)}`,
        limit: policy.accountLimit,
      });
    }

    try {
      for (const candidate of keys) {
        const decision = await this.rateLimiter.consume(candidate.key, candidate.limit, policy.windowSeconds);
        if (!decision.allowed) {
          throw new AuthRateLimitExceededException();
        }
      }
    } catch (error) {
      if (error instanceof AuthRateLimitExceededException) {
        throw error;
      }
      throw new ServiceUnavailableException('Authentication rate limiter unavailable');
    }

    return true;
  }

  private digest(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }
}
