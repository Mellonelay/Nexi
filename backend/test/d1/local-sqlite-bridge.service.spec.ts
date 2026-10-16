import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';

describe('LocalSqliteBridgeService transactional equivalence', () => {
  let directory: string;
  let file: string;
  let bridge: LocalSqliteBridgeService;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'nexi-local-sqlite-'));
    file = join(directory, 'test.sqlite');
    const db = new Database(file);
    db.exec(`
      CREATE TABLE LedgerAccount(id TEXT PRIMARY KEY, available INTEGER NOT NULL CHECK(available >= 0));
      CREATE TABLE EventOutbox(id TEXT PRIMARY KEY, accountId TEXT NOT NULL REFERENCES LedgerAccount(id));
      CREATE TABLE Audit(id TEXT PRIMARY KEY);
      INSERT INTO LedgerAccount(id,available) VALUES('account-1',100);
    `);
    db.close();
    bridge = new LocalSqliteBridgeService({
      get: (name: string) => name === 'NEXI_LOCAL_SQLITE_PATH' ? file : undefined,
    } as unknown as ConfigService);
  });

  afterEach(() => {
    bridge?.onModuleDestroy();
    rmSync(directory, { recursive: true, force: true });
  });

  it('returns rows and preserves transaction ordering and effects', async () => {
    expect(bridge.isEnabled()).toBe(true);
    expect(await bridge.health()).toBe(true);
    const committed = await bridge.batch([
      { sql: 'UPDATE LedgerAccount SET available=available-10 WHERE id=?', params: ['account-1'] },
      { sql: 'INSERT INTO EventOutbox(id,accountId) VALUES (?,?)', params: ['outbox-1','account-1'] },
    ]);
    expect(committed.results.map(r => r.meta?.changes)).toEqual([1,1]);
    expect((await bridge.select<{available:number}>('SELECT available FROM LedgerAccount WHERE id=?',['account-1'])).results).toEqual([{ available: 90 }]);
  });

  it('rolls back the entire financial batch on a duplicate idempotency key', async () => {
    await bridge.batch([{ sql: 'INSERT INTO EventOutbox(id,accountId) VALUES (?,?)', params: ['outbox-1','account-1'] }]);
    let duplicateError: unknown;
    try {
      await bridge.batch([
        { sql: 'UPDATE LedgerAccount SET available=available-10 WHERE id=?', params: ['account-1'] },
        { sql: 'INSERT INTO EventOutbox(id,accountId) VALUES (?,?)', params: ['outbox-1','account-1'] },
      ]);
    } catch (error) {
      duplicateError = error;
    }
    expect(duplicateError).toBeDefined();
    expect((duplicateError as Error).message).toContain('UNIQUE constraint failed');
    expect((await bridge.select<{available:number}>('SELECT available FROM LedgerAccount WHERE id=?',['account-1'])).results[0].available).toBe(100);
  });

  it('retains SQLite changes() across consecutive batch statements on one connection', async () => {
    await bridge.batch([{ sql: 'INSERT INTO EventOutbox(id,accountId) VALUES (?,?)', params: ['outbox-1','account-1'] }]);
    const results = await bridge.batch([
      { sql: 'INSERT OR IGNORE INTO EventOutbox(id,accountId) VALUES (?,?)', params: ['outbox-1','account-1'] },
      { sql: 'INSERT INTO Audit(id) SELECT ? WHERE changes() > 0', params: ['should-not-exist'] },
    ]);
    expect(results.results.map(r => r.meta?.changes)).toEqual([0,0]);
    expect((await bridge.select('SELECT * FROM Audit')).results).toHaveLength(0);
  });

  it('rejects unbounded or multi-statement SQL before execution', async () => {
    await expect(bridge.batch([{ sql: 'DELETE FROM LedgerAccount; DROP TABLE LedgerAccount' }])).rejects.toThrow();
    await expect(bridge.select('DELETE FROM LedgerAccount')).rejects.toThrow();
    expect((await bridge.select('SELECT COUNT(*) AS n FROM LedgerAccount')).results).toEqual([{ n:1 }]);
  });

  it('fails a competing writer within the busy timeout, then recovers without partial effects', async () => {
    const lock = new Database(file);
    lock.exec('BEGIN IMMEDIATE');
    let failure: unknown;
    const started = Date.now();
    try {
      await bridge.batch([
        {sql:'UPDATE LedgerAccount SET available=available-10 WHERE id=?',params:['account-1']},
        {sql:'INSERT INTO EventOutbox VALUES (?,?)',params:['busy-event','account-1']},
      ]);
    } catch (error) { failure = error; }
    finally { lock.exec('ROLLBACK'); lock.close(); }
    expect((failure as {code?:string})?.code).toBe('SQLITE_BUSY');
    expect(Date.now()-started).toBeLessThan(12000);
    expect((await bridge.select<{available:number}>('SELECT available FROM LedgerAccount')).results[0].available).toBe(100);
    expect((await bridge.select('SELECT * FROM EventOutbox')).results).toHaveLength(0);
    await bridge.batch([{sql:'UPDATE LedgerAccount SET available=available-1 WHERE id=?',params:['account-1']}]);
    expect((await bridge.select<{available:number}>('SELECT available FROM LedgerAccount')).results[0].available).toBe(99);
  }, 15000);
});
