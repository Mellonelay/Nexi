import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient as D1PrismaClient } from '../prisma/d1-client/index.js';
import { D1RemoteDatabase, type D1RunResult } from './d1-remote-database';
import type { D1BridgeBatchStatement } from './d1-worker-bridge.service';

/**
 * D1 Prisma client for ordinary ORM-style access.
 *
 * Consequential financial mutations use D1FinancialCommandGateway because a
 * remote Prisma adapter cannot make a transaction atomic at the Worker.
 */
@Injectable()
export class D1PrismaService extends D1PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly enabled = process.env.D1_RUNTIME_ENABLED === 'true';
  private readonly database: D1RemoteDatabase;

  constructor() {
    const database = new D1RemoteDatabase();
    const adapter = new PrismaD1(database as never);
    super({ adapter } as never);
    this.database = database;
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


  /**
   * Execute a bounded set of data statements at the Worker-side D1 batch seam.
   * This is the atomic boundary for multi-statement Container -> Worker writes;
   * Prisma's remote adapter cannot provide that transaction across HTTP calls.
   */
  async atomicBatch(statements: readonly D1BridgeBatchStatement[]): Promise<D1RunResult[]> {
    if (!this.enabled) throw new Error('D1 runtime is disabled');
    if (statements.length < 1 || statements.length > 16) {
      throw new Error('D1 atomic batch requires between 1 and 16 statements');
    }
    return this.database.batch(statements.map((statement) =>
      this.database.prepare(statement.sql).bind(...(statement.params ?? [])),
    ));
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
