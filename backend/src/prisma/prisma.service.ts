import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { resolveRuntimeConfig } from '../runtime/runtime.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  private connected = false;

  constructor() {
    const { databaseUrl } = resolveRuntimeConfig();
    const configuredPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? '4', 10);
    const poolMax = Number.isFinite(configuredPoolMax) ? Math.min(Math.max(configuredPoolMax, 1), 10) : 4;
    // Keep the pool bounded on small runtimes while avoiding the previous
    // two-connection starvation under market persistence and health probes.
    const pool = new Pool({
      connectionString: databaseUrl,
      max: poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      transactionOptions: {
        maxWait: 10_000,
        timeout: 30_000,
      },
    });
    this.pool = pool;
  }

  onModuleInit(): void {
    void this.$connect().then(() => {
      this.connected = true;
      console.log('Successfully connected to PostgreSQL via Prisma 7');
    }).catch(async (error) => {
      await this.pool.end().catch(() => undefined);
      console.error('Failed to connect to PostgreSQL via Prisma 7');
      return error;
    });
  }

  async onModuleDestroy() {
    this.connected = false;
    await this.$disconnect();
    await this.pool.end();
  }

  async isReady(): Promise<boolean> {
    if (!this.connected) return false;
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
