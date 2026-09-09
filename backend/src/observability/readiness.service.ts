import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export type ReadinessReport = {
  database: boolean;
  redis: boolean;
  authority: 'D1' | 'PostgreSQL';
};

@Injectable()
export class ReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly d1: D1PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getApplicationReadiness() {
    const report = await this.getReport();
    if (!report.database || !report.redis) {
      throw new ServiceUnavailableException({
        status: 'NOT_READY',
        dependencies: {
          database: report.database,
          redis: report.redis,
          authority: report.authority,
        },
      });
    }

    return {
      status: 'READY',
      dependencies: {
        database: report.database,
        redis: report.redis,
        authority: report.authority,
      },
    };
  }

  async getOperationalReadiness() {
    const report = await this.getReport();
    const body = {
      status: report.database && report.redis ? 'ready' : 'not_ready',
      dependencies: {
        database: report.database,
        redis: report.redis,
      },
    };
    if (!report.database || !report.redis) {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return body;
  }

  private async getReport(): Promise<ReadinessReport> {
    const d1Enabled = process.env.D1_RUNTIME_ENABLED === 'true';
    const [database, redis] = await Promise.all([
      this.withTimeout(
        d1Enabled ? this.d1.isReady() : this.prisma.isReady(),
        3_000,
      ),
      this.withTimeout(this.redis.isReady(), 3_000),
    ]);

    return {
      database,
      redis,
      authority: d1Enabled ? 'D1' : 'PostgreSQL',
    };
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
