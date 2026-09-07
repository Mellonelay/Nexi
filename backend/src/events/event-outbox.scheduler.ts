import { Injectable, Optional } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RedisService } from "../redis/redis.service";
import { EventOutboxService } from "./event-outbox.service";

@Injectable()
export class EventOutboxScheduler {
  constructor(
    private readonly outbox: EventOutboxService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async publishPending() {
    if (process.env.NEXI_SCHEDULER_ENABLED !== "true") {
      return { skipped: true, reason: "scheduler-disabled" };
    }
    if (!this.redis || !this.redis.isAvailable()) {
      return { skipped: true, reason: "redis-unavailable" };
    }

    const owner = `outbox:${process.pid}:${Date.now()}`;
    const lockKey = "nexi:scheduler:event-outbox:publish";
    if (!(await this.redis.tryAcquireLock(lockKey, owner, 9))) {
      return { skipped: true, reason: "scheduler-lock-unavailable" };
    }
    try {
      return await this.outbox.publishPending(25);
    } finally {
      await this.redis.releaseLock(lockKey, owner);
    }
  }
}
