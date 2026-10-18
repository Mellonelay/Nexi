import { Injectable, Optional } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis/redis.service";
import { EventOutboxService } from "./event-outbox.service";
import * as Sentry from "@sentry/nestjs";

@Injectable()
export class EventOutboxScheduler {
  constructor(
    private readonly outbox: EventOutboxService,
    @Optional() private readonly redis?: RedisService,
    @Optional() private readonly config: ConfigService = new ConfigService(),
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async publishPending() {
    if (this.config.get<string>("NEXI_SCHEDULER_ENABLED") !== "true") {
      return { skipped: true, reason: "scheduler-disabled" };
    }
    // Local publication is durably serialized by SQLite Outbox claim and job identity.
    // It must not depend on the old external Redis scheduler lock.
    if (this.config.get<string>("NEXI_SQLITE_LOCAL_ENABLED") === "true" &&
        this.config.get<string>("NEXI_LOCAL_ASYNC_ENABLED") === "true") {
      return this.outbox.publishPending(25);
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
