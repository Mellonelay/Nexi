import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { PrismaClient as D1PrismaClient } from '../prisma/d1-client/index.js';
import { D1RemoteDatabase, type D1RunResult } from './d1-remote-database';
import { D1WorkerBridgeService, type D1BridgeBatchStatement } from './d1-worker-bridge.service';

/** Initialize every physical Prisma connection before any application query. */
class DurableSqliteAdapter extends PrismaBetterSqlite3 {
  override async connect() {
    const connection = await super.connect();
    const query = (sql: string) => connection.queryRaw({sql, args: [], argTypes: []});
    const execute = (sql: string) => connection.executeRaw({sql, args: [], argTypes: []});
    try {
      const version = String((await query('SELECT sqlite_version()')).rows[0][0]);
      const [major, minor, patch] = version.split('.').map(Number);
      if (major < 3 || (major === 3 && (minor < 51 || (minor === 51 && patch < 3)))) {
        throw new Error('SQLite 3.51.3 or newer is required for local WAL financial execution');
      }
      const journal = await query('PRAGMA journal_mode=WAL');
      await execute('PRAGMA synchronous=FULL');
      await execute('PRAGMA foreign_keys=ON');
      await execute('PRAGMA busy_timeout=5000');
      if (String(journal.rows[0][0]).toLowerCase() !== 'wal') {
        throw new Error('Local SQLite Prisma connection requires WAL journaling');
      }
      for (const [name, expected] of [['synchronous',2],['foreign_keys',1],['busy_timeout',5000]] as const) {
        if (Number((await query(`PRAGMA ${name}`)).rows[0][0]) !== expected) {
          throw new Error(`Local SQLite Prisma connection failed ${name} initialization`);
        }
      }
      return connection;
    } catch (error) {
      await connection.dispose();
      throw error;
    }
  }
}

/**
 * The existing Prisma schema is SQLite for both Cloudflare D1 and local SQLite.
 * Live D1 remains the default; local SQLite is an explicit, fail-closed opt-in.
 * Financial commands keep their separate atomic batch boundary in both modes.
 */
@Injectable()
export class D1PrismaService extends D1PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly enabled: boolean;
  private readonly localMode: boolean;
  private readonly database: D1RemoteDatabase | null;

  constructor(
    private readonly bridge: D1WorkerBridgeService,
    config: ConfigService,
  ) {
    const localMode = config.get<string>('NEXI_SQLITE_LOCAL_ENABLED', 'false') === 'true';
    let database: D1RemoteDatabase | null = null;
    let adapter: PrismaD1 | PrismaBetterSqlite3;
    if (localMode) {
      const filename = config.get<string>('NEXI_LOCAL_SQLITE_PATH', '');
      if (!filename || !isAbsolute(filename) || !existsSync(filename)) {
        throw new Error('NEXI_LOCAL_SQLITE_PATH must identify an existing absolute SQLite file');
      }
      adapter = new DurableSqliteAdapter({ url: `file:${filename}`, timeout: 5000, fileMustExist: true });
    } else {
      database = new D1RemoteDatabase();
      adapter = new PrismaD1(database as never);
    }
    super({ adapter } as never);
    this.database = database;
    this.localMode = localMode;
    this.enabled = localMode || config.get<string>('D1_RUNTIME_ENABLED', 'false') === 'true';
  }

  async onModuleInit(): Promise<void> {
    if (this.enabled) await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.enabled) await this.$disconnect();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isLocalMode(): boolean {
    return this.localMode;
  }

  /**
   * Preserve one-connection atomic batch semantics. In local mode the bridge
   * instance uses BEGIN IMMEDIATE, not Prisma interactive transactions.
   */
  async atomicBatch(statements: readonly D1BridgeBatchStatement[]): Promise<D1RunResult[]> {
    if (!this.enabled) throw new Error('D1 / SQLite runtime is disabled');
    if (statements.length < 1 || statements.length > 16) {
      throw new Error('Atomic batch requires between 1 and 16 statements');
    }
    if (this.localMode) {
      if (!this.bridge.isEnabled()) throw new Error('Local SQLite batch bridge is disabled');
      const batch = await this.bridge.batch([...statements]);
      return batch.results.map(result => ({
        success: result.success !== false,
        meta: result.meta,
        results: result.results as Record<string, unknown>[] | undefined,
      }));
    }
    const database = this.database;
    if (!database) throw new Error('D1 database adapter unavailable');
    return database.batch(statements.map(statement =>
      database.prepare(statement.sql).bind(...(statement.params ?? [])),
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
