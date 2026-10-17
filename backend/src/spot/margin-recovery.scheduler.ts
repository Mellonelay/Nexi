import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { MarginService } from './margin.service';

@Injectable()
export class MarginRecoveryScheduler {
  private readonly logger = new Logger(MarginRecoveryScheduler.name);
  constructor(
    private readonly margin: MarginService,
    private readonly gateway: D1FinancialCommandGateway,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async recoverFilledCloses(): Promise<{ processed: number; failed: number; skipped?: string }> {
    if (process.env.NEXI_SCHEDULER_ENABLED !== 'true') {
      return { processed: 0, failed: 0, skipped: 'scheduler-disabled' };
    }
    const owner = randomUUID();
    const key = 'nexi:scheduler:margin-closing-recovery';
    if (!(await this.redis.tryAcquireLock(key, owner, 9))) {
      return { processed: 0, failed: 0, skipped: 'lock-unavailable' };
    }
    let processed = 0;
    let failed = 0;
    try {
      const pending = await this.gateway.listPendingMarginCloses(25);
      for (const row of pending) {
        try {
          if (row.liquidation) {
            await this.margin.liquidatePosition(row.userId, row.positionId, row.idempotencyKey);
          } else {
            await this.margin.closePosition(row.userId, row.positionId, row.idempotencyKey);
          }
          processed += 1;
        } catch (error) {
          failed += 1;
          this.logger.warn(`Margin close recovery deferred for ${row.positionId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
      }
      return { processed, failed };
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }
}
