import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient as D1PrismaClient } from '../prisma/d1-client/index.js';
import { D1RemoteDatabase } from './d1-remote-database';

/**
 * SQLite/D1 Prisma client used for staging migration verification.
 *
 * This is intentionally separate from PrismaService until every financial
 * transaction site has a native D1 command implementation. The D1 adapter
 * does not make remote Prisma transactions atomic.
 */
@Injectable()
export class D1PrismaService extends D1PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly enabled = process.env.D1_RUNTIME_ENABLED === 'true';

  constructor() {
    const database = new D1RemoteDatabase();
    const adapter = new PrismaD1(database as never);
    super({ adapter } as never);
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) return;
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.enabled) return;
    await this.$disconnect();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async isReady(): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
