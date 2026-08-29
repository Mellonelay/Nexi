import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type D1BridgeResult<T> = {
  results: T[];
  meta?: Record<string, unknown>;
};

export type D1BridgeParameter = string | number | boolean | null;

export type D1BridgeBatchStatement = {
  sql: string;
  params?: D1BridgeParameter[];
};

export type D1BridgeBatchResult = {
  results: Array<{
    success?: boolean;
    meta?: Record<string, unknown>;
    results?: unknown[];
  }>;
  meta?: Record<string, unknown>;
};

/**
 * Read-only client for the private Container -> Worker -> D1 bridge.
 *
 * The bridge is deliberately not used as a drop-in Prisma transport: D1
 * transaction guarantees must be implemented with native Worker-side batch
 * commands before any financial path is moved off PostgreSQL.
 */
@Injectable()
export class D1WorkerBridgeService {
  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get('D1_BRIDGE_ENABLED', 'false') === 'true';
  }

  private endpoint(path: string): string {
    const host = this.config.get('D1_BRIDGE_HOST', 'nexi-core-d1');
    return `http://${host}${path}`;
  }

  async health(): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const response = await fetch(this.endpoint('/health'));
    if (!response.ok) return false;
    const body = (await response.json()) as { ok?: boolean };
    return body.ok === true;
  }

  async select<T>(sql: string, params: Array<string | number | null> = []): Promise<D1BridgeResult<T>> {
    if (!this.isEnabled()) throw new Error('D1 bridge is disabled');
    const statement = sql.trim();
    if (!/^SELECT\b/i.test(statement) || statement.includes(';') || statement.length > 16_384) {
      throw new Error('D1 bridge accepts one bounded SELECT statement');
    }
    const response = await fetch(this.endpoint('/query'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sql: statement, params }),
    });
    if (!response.ok) throw new Error(`D1 bridge query failed: HTTP ${response.status}`);
    return (await response.json()) as D1BridgeResult<T>;
  }

  async batch(statements: D1BridgeBatchStatement[]): Promise<D1BridgeBatchResult> {
    if (!this.isEnabled()) throw new Error('D1 bridge is disabled');
    if (!Array.isArray(statements) || statements.length === 0 || statements.length > 16) {
      throw new Error('D1 bridge batch requires between 1 and 16 statements');
    }
    for (const statement of statements) {
      const sql = statement?.sql?.trim() ?? '';
      const params = statement?.params ?? [];
      if (!sql || sql.length > 16_384 || sql.includes(';')) {
        throw new Error('D1 bridge accepts one bounded SQL statement per batch item');
      }
      if (!/^(SELECT|INSERT|UPDATE|DELETE|REPLACE)\b/i.test(sql)) {
        throw new Error('D1 bridge batch accepts only data statements');
      }
      if (!Array.isArray(params) || params.length > 64 || params.some((value) =>
        value !== null && !['string', 'number', 'boolean'].includes(typeof value))) {
        throw new Error('Unsupported D1 bridge parameter');
      }
    }
    const response = await fetch(this.endpoint('/batch'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ statements }),
    });
    if (!response.ok) throw new Error(`D1 bridge batch failed: HTTP ${response.status}`);
    return (await response.json()) as D1BridgeBatchResult;
  }
}
