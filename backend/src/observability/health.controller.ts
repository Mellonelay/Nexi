import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { RedisService } from "../redis/redis.service";

@ApiTags("Operations")
@Controller("ops")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly d1: D1PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get("live")
  live() {
    return { status: "ok", service: "nexi-api" };
  }

  @Get("ready")
  async ready() {
    const d1Enabled = process.env.D1_RUNTIME_ENABLED === "true";
    const database = await this.withTimeout(
      d1Enabled ? this.d1.isReady() : this.prisma.isReady(),
      3_000,
    );
    const redis = await this.withTimeout(this.redis.isReady(), 3_000);
    const body = {
      status: database && redis ? "ready" : "not_ready",
      dependencies: { database, redis },
    };
    if (!database || !redis)
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    return body;
  }

  private async withTimeout(
    promise: Promise<boolean>,
    timeoutMs: number,
  ): Promise<boolean> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeout = new Promise<boolean>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(false), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
}
