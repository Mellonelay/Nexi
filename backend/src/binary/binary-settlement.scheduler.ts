import { Injectable, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { BinaryService } from './binary.service';

@Injectable()
export class BinarySettlementScheduler {
  constructor(
    private readonly binary: BinaryService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async settleExpiredPositions() {
    if (process.env.NEXI_SCHEDULER_ENABLED !== 'true') {
      return { skipped: true, reason: 'scheduler-disabled' };
    }
    if (!this.redis) return { skipped: true, reason: 'redis-unavailable' };

    const owner = randomUUID();
    const lockKey = 'nexi:scheduler:binary-settlement:poll';
    if (!(await this.redis.tryAcquireLock(lockKey, owner, 9))) {
      return { skipped: true, reason: 'scheduler-lock-unavailable' };
    }
    try {
      const settled = await this.binary.checkExpiredPositions();
      return { processed: settled.length };
    } finally {
      await this.redis.releaseLock(lockKey, owner);
    }
  }
}
