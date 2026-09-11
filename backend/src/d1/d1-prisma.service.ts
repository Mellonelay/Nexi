import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient as D1PrismaClient } from '../prisma/d1-client/index.js';
import { D1RemoteDatabase } from './d1-remote-database';

/**
 * D1 Prisma client for ordinary ORM-style access.
 *
 * Consequential financial mutations use D1FinancialCommandGateway because a
 * remote Prisma adapter cannot make a transaction atomic at the Worker.
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
