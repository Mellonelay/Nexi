import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';
import { D1PrismaService } from '../../src/d1/d1-prisma.service';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';

describe('D1PrismaService local SQLite backend', () => {
  let root: string;
  let bridge: LocalSqliteBridgeService;
  let prisma: D1PrismaService;
  const saved = {
    mode: process.env.NEXI_SQLITE_LOCAL_ENABLED,
    d1: process.env.D1_RUNTIME_ENABLED,
    filename: process.env.NEXI_LOCAL_SQLITE_PATH,
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'nexi-prisma-sqlite-'));
    const filename = join(root, 'database.sqlite');
    const db = new Database(filename);
    db.exec(
      "CREATE TABLE AtomicAccount(id TEXT PRIMARY KEY,balance INTEGER NOT NULL);"+
      "CREATE TABLE AtomicOutbox(id TEXT PRIMARY KEY);"+
      "INSERT INTO AtomicAccount VALUES('a',100);",
    );
    db.close();
    process.env.NEXI_SQLITE_LOCAL_ENABLED = 'true';
    process.env.D1_RUNTIME_ENABLED = 'true';
    process.env.NEXI_LOCAL_SQLITE_PATH = filename;
    const config = { get: (key: string) => key === 'NEXI_LOCAL_SQLITE_PATH' ? filename : process.env[key] } as unknown as ConfigService;
    bridge = new LocalSqliteBridgeService(config);
    prisma = new D1PrismaService(bridge as unknown as D1WorkerBridgeService, config);
  });

  afterEach(async () => {
    await prisma?.onModuleDestroy();
    bridge?.onModuleDestroy();
    rmSync(root,{recursive:true,force:true});
    if(saved.mode === undefined) delete process.env.NEXI_SQLITE_LOCAL_ENABLED;
    else process.env.NEXI_SQLITE_LOCAL_ENABLED=saved.mode;
    if(saved.d1 === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED=saved.d1;
    if(saved.filename === undefined) delete process.env.NEXI_LOCAL_SQLITE_PATH;
    else process.env.NEXI_LOCAL_SQLITE_PATH=saved.filename;
  });

  it('uses the local Prisma driver and one-connection financial batch seam', async () => {
    expect(prisma.isEnabled()).toBe(true);
    expect(await prisma.isReady()).toBe(true);
    const rows = await prisma.$queryRawUnsafe<Array<{balance: number}>>('SELECT balance FROM AtomicAccount WHERE id=?','a');
    expect(Number(rows[0].balance)).toBe(100);
    const commits = await prisma.atomicBatch([
      {sql:'UPDATE AtomicAccount SET balance=balance-10 WHERE id=?',params:['a']},
      {sql:'INSERT INTO AtomicOutbox(id) VALUES (?)',params:['event-1']},
    ]);
    expect(commits.map(r=>r.meta?.changes)).toEqual([1,1]);
    expect((await bridge.select<{id:string}>('SELECT id FROM AtomicOutbox')).results).toEqual([{id:'event-1'}]);
    const afterCommit = await prisma.$queryRawUnsafe<Array<{balance: number}>>('SELECT balance FROM AtomicAccount WHERE id=?','a');
    expect(Number(afterCommit[0].balance)).toBe(90);
    let duplicateError: unknown;
    try {
      await prisma.atomicBatch([
        {sql:'UPDATE AtomicAccount SET balance=balance-10 WHERE id=?',params:['a']},
        {sql:'INSERT INTO AtomicOutbox(id) VALUES (?)',params:['event-1']},
      ]);
    } catch (error) {
      duplicateError = error;
    }
    expect(duplicateError).toBeDefined();
    expect((duplicateError as Error).message).toContain('UNIQUE constraint failed');
    const final = await prisma.$queryRawUnsafe<Array<{balance: number}>>('SELECT balance FROM AtomicAccount WHERE id=?','a');
    expect(Number(final[0].balance)).toBe(90);
  });

  it('restores durability settings on each Prisma connection and reconnect', async () => {
    async function settings() {
      const values: Record<string, unknown> = {};
      for (const name of ['journal_mode', 'synchronous', 'foreign_keys', 'busy_timeout']) {
        const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`PRAGMA ${name}`);
        values[name] = Object.values(rows[0])[0];
      }
      expect(String(values.journal_mode)).toBe('wal');
      expect(Number(values.synchronous)).toBe(2);
      expect(Number(values.foreign_keys)).toBe(1);
      expect(Number(values.busy_timeout)).toBe(5000);
    }
    await settings();
    await prisma.$executeRawUnsafe('PRAGMA synchronous=OFF');
    await prisma.$disconnect();
    await prisma.$connect();
    await settings();
  });

  it('enforces foreign keys on the Prisma connection without partial mutation', async () => {
    await prisma.$executeRawUnsafe('CREATE TABLE AtomicChild(id TEXT PRIMARY KEY, accountId TEXT REFERENCES AtomicAccount(id))');
    let failure: unknown;
    try {
      await prisma.$executeRawUnsafe('INSERT INTO AtomicChild VALUES (?,?)', 'child-1', 'missing');
    } catch (error) { failure = error; }
    expect(failure).toBeDefined();
    const rows = await prisma.$queryRawUnsafe<Array<{n: number}>>('SELECT count(*) AS n FROM AtomicChild');
    expect(Number(rows[0].n)).toBe(0);
  });
});
