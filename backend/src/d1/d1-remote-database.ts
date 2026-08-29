import type {
  D1BridgeBatchResult,
  D1BridgeBatchStatement,
  D1BridgeParameter,
  D1BridgeResult,
} from './d1-worker-bridge.service';

type D1Row = Record<string, unknown>;

type D1RunResult = {
  success: boolean;
  meta?: Record<string, unknown>;
  results?: D1Row[];
};

/**
 * Minimal D1 binding facade for the private Container -> Worker bridge.
 *
 * Prisma's D1 adapter consumes the Worker D1 binding interface. The backend
 * runs in a Container, so this facade translates that interface into the
 * private HTTP bridge without exposing Cloudflare API credentials to NestJS.
 * Financial commands must use `batch()` directly; Prisma's adapter does not
 * provide transaction atomicity when the binding is remote.
 */
export class D1RemoteDatabase {
  private readonly host: string;

  constructor(host = process.env.D1_BRIDGE_HOST ?? 'nexi-core-d1') {
    this.host = host;
  }

  prepare(sql: string): D1RemotePreparedStatement {
    return new D1RemotePreparedStatement(this, sql);
  }

  async batch(statements: D1RemotePreparedStatement[]): Promise<D1RunResult[]> {
    const payload: D1BridgeBatchStatement[] = statements.map((statement) => ({
      sql: statement.sql,
      params: statement.params,
    }));
    const result = await this.request<D1BridgeBatchResult>('/batch', payload);
    return result.results as D1RunResult[];
  }

  async health(): Promise<boolean> {
    try {
      const result = await this.request<{ ok?: boolean }>('/health');
      return result.ok === true;
    } catch {
      return false;
    }
  }

  async query(sql: string, params: D1BridgeParameter[]): Promise<D1BridgeResult<D1Row>> {
    return this.request<D1BridgeResult<D1Row>>('/query', { sql, params });
  }

  private async request<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`http://${this.host}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`D1 bridge request failed: HTTP ${response.status}`);
    return (await response.json()) as T;
  }
}

export class D1RemotePreparedStatement {
  constructor(
    private readonly database: D1RemoteDatabase,
    readonly sql: string,
    readonly params: D1BridgeParameter[] = [],
  ) {}

  bind(...params: D1BridgeParameter[]): D1RemotePreparedStatement {
    return new D1RemotePreparedStatement(this.database, this.sql, params);
  }

  async run(): Promise<D1RunResult> {
    const result = await this.database.batch([this]);
    return result[0] ?? { success: false };
  }

  async all<T extends D1Row = D1Row>(): Promise<{ results: T[]; success: boolean; meta?: Record<string, unknown> }> {
    const result = await this.database.query(this.sql, this.params);
    return { results: result.results as T[], success: true, meta: result.meta };
  }

  async first<T extends D1Row = D1Row>(): Promise<T | null> {
    const result = await this.all<T>();
    return result.results[0] ?? null;
  }

  async raw(options?: { columnNames?: boolean }): Promise<unknown[][]> {
    const result = await this.all();
    const rows = result.results;
    if (!options?.columnNames) return rows.map((row) => Object.values(row));
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return [columns, ...rows.map((row) => columns.map((column) => row[column]))];
  }
}
