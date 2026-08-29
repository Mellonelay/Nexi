import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly count: number;
  readonly limit: number;
  readonly retryAfterSeconds: number;
}

@Injectable()
export class RedisRateLimitService {
  constructor(private readonly redis: RedisService) {}

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitDecision> {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('Rate-limit threshold is invalid');
    }

    const count = await this.redis.incrementWithTtl(key, windowSeconds);
    return {
      allowed: count <= limit,
      count,
      limit,
      retryAfterSeconds: windowSeconds,
    };
  }
}
