import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';

describe('Margin filled-close recovery with disposable SQLite', () => {
  const old = process.env.D1_RUNTIME_ENABLED;
  let dir: string;
  let bridge: LocalSqliteBridgeService;
  let gateway: D1FinancialCommandGateway;
  beforeEach(() => {
    process.env.D1_RUNTIME_ENABLED = 'true';
    dir = mkdtempSync(join(tmpdir(), 'nexi-margin-recovery-'));
    const file = join(dir, 'data.sqlite');
    const db = new Database(file);
    db.exec(`
      CREATE TABLE SpotMarginAccount (id TEXT PRIMARY KEY, userId TEXT);
      CREATE TABLE SpotMarginPosition (
        id TEXT PRIMARY KEY, accountId TEXT, closeOrderId TEXT,
        status TEXT, updatedAt TEXT
      );
      CREATE TABLE SpotMarginActivity (
        id TEXT PRIMARY KEY, positionId TEXT, idempotencyKey TEXT,
        type TEXT, status TEXT, details TEXT
      );
      CREATE TABLE Gate2SpotOrder (
        id TEXT PRIMARY KEY, userId TEXT, status TEXT
      );
      CREATE TABLE Gate2SpotTrade (
        id TEXT PRIMARY KEY, buyerOrderId TEXT, sellerOrderId TEXT,
        price TEXT, amount TEXT, createdAt TEXT
      );
      INSERT INTO SpotMarginAccount VALUES ('margin-account','owner');
      INSERT INTO SpotMarginPosition VALUES ('position','margin-account','close-order','CLOSING','2026-01-01');
      INSERT INTO SpotMarginActivity VALUES ('request','position','original-close-key','CLOSE','ACCEPTED','{"orderId":"close-order"}');
      INSERT INTO Gate2SpotOrder VALUES ('close-order','owner','PARTIALLY_FILLED');
      INSERT INTO Gate2SpotTrade VALUES ('fill-one','close-order','counter-order','100','1','2026-01-01');
      INSERT INTO Gate2SpotTrade VALUES ('fill-two','close-order','counter-order-2','110','2','2026-01-02');
    `);
    db.close();
    const config = {get: (key: string) => key === 'NEXI_LOCAL_SQLITE_PATH' ? file : undefined} as ConfigService;
    bridge = new LocalSqliteBridgeService(config);
    gateway = new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService);
  });
  afterEach(() => { bridge.onModuleDestroy(); rmSync(dir, {recursive:true,force:true}); });
  afterAll(() => {
    if (old === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = old;
  });
  it('does not schedule a partial close and computes realized weighted fill price', async () => {
    expect(await gateway.listPendingMarginCloses()).toEqual([]);
    await expect(gateway.getMarginCloseRequest('position','owner')).resolves.toEqual({
      closeOrderId:'close-order',idempotencyKey:'original-close-key',liquidation:false,
    });
    await expect(gateway.getMarginCloseRequest('position','another-user')).resolves.toBeNull();
    expect(await gateway.getSpotOrderExecutionPrice('close-order')).toBe('106.66666666666666667');
  });
  it('recovers only FILLED positions with their original close idempotency key', async () => {
    await bridge.batch([{sql:"UPDATE Gate2SpotOrder SET status='FILLED' WHERE id='close-order'"}]);
    expect(await gateway.listPendingMarginCloses()).toEqual([
      {positionId:'position',userId:'owner',closeOrderId:'close-order',
        idempotencyKey:'original-close-key',liquidation:false},
    ]);
    await bridge.batch([{sql:"UPDATE SpotMarginPosition SET status='CLOSED' WHERE id='position'"}]);
    expect(await gateway.listPendingMarginCloses()).toEqual([]);
  });
});
