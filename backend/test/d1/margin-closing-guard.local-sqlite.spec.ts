import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';

describe('Margin close CAS on disposable SQLite', () => {
  const previous = process.env.D1_RUNTIME_ENABLED;
  let directory: string;
  let bridge: LocalSqliteBridgeService;
  let gateway: D1FinancialCommandGateway;
  beforeEach(() => {
    process.env.D1_RUNTIME_ENABLED = 'true';
    directory = mkdtempSync(join(tmpdir(), 'nexi-margin-close-'));
    const file = join(directory, 'test.sqlite');
    const database = new Database(file);
    database.exec(`
      CREATE TABLE SpotMarginPosition (
        id TEXT PRIMARY KEY, status TEXT NOT NULL, closeOrderId TEXT, updatedAt TEXT
      );
      CREATE TABLE SpotMarginActivity (
        id TEXT PRIMARY KEY, userId TEXT, accountId TEXT, positionId TEXT,
        type TEXT, status TEXT, idempotencyKey TEXT UNIQUE, details TEXT, createdAt TEXT
      );
      INSERT INTO SpotMarginPosition (id,status) VALUES ('position-1','OPEN');
    `);
    database.close();
    const config = { get: (key: string) => key === 'NEXI_LOCAL_SQLITE_PATH' ? file : undefined } as ConfigService;
    bridge = new LocalSqliteBridgeService(config);
    gateway = new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService);
  });
  afterEach(() => {
    bridge.onModuleDestroy();
    rmSync(directory, { recursive: true, force: true });
  });
  afterAll(() => {
    if (previous === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previous;
  });

  it('only the winning close creates Activity; the losing request creates none', async () => {
    const first = await gateway.markMarginClosing('position-1', 'user-1', 'account-1', 'activity-1', 'close-order-1', 'close-key-1');
    expect(first.replayed).toBe(false);
    await expect(gateway.markMarginClosing('position-1', 'user-1', 'account-1', 'activity-2', 'close-order-2', 'close-key-2')).rejects.toBeInstanceOf(BadRequestException);
    const rows = await bridge.select<{ id: string; idempotencyKey: string }>('SELECT id,idempotencyKey FROM SpotMarginActivity');
    expect(rows.results).toEqual([{ id: 'activity-1', idempotencyKey: 'close-key-1' }]);
    const current = await bridge.select<{status:string;closeOrderId:string}>('SELECT status,closeOrderId FROM SpotMarginPosition');
    expect(current.results[0]).toEqual({ status: 'CLOSING', closeOrderId: 'close-order-1' });
    const replay = await gateway.markMarginClosing('position-1', 'user-1', 'account-1', 'activity-3', 'close-order-1', 'close-key-1');
    expect(replay.replayed).toBe(true);
    await expect(gateway.markMarginClosing('position-1', 'user-1', 'account-1', 'activity-4', 'different-order', 'close-key-1'))
      .rejects.toThrow('changed terms');
    const finalRows = await bridge.select<{id:string}>('SELECT id FROM SpotMarginActivity');
    expect(finalRows.results).toHaveLength(1);
  });
});
