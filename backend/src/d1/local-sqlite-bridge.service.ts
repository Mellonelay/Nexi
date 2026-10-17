import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import type {
  D1BridgeBatchResult,
  D1BridgeBatchStatement,
  D1BridgeParameter,
  D1BridgeResult,
} from './d1-worker-bridge.service';

/**
 * Local implementation of the bounded D1 bridge contract.
 *
 * This is opt-in and must never be used against a live D1 database. Every batch
 * uses one SQLite connection and one IMMEDIATE transaction to preserve
 * changes(), constraint rollback, Ledger and EventOutbox ordering.
 */
@Injectable()
export class LocalSqliteBridgeService implements OnModuleDestroy {
  private readonly db: Database.Database;

  constructor(config: ConfigService) {
    const filename = config.get<string>('NEXI_LOCAL_SQLITE_PATH', '');
    if (!filename || !isAbsolute(filename) || !existsSync(filename)) {
      throw new Error('NEXI_LOCAL_SQLITE_PATH must identify an existing absolute SQLite file');
    }
    const db = new Database(filename, { fileMustExist: true, timeout: 5000 });
    try {
      const row = db.prepare('SELECT sqlite_version() AS version').get() as {version: string};
      const parts = row.version.split('.').map(Number);
      const minimum = [3, 51, 3];
      if (minimum.some((value, i) => parts[i] !== value &&
          (parts[i] ?? 0) < value && minimum.slice(0, i).every((v, j) => parts[j] === v))) {
        throw new Error('SQLite 3.51.3 or newer is required for local WAL financial execution');
      }
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = FULL');
      db.pragma('foreign_keys = ON');
      db.pragma('busy_timeout = 5000');
      this.db = db;
    } catch (error) {
      db.close();
      throw error;
    }
  }

  isEnabled(): boolean { return true; }

  async health(): Promise<boolean> {
    return (this.db.prepare('SELECT 1 AS ok').get() as { ok: number }).ok === 1;
  }

  async select<T>(sql: string, params: Array<string | number | null> = []): Promise<D1BridgeResult<T>> {
    const statement = sql.trim();
    if (!/^SELECT\b/i.test(statement) || statement.includes(';') || statement.length > 16_384) {
      throw new Error('Local SQLite bridge accepts one bounded SELECT statement');
    }
    return { results: this.db.prepare(statement).all(...params) as T[] };
  }

  async batch(statements: D1BridgeBatchStatement[]): Promise<D1BridgeBatchResult> {
    return this.executeBatch(statements, false);
  }

  /** Workflow-only: execute dependent steps iff the fenced first RETURNING statement matched.
   * The check runs inside the same BEGIN IMMEDIATE transaction and never relies on changes().
   */
  async batchGuardedByFirstRow(statements: D1BridgeBatchStatement[]): Promise<D1BridgeBatchResult> {
    return this.executeBatch(statements, true);
  }

  private async executeBatch(statements: D1BridgeBatchStatement[], guardFirstRow: boolean): Promise<D1BridgeBatchResult> {
    if (!Array.isArray(statements) || statements.length < 1 || statements.length > 16) {
      throw new Error('Local SQLite batch requires between 1 and 16 statements');
    }
    for (const entry of statements) {
      const sql = entry?.sql?.trim() ?? '';
      const params = entry?.params ?? [];
      if (!sql || sql.length > 16_384 || sql.includes(';')
        || !/^(SELECT|INSERT|UPDATE|DELETE|REPLACE)\b/i.test(sql)) {
        throw new Error('Local SQLite batch accepts only one bounded data statement per item');
      }
      if (!Array.isArray(params) || params.length > 128 ||
        params.some(v => v !== null && !['string', 'number', 'boolean'].includes(typeof v))) {
        throw new Error('Unsupported local SQLite bridge parameter');
      }
    }

    const run = this.db.transaction(() => {
      const results: D1BridgeBatchResult['results'] = [];
      for (const [index, entry] of statements.entries()) {
      const statement = this.db.prepare(entry.sql.trim());
      const params = (entry.params ?? []).map((value: D1BridgeParameter) =>
        typeof value === 'boolean' ? Number(value) : value
      );
      if (statement.reader) {
        const rows = statement.all(...params);
        const row = { success: true, results: rows, meta: { changes: statement.readonly ? 0 : rows.length } };
        if (index === 0 && guardFirstRow && rows.length !== 1) return { results: [row] };
        results.push(row);
        continue;
      }
      const effect = statement.run(...params);
      results.push({
        success: true,
        results: [],
        meta: { changes: effect.changes, last_row_id: Number(effect.lastInsertRowid) },
      });
      if (index === 0 && guardFirstRow) throw new Error('Guarded checkpoint requires a RETURNING statement');
      }
      return { results };
    });
    return run.immediate();
  }

  onModuleDestroy(): void { this.db.close(); }
}
