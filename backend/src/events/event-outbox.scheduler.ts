import { Injectable, Optional } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RedisService } from "../redis/redis.service";
import { EventOutboxService } from "./event-outbox.service";
import * as Sentry from "@sentry/nestjs";

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
      Sentry.metrics.count("nexi.scheduler.skipped", 1, {
        attributes: { scheduler: "event-outbox", reason: "redis-unavailable" },
      });
      return { skipped: true, reason: "redis-unavailable" };
    }

    const owner = `outbox:${process.pid}:${Date.now()}`;
    const lockKey = "nexi:scheduler:event-outbox:publish";
    if (!(await this.redis.tryAcquireLock(lockKey, owner, 9))) {
      return { skipped: true, reason: "scheduler-lock-unavailable" };
    }
    try {
      const startedAt = Date.now();
      const result = await this.outbox.publishPending(25);
      Sentry.metrics.distribution(
        "nexi.scheduler.duration",
        Date.now() - startedAt,
        {
          unit: "millisecond",
          attributes: { scheduler: "event-outbox" },
        },
      );
      return result;
    } finally {
      await this.redis.releaseLock(lockKey, owner);
    }
  }
}
