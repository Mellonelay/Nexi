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

export type D1SqlStatementClass =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'REPLACE';

function skipSqlTrivia(sql: string, start: number): number {
  let index = start;
  while (index < sql.length) {
    if (/\s/.test(sql[index])) {
      index += 1;
      continue;
    }
    if (sql.startsWith('--', index)) {
      const newline = sql.indexOf('\n', index + 2);
      index = newline === -1 ? sql.length : newline + 1;
      continue;
    }
    if (sql.startsWith('/*', index)) {
      const end = sql.indexOf('*/', index + 2);
      index = end === -1 ? sql.length : end + 2;
      continue;
    }
    break;
  }
  return index;
}

function skipSqlQuoted(sql: string, start: number): number | null {
  const opener = sql[start];
  const closer = opener === '[' ? ']' : opener;
  for (let index = start + 1; index < sql.length; index += 1) {
    if (sql[index] !== closer) continue;
    if (sql[index + 1] === closer) {
      index += 1;
      continue;
    }
    return index + 1;
  }
  return null;
}

function readSqlWord(
  sql: string,
  start: number,
): { value: string; next: number } | null {
  let index = skipSqlTrivia(sql, start);
  const first = sql.charCodeAt(index);
  if (
    !(
      (first >= 65 && first <= 90) ||
      (first >= 97 && first <= 122) ||
      first === 95
    )
  ) {
    return null;
  }
  index += 1;
  while (index < sql.length) {
    const code = sql.charCodeAt(index);
    if (
      !(
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122) ||
        (code >= 48 && code <= 57) ||
        code === 95 ||
        code === 36
      )
    ) {
      break;
    }
    index += 1;
  }
  return { value: sql.slice(skipSqlTrivia(sql, start), index).toUpperCase(), next: index };
}

function skipSqlIdentifier(sql: string, start: number): number | null {
  const index = skipSqlTrivia(sql, start);
  const opener = sql[index];
  if (opener === '"' || opener === '`' || opener === '[') {
    return skipSqlQuoted(sql, index);
  }
  return readSqlWord(sql, index)?.next ?? null;
}

function findSqlClosingParen(sql: string, openIndex: number): number | null {
  let depth = 0;
  for (let index = openIndex; index < sql.length; index += 1) {
    const character = sql[index];
    if (character === "'" || character === '"' || character === '`' || character === '[') {
      const next = skipSqlQuoted(sql, index);
      if (next === null) return null;
      index = next - 1;
      continue;
    }
    if (sql.startsWith('--', index)) {
      const newline = sql.indexOf('\n', index + 2);
      index = newline === -1 ? sql.length : newline;
      continue;
    }
    if (sql.startsWith('/*', index)) {
      const end = sql.indexOf('*/', index + 2);
      if (end === -1) return null;
      index = end + 1;
      continue;
    }
    if (character === '(') depth += 1;
    if (character === ')' && --depth === 0) return index + 1;
  }
  return null;
}

function hasTopLevelSqlSemicolon(sql: string): boolean {
  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    if (character === "'" || character === '"' || character === '`' || character === '[') {
      const next = skipSqlQuoted(sql, index);
      if (next === null) return false;
      index = next - 1;
      continue;
    }
    if (sql.startsWith('--', index)) {
      const newline = sql.indexOf('\n', index + 2);
      index = newline === -1 ? sql.length : newline;
      continue;
    }
    if (sql.startsWith('/*', index)) {
      const end = sql.indexOf('*/', index + 2);
      if (end === -1) return false;
      index = end + 1;
      continue;
    }
    if (character === ';') return true;
  }
  return false;
}

export function classifyD1Sql(sql: string): D1SqlStatementClass | null {
  const allowed = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'REPLACE'];
  const first = readSqlWord(sql, 0);
  if (!first) return null;
  if (first.value !== 'WITH') {
    return allowed.includes(first.value) ? (first.value as D1SqlStatementClass) : null;
  }

  let index = first.next;
  const recursive = readSqlWord(sql, index);
  if (recursive?.value === 'RECURSIVE') index = recursive.next;

  while (true) {
    const cteNameEnd = skipSqlIdentifier(sql, index);
    if (cteNameEnd === null) return null;
    index = cteNameEnd;
    index = skipSqlTrivia(sql, index);
    if (sql[index] === '(') {
      const columnListEnd = findSqlClosingParen(sql, index);
      if (columnListEnd === null) return null;
      index = columnListEnd;
    }

    const as = readSqlWord(sql, index);
    if (!as || as.value !== 'AS') return null;
    index = as.next;
    const modifier = readSqlWord(sql, index);
    if (modifier?.value === 'NOT') {
      const materialized = readSqlWord(sql, modifier.next);
      if (!materialized || materialized.value !== 'MATERIALIZED') return null;
      index = materialized.next;
    } else if (modifier?.value === 'MATERIALIZED') {
      index = modifier.next;
    }

    index = skipSqlTrivia(sql, index);
    if (sql[index] !== '(') return null;
    const cteBodyEnd = findSqlClosingParen(sql, index);
    if (cteBodyEnd === null) return null;
    index = skipSqlTrivia(sql, cteBodyEnd);
    if (sql[index] === ',') {
      index += 1;
      continue;
    }
    const main = readSqlWord(sql, index);
    return main && allowed.includes(main.value)
      ? (main.value as D1SqlStatementClass)
      : null;
  }
}

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
    const result = await this.request<D1BridgeBatchResult>('/batch', {
      statements: payload,
    });
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
    const statement = sql.trim();
    if (!statement || statement.length > 16_384 || hasTopLevelSqlSemicolon(statement)) {
      throw new Error('D1 bridge accepts one bounded SQL statement');
    }
    const statementClass = classifyD1Sql(statement);
    if (statementClass === 'SELECT') {
      return this.request<D1BridgeResult<D1Row>>('/query', { sql: statement, params });
    }
    if (!statementClass) {
      throw new Error('D1 bridge accepts only bounded data statements');
    }

    const result = await this.request<D1BridgeBatchResult>('/batch', {
      statements: [{ sql: statement, params }],
    });
    const first = result.results[0];
    return {
      results: (first?.results ?? []) as D1Row[],
      ...(first?.meta ?? result.meta ? { meta: first?.meta ?? result.meta } : {}),
    };
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
