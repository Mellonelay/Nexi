import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';
import { FinancialOperationsService } from '../../src/financial/financial-operations.service';

describe('financial operations on local SQLite', () => {
  let directory: string;
  let bridge: LocalSqliteBridgeService;
  let gateway: D1FinancialCommandGateway;
  let operations: FinancialOperationsService;
  const previousRuntimeFlag = process.env.D1_RUNTIME_ENABLED;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'nexi-wallet-transfer-'));
    const filename = join(directory, 'fixture.sqlite');
    const db = new Database(filename);
    db.exec(readFileSync(new URL('../../prisma/migrations-d1/0001_initial.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../../prisma/migrations-d1/0012_wallet_network_authority.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../../prisma/migrations-d1/0016_loan_repayment_cas.sql', import.meta.url), 'utf8'));
    db.prepare('INSERT INTO "User" ("id","userCode","email","updatedAt") VALUES (?,?,?,CURRENT_TIMESTAMP)')
      .run('user-1', 791000001, 'wallet-transfer-1@example.invalid');
    db.prepare('INSERT INTO "User" ("id","userCode","email","updatedAt") VALUES (?,?,?,CURRENT_TIMESTAMP)')
      .run('user-2', 791000002, 'wallet-transfer-2@example.invalid');
    db.prepare('UPDATE "Currency" SET "minWithdrawal"=?,"maxWithdrawal"=?,"withdrawalFee"=?,"withdrawEnabled"=1,"isActive"=1 WHERE "symbol"=?').run('1', '1000', '0.1', 'USDT');
    db.prepare('UPDATE "WalletNetwork" SET "isActive"=1,"withdrawEnabled"=1 WHERE "code"=? AND "currencyId"=(SELECT "id" FROM "Currency" WHERE "symbol"=?)').run('TRC20', 'USDT');
    for (const [id, userId, scope, available] of [
      ['main-1', 'user-1', 'MAIN', '10'],
      ['binary-1', 'user-1', 'BINARY', '2'],
      ['margin-1', 'user-1', 'MARGIN', '3'],
      ['binary-2', 'user-2', 'BINARY', '1'],
    ]) {
      db.prepare(`INSERT INTO "LedgerAccount" ("id","userId","asset","scope","status","available","locked","updatedAt")
        VALUES (?,?, 'USDT', ?, 'ACTIVE', ?, '0', CURRENT_TIMESTAMP)`).run(id, userId, scope, available);
    }
    db.prepare(`INSERT INTO "LedgerAccount" ("id","userId","asset","scope","status","available","locked","updatedAt") VALUES ('finance-1','user-1','USDT','FINANCE','ACTIVE','0','5',CURRENT_TIMESTAMP)`).run();
    db.close();

    process.env.D1_RUNTIME_ENABLED = 'true';
    const config = { get: (key: string) => key === 'NEXI_LOCAL_SQLITE_PATH' ? filename : undefined } as unknown as ConfigService;
    bridge = new LocalSqliteBridgeService(config);
    gateway = new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService);
    operations = new FinancialOperationsService(gateway);
  });

  afterEach(() => {
    bridge?.onModuleDestroy();
    rmSync(directory, { recursive: true, force: true });
    if (previousRuntimeFlag === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previousRuntimeFlag;
  });

  it('posts exact-decimal same-user scope transfers once with Activity and EventOutbox, then replays safely', async () => {
    const input = {
      sourceScope: 'MAIN', destinationScope: 'BINARY', asset: 'USDT', amount: '1.25',
      idempotencyKey: 'wallet-transfer-main-binary-001',
    };
    const first = await operations.transferBetweenAccounts('user-1', input);
    const replay = await operations.transferBetweenAccounts('user-1', input);
    await operations.transferBetweenAccounts('user-1', {
      sourceScope: 'MARGIN', destinationScope: 'MAIN', asset: 'USDT', amount: '0.5',
      idempotencyKey: 'wallet-transfer-margin-main-001',
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.postings).toMatchObject({
      debitPostingId: first.postings.debitPostingId,
      creditPostingId: first.postings.creditPostingId,
      replayed: true,
    });
    await expect(bridge.select<{ scope: string; available: string }>(
      'SELECT "scope","available" FROM "LedgerAccount" WHERE "userId"=? ORDER BY "scope"', ['user-1'],
    )).resolves.toMatchObject({ results: [
      { scope: 'BINARY', available: '3.25' },
      { scope: 'FINANCE', available: '0' },
      { scope: 'MAIN', available: '9.25' },
      { scope: 'MARGIN', available: '2.5' },
    ] });

    const postings = await bridge.select<{ accountId: string; availableDelta: string; amount: string }>(
      'SELECT "accountId","availableDelta","amount" FROM "LedgerPosting" WHERE "referenceType"=? ORDER BY "createdAt","id"',
      ['WALLET_ACCOUNT_TRANSFER'],
    );
    expect(postings.results).toHaveLength(4);
    expect(postings.results.map(row => row.availableDelta).sort()).toEqual(['-0.5', '-1.25', '0.5', '1.25']);
    expect(postings.results.filter(row => row.amount === '1.25')).toHaveLength(2);

    const audits = await bridge.select<{ referenceType: string }>(
      'SELECT "eventType" FROM "LedgerAuditEvent" WHERE "idempotencyKey" IN (?,?)',
      ['wallet-transfer-main-binary-001', 'wallet-transfer-margin-main-001'],
    );
    expect(audits.results).toHaveLength(4);

    const activities = await bridge.select<{ details: string; idempotencyKey: string }>(
      'SELECT "details","idempotencyKey" FROM "Activity" WHERE "referenceType"=? ORDER BY "idempotencyKey"',
      ['WALLET_ACCOUNT_TRANSFER'],
    );
    expect(activities.results).toHaveLength(2);
    const marginActivity = activities.results.find(row => row.idempotencyKey === 'wallet-transfer-margin-main-001');
    expect(JSON.parse(marginActivity!.details)).toMatchObject({
      direction: 'PAIRED_TRANSFER', sourceScope: 'MARGIN', destinationScope: 'MAIN',
    });
    const events = await bridge.select<{ eventType: string; idempotencyKey: string; payload: string }>(
      'SELECT "eventType","idempotencyKey","payload" FROM "EventOutbox" WHERE "eventType"=?',
      ['TRANSFER_COMPLETED'],
    );
    expect(events.results).toHaveLength(2);
    const binaryEvent = events.results.find(row => JSON.parse(row.payload).destinationScope === 'BINARY');
    expect(JSON.parse(binaryEvent!.payload)).toMatchObject({
      userId: 'user-1', sourceScope: 'MAIN', destinationScope: 'BINARY', amount: '1.25',
    });
  });

  it('records mining principal redemption in unified Activity with its ledger release and outbox event', async () => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`INSERT INTO MiningPlan (id,name,currency,lockupPeriod,dailyYield,dailyYieldDecimal,minDeposit,minDepositDecimal,maxDeposit,maxDepositDecimal,isActive,updatedAt) VALUES ('plan-1','test','USDT',1,'0.01','0.01','1','1','100','100',1,CURRENT_TIMESTAMP)`).run();
    db.prepare(`INSERT INTO MiningSubscription (id,userId,planId,amount,amountDecimal,status,planSnapshot,updatedAt) VALUES ('sub-1','user-1','plan-1','5','5','ACTIVE','{}',CURRENT_TIMESTAMP)`).run();
    db.close();
    await gateway.releaseMiningSubscription('sub-1', 'user-1', 'mining-redeem-key-1', 'COMPLETED');
    await expect(bridge.select<{ available: string; locked: string }>(`SELECT available,locked FROM LedgerAccount WHERE id='finance-1'`)).resolves.toMatchObject({ results: [{ available: '5', locked: '0' }] });
    await expect(bridge.select<{ type: string; amount: string }>(`SELECT type,amount FROM Activity WHERE referenceId='sub-1'`)).resolves.toMatchObject({ results: [{ type: 'MINING_REDEMPTION', amount: '5' }] });
    await expect(bridge.select<{ eventType: string }>(`SELECT eventType FROM EventOutbox WHERE aggregateId='sub-1'`)).resolves.toMatchObject({ results: [{ eventType: 'MINING_REDEEMED' }] });
  });

  it('replays Binary configuration updates by exact payload and rejects changed terms', async () => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`INSERT INTO Gate2BinaryConfiguration (id,pair,durationSeconds,payoutRate,lossRate,minStake,maxStake,settlementDelaySeconds,version,enabled,updatedAt) VALUES ('binary-config-1','BTCUSDT',60,'0.85','0','1','1000',0,1,1,CURRENT_TIMESTAMP)`).run();
    db.close();
    const command = { pair: 'BTCUSDT', sourceDurationSeconds: 60, durationSeconds: 60, payoutRate: 0.9, minStake: 1, maxStake: 1000, enabled: true, adminId: 'admin-1', reason: 'approved configuration update', idempotencyKey: 'binary-config-update-1' };
    const first = await gateway.updateBinaryConfiguration(command);
    const replay = await gateway.updateBinaryConfiguration(command);
    expect(first.version).toBe(2);
    expect(replay).toMatchObject({ id: first.id, version: 2, replayed: true });
    await expect(gateway.updateBinaryConfiguration({ ...command, payoutRate: 0.92 })).rejects.toThrow('idempotency key was already used');
    await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM Gate2BinaryConfiguration`)).resolves.toMatchObject({ results: [{ count: 2 }] });
    await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM AdminAuditLog WHERE action='BINARY_CONFIGURATION_UPDATED'`)).resolves.toMatchObject({ results: [{ count: 1 }] });
    await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM EventOutbox WHERE eventType='BINARY_CONFIGURATION_UPDATED'`)).resolves.toMatchObject({ results: [{ count: 1 }] });
  });

  it('compare-and-sets cumulative Loan repayments so concurrent keys cannot exceed the cap', async () => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`UPDATE LedgerAccount SET available='20',locked='0' WHERE id='finance-1'`).run();
    db.prepare(`INSERT INTO LoanApplication (id,userId,amount,amountDecimal,currency,term,durationDays,interestRate,interestRateDecimal,totalRepayment,totalRepaymentDecimal,totalRepaidDecimal,status,updatedAt) VALUES ('loan-race-1','user-1','10','10','USDT',30,30,'0','0','10','10','0','ACTIVE',CURRENT_TIMESTAMP)`).run();
    db.prepare(`INSERT INTO LoanRepayment (id,loanId,amount,amountDecimal,currency) VALUES ('loan-prior-1','loan-race-1','4','4','USDT')`).run();
    db.close();
    const originalBatch = bridge.batch.bind(bridge);
    let batches = 0;
    let release!: () => void;
    const bothReady = new Promise<void>(resolve => { release = resolve; });
    bridge.batch = (async (statements: any[]) => {
      if (statements[0]?.sql?.includes('SET "totalRepaidDecimal"')) {
        batches += 1;
        if (batches === 2) release();
        await bothReady;
      }
      return originalBatch(statements);
    }) as typeof bridge.batch;
    const results = await Promise.allSettled([
      gateway.repayLoan({ userId: 'user-1', loanId: 'loan-race-1', amount: '4', idempotencyKey: 'loan-race-key-a' }),
      gateway.repayLoan({ userId: 'user-1', loanId: 'loan-race-1', amount: '4', idempotencyKey: 'loan-race-key-b' }),
    ]);
    if (results.every(result => result.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    await expect(bridge.select<{ totalRepaidDecimal: string; status: string }>(`SELECT totalRepaidDecimal,status FROM LoanApplication WHERE id='loan-race-1'`)).resolves.toMatchObject({ results: [{ totalRepaidDecimal: '8', status: 'ACTIVE' }] });
    await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM LoanRepayment WHERE loanId='loan-race-1'`)).resolves.toMatchObject({ results: [{ count: 2 }] });
    await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM LedgerPosting WHERE referenceType='LOAN_REPAYMENT'`)).resolves.toMatchObject({ results: [{ count: 1 }] });
    await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM EventOutbox WHERE eventType='LOAN_REPAYMENT_POSTED'`)).resolves.toMatchObject({ results: [{ count: 1 }] });
  });

  it('allows only one concurrent DepositClaim review decision to commit', async () => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`INSERT INTO DepositClaim (id,userId,asset,network,destinationAddressSnapshot,claimedAmount,proofObjectKey,idempotencyKey,state) VALUES ('claim-race-1','user-1','USDT','TRC20','T-test','2','proof/key','claim-key-1','PENDING_REVIEW')`).run();
    db.close();
    const originalSelect = bridge.select.bind(bridge);
    let reads = 0;
    let release!: () => void;
    const bothRead = new Promise<void>(resolve => { release = resolve; });
    bridge.select = (async (sql: string, params?: unknown[]) => {
      const result = await originalSelect(sql, params as never);
      if (sql.includes('FROM "DepositClaim" WHERE "id"=?') && params?.[0] === 'claim-race-1' && reads < 2) {
        reads += 1;
        if (reads === 2) release();
        await bothRead;
      }
      return result;
    }) as typeof bridge.select;
    const results = await Promise.allSettled([
      gateway.updateDepositClaimState('claim-race-1', 'APPROVED', 'user-1', 'approved', 'claim-approve-1'),
      gateway.updateDepositClaimState('claim-race-1', 'REJECTED', 'user-2', 'rejected', 'claim-reject-1'),
    ]);
    if (results.every(result => result.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    const claim = await originalSelect<{ state: string }>(`SELECT state FROM DepositClaim WHERE id='claim-race-1'`);
    expect(['APPROVED', 'REJECTED']).toContain(claim.results[0].state);
    await expect(originalSelect<{ count: number }>(`SELECT COUNT(*) AS count FROM AdminAuditLog WHERE action IN ('DEPOSIT_CLAIM_APPROVED','DEPOSIT_CLAIM_REJECTED')`)).resolves.toMatchObject({ results: [{ count: 1 }] });
    await expect(originalSelect<{ count: number }>(`SELECT COUNT(*) AS count FROM EventOutbox WHERE aggregateId='claim-race-1'`)).resolves.toMatchObject({ results: [{ count: 1 }] });
  });

  it('replays Mining subscriptions only when the accepted amount and plan snapshot match', async () => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`UPDATE LedgerAccount SET available='20' WHERE id='finance-1'`).run();
    db.prepare(`INSERT INTO MiningPlan (id,name,currency,lockupPeriod,dailyYield,dailyYieldDecimal,minDeposit,minDepositDecimal,maxDeposit,maxDepositDecimal,isActive,updatedAt) VALUES ('plan-idem','test','USDT',30,'0.01','0.01','1','1','100','100',1,CURRENT_TIMESTAMP)`).run();
    db.close();
    const command = {
      subscriptionId: 'mining-idem-sub-1', userId: 'user-1', planId: 'plan-idem', amount: '5',
      endDate: '2030-01-01T00:00:00.000Z',
      planSnapshot: { name: 'test', currency: 'USDT', lockupPeriod: 30, dailyYield: '0.01', minDeposit: '1', maxDeposit: '100' },
      idempotencyKey: 'mining-idem-key-1',
    };
    await gateway.subscribeMining(command);
    await gateway.subscribeMining({ ...command, endDate: '2030-01-02T00:00:00.000Z' });
    await expect(gateway.subscribeMining({ ...command, amount: '6' })).rejects.toThrow('Mining subscription idempotency key was already used with different terms');
    await expect(gateway.subscribeMining({ ...command, planSnapshot: { ...command.planSnapshot, dailyYield: '0.02' } })).rejects.toThrow('Mining subscription idempotency key was already used with different terms');
    await expect(bridge.select<{ available: string; locked: string }>(`SELECT available,locked FROM LedgerAccount WHERE id='finance-1'`)).resolves.toMatchObject({ results: [{ available: '15', locked: '10' }] });
    for (const table of ['LedgerPosting', 'Activity', 'EventOutbox']) {
      await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM "${table}"`)).resolves.toMatchObject({ results: [{ count: 1 }] });
    }
  });

  it('treats an explicitly configured zero-yield Mining plan as a safe no-op', async () => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`INSERT INTO MiningPlan (id,name,currency,lockupPeriod,dailyYield,dailyYieldDecimal,minDeposit,minDepositDecimal,maxDeposit,maxDepositDecimal,isActive,updatedAt) VALUES ('zero-plan','zero','USDT',1,'0','0','1','1','100','100',1,CURRENT_TIMESTAMP)`).run();
    db.prepare(`INSERT INTO MiningSubscription (id,userId,planId,amount,amountDecimal,status,planSnapshot,updatedAt) VALUES ('zero-sub','user-1','zero-plan','5','5','ACTIVE','{}',CURRENT_TIMESTAMP)`).run();
    db.close();
    await expect(gateway.accrueMiningReward('zero-sub')).resolves.toMatchObject({ skipped: true, reason: 'zero-yield' });
    await expect(bridge.select<{ count: number }>(`SELECT COUNT(*) AS count FROM LedgerPosting`)).resolves.toMatchObject({ results: [{ count: 0 }] });
  });

  it.each(['BUY', 'SELL'])('prices a matched Spot fill at the resting %s order and publishes atomically', async (restingSide) => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`UPDATE LedgerAccount SET available='0',locked='10' WHERE id='main-1'`).run();
    for (const [id, userId, asset, available, locked] of [
      ['spot-buyer-base','user-1','BTC','0','0'],
      ['spot-seller-base','user-2','BTC','0','1'],
      ['spot-seller-quote','user-2','USDT','0','0'],
    ]) db.prepare(`INSERT INTO LedgerAccount (id,userId,asset,scope,status,available,locked,updatedAt) VALUES (?,?,?,'MAIN','ACTIVE',?,?,CURRENT_TIMESTAMP)`).run(id,userId,asset,available,locked);
    const insertOrder = db.prepare(`INSERT INTO Gate2SpotOrder (id,userId,pair,baseAsset,quoteAsset,side,type,status,amount,filled,remaining,price,reserveAsset,reserveScope,reservedAmount,feeRate,idempotencyKey,correlationId,createdAt,updatedAt) VALUES (?,?, 'BTCUSDT','BTC','USDT',?,'LIMIT','OPEN','1','0','1',?,?,'MAIN',?,'0',?,?,?,CURRENT_TIMESTAMP)`);
    const buyFirst = restingSide === 'BUY';
    insertOrder.run('buy-order','user-1','BUY','10','USDT','10','buy-order-key','buy-order-key',buyFirst ? '2026-01-01T00:00:00.000Z' : '2026-01-02T00:00:00.000Z');
    insertOrder.run('sell-order','user-2','SELL','9','BTC','1','sell-order-key','sell-order-key',buyFirst ? '2026-01-02T00:00:00.000Z' : '2026-01-01T00:00:00.000Z');
    db.close();
    const trade = await gateway.matchSpotOrder({ pair: 'BTCUSDT' });
    const expectedPrice = buyFirst ? '10' : '9';
    expect(trade).toMatchObject({ buyerOrderId: 'buy-order', sellerOrderId: 'sell-order', amount: '1', price: expectedPrice });
    await expect(bridge.select<{ type: string }>(`SELECT type FROM Activity WHERE referenceType='GATE2_SPOT_FILL'`)).resolves.toMatchObject({ results: [{ type: 'GATE2_SPOT_TRADE' }, { type: 'GATE2_SPOT_TRADE' }] });
    await expect(bridge.select<{ eventType: string }>(`SELECT eventType FROM EventOutbox WHERE aggregateType='SPOT_TRADE'`)).resolves.toMatchObject({ results: [{ eventType: 'SPOT_TRADE_EXECUTED' }] });
    await expect(bridge.select<{ available: string; locked: string }>(`SELECT available,locked FROM LedgerAccount WHERE id IN ('main-1','spot-buyer-base','spot-seller-base','spot-seller-quote') ORDER BY id`)).resolves.toMatchObject({ results: [{ available: buyFirst ? '0' : '1', locked: '0' }, { available: '1', locked: '0' }, { available: '0', locked: '0' }, { available: expectedPrice, locked: '0' }] });
  });

  it('records Margin position opening in unified Activity and EventOutbox', async () => {
    const db = new Database(join(directory, 'fixture.sqlite'));
    db.prepare(`INSERT INTO SpotMarginAccount (id,userId,pair,baseAsset,quoteAsset,status,updatedAt) VALUES ('margin-account-1','user-1','BTCUSDT','BTC','USDT','ACTIVE',CURRENT_TIMESTAMP)`).run();
    db.prepare(`INSERT INTO Gate2SpotOrder (id,userId,pair,baseAsset,quoteAsset,side,type,status,amount,filled,remaining,price,reserveAsset,reserveScope,reservedAmount,feeRate,idempotencyKey,correlationId,updatedAt) VALUES ('margin-entry-1','user-1','BTCUSDT','BTC','USDT','BUY','LIMIT','OPEN','1','0','1','10','USDT','MARGIN','10','0','margin:entry:open-key-1','margin:entry:open-key-1',CURRENT_TIMESTAMP)`).run();
    db.close();
    await gateway.createMarginPosition({ positionId: 'position-1', accountId: 'margin-account-1', userId: 'user-1', direction: 'LONG', leverage: 2, collateral: '5', quantity: '1', entryPrice: '10', markPrice: '10', status: 'PENDING', debtAsset: 'USDT', debtPrincipal: '5', openIdempotencyKey: 'open-key-1', entryOrderId: 'margin-entry-1', pair: 'BTCUSDT', positionAsset: 'BTC', activityId: 'margin-open-activity-1', positionEventId: 'margin-open-event-1' });
    await expect(bridge.select<{ type: string }>(`SELECT type FROM Activity WHERE referenceId='position-1'`)).resolves.toMatchObject({ results: [{ type: 'MARGIN_POSITION_OPENED' }] });
    await expect(bridge.select<{ eventType: string }>(`SELECT eventType FROM EventOutbox WHERE aggregateId='position-1'`)).resolves.toMatchObject({ results: [{ eventType: 'MARGIN_POSITION_OPENED' }] });
  });

  it('rejects unsupported scope assets, cross-user accounts, idempotency collisions, and overdrafts without partial writes', async () => {
    await expect(operations.transferBetweenAccounts('user-1', {
      sourceScope: 'MAIN', destinationScope: 'BINARY', asset: 'BTC', amount: '1',
      idempotencyKey: 'wallet-transfer-binary-btc-001',
    })).rejects.toThrow('Asset is not supported by both Wallet accounts');

    await expect(gateway.pairedTransfer({
      debitAccountId: 'main-1', creditAccountId: 'binary-2', asset: 'USDT', amount: '1',
      referenceType: 'WALLET_ACCOUNT_TRANSFER', referenceId: 'cross-user-transfer-001',
      idempotencyKey: 'cross-user-transfer-001', sameUserTransfer: {
        userId: 'user-1', fromScope: 'MAIN', toScope: 'BINARY',
      },
    })).rejects.toThrow('Wallet transfer account ownership or scope mismatch');

    await operations.transferBetweenAccounts('user-1', {
      sourceScope: 'MAIN', destinationScope: 'BINARY', asset: 'USDT', amount: '1',
      idempotencyKey: 'wallet-transfer-collision-001',
    });
    await expect(operations.transferBetweenAccounts('user-1', {
      sourceScope: 'MAIN', destinationScope: 'BINARY', asset: 'USDT', amount: '2',
      idempotencyKey: 'wallet-transfer-collision-001',
    })).rejects.toThrow('Idempotency key belongs to another financial transfer');

    await expect(operations.transferBetweenAccounts('user-1', {
      sourceScope: 'MAIN', destinationScope: 'BINARY', asset: 'USDT', amount: '100',
      idempotencyKey: 'wallet-transfer-overdraft-001',
    })).rejects.toThrow('Insufficient available funds');

    const postings = await bridge.select<{ count: number }>('SELECT count(*) AS count FROM "LedgerPosting"');
    const activities = await bridge.select<{ count: number }>('SELECT count(*) AS count FROM "Activity"');
    const events = await bridge.select<{ count: number }>('SELECT count(*) AS count FROM "EventOutbox"');
    expect(postings.results[0].count).toBe(2);
    const audits = await bridge.select<{ count: number }>(
      'SELECT count(*) AS count FROM "LedgerAuditEvent" WHERE "idempotencyKey"=?', ['wallet-transfer-collision-001'],
    );
    expect(audits.results[0].count).toBe(2);
    expect(activities.results[0].count).toBe(1);
    expect(events.results[0].count).toBe(1);
  });

  it('reserves, approves and settles withdrawals once, and rejects by refunding the reserve', async () => {
    const settledKey = 'withdrawal-local-settle-001';
    const request = { asset: 'USDT', network: 'TRC20', address: 'T-test-destination', amount: '1.25', idempotencyKey: settledKey };
    const created = await operations.requestWithdrawal('user-1', request);
    expect(created.withdrawal).toMatchObject({ state: 'PENDING_REVIEW', amount: '1.25', fee: '0.1', reservedAmount: '1.35' });
    expect((await operations.requestWithdrawal('user-1', request)).replayed).toBe(true);
    await expect(bridge.select<{ available: string; locked: string }>(
      'SELECT "available","locked" FROM "LedgerAccount" WHERE "id"=?', ['main-1'],
    )).resolves.toMatchObject({ results: [{ available: '8.65', locked: '1.35' }] });

    const withdrawalId = String(created.withdrawal.id);
    const review = await operations.requestWithdrawalReview(withdrawalId, 'enhanced compliance review', 'admin-1', 'withdrawal-review-001');
    expect(review.withdrawal).toMatchObject({ state: 'ADDITIONAL_REVIEW', reviewReason: 'enhanced compliance review' });
    expect((await operations.requestWithdrawalReview(withdrawalId, 'enhanced compliance review', 'admin-1', 'withdrawal-review-001')).replayed).toBe(true);
    await expect(operations.requestWithdrawalReview(withdrawalId, 'different reason', 'admin-1', 'withdrawal-review-001')).rejects.toThrow('idempotency key was already used');
    await expect(operations.approveWithdrawal(withdrawalId, 'premature approval', 'admin-1', 'withdrawal-approve-premature-001')).rejects.toThrow('not pending review');
    const returned = await operations.returnWithdrawalFromReview(withdrawalId, 'compliance review complete', 'admin-1', 'withdrawal-review-return-001');
    expect(returned.withdrawal.state).toBe('PENDING_REVIEW');
    expect((await operations.returnWithdrawalFromReview(withdrawalId, 'compliance review complete', 'admin-1', 'withdrawal-review-return-001')).replayed).toBe(true);
    expect((await operations.approveWithdrawal(withdrawalId, 'identity and destination reviewed', 'admin-1', 'withdrawal-approve-001')).withdrawal.state).toBe('APPROVED');
    expect((await operations.settleWithdrawal(withdrawalId, 'deterministic:receipt-001', 'admin-1', 'controlled non-live settlement')).withdrawal.state).toBe('SETTLED');
    expect((await operations.settleWithdrawal(withdrawalId, 'deterministic:receipt-001', 'admin-1', 'controlled non-live settlement')).replayed).toBe(true);
    await expect(bridge.select<{ available: string; locked: string }>(
      'SELECT "available","locked" FROM "LedgerAccount" WHERE "id"=?', ['main-1'],
    )).resolves.toMatchObject({ results: [{ available: '8.65', locked: '0' }] });
    const settledPostings = await bridge.select<{ referenceType: string; availableDelta: string; lockedDelta: string }>(
      'SELECT "referenceType","availableDelta","lockedDelta" FROM "LedgerPosting" WHERE "idempotencyKey"=? OR "referenceId"=?',
      [`gate2:withdrawal:reserve:${settledKey}`, withdrawalId],
    );
    expect(settledPostings.results.map(row => [row.referenceType, row.availableDelta, row.lockedDelta])).toEqual(expect.arrayContaining([
      ['GATE2_WITHDRAWAL_RESERVE', '-1.35', '1.35'],
      ['GATE2_WITHDRAWAL_SETTLEMENT', '0', '-1.35'],
    ]));
    const settledAudits = await bridge.select<{ count: number }>(
      'SELECT count(*) AS count FROM "LedgerAuditEvent" WHERE "idempotencyKey" IN (?,?)',
      [`gate2:withdrawal:reserve:${settledKey}`, `gate2:withdrawal:settle:${withdrawalId}`],
    );
    expect(settledAudits.results[0].count).toBe(2);
    const settledActivity = await bridge.select<{ status: string; referenceType: string; amount: string }>(
      'SELECT "status","referenceType","amount" FROM "Activity" WHERE "idempotencyKey"=?',
      [`gate2:withdrawal:reserve:${settledKey}`],
    );
    expect(settledActivity.results).toEqual([{ status: 'COMPLETED', referenceType: 'GATE2_WITHDRAWAL_SETTLEMENT', amount: '1.35' }]);
    const settledEvents = await bridge.select<{ eventType: string }>(
      'SELECT "eventType" FROM "EventOutbox" WHERE "aggregateId"=? ORDER BY "eventType"', [withdrawalId],
    );
    expect(settledEvents.results.map(event => event.eventType)).toEqual(['WITHDRAWAL_APPROVED', 'WITHDRAWAL_RESERVED', 'WITHDRAWAL_REVIEW_REQUESTED', 'WITHDRAWAL_REVIEW_RETURNED', 'WITHDRAWAL_SETTLED']);
    const reviewAudit = await bridge.select<{ adminId: string; action: string; details: string }>(
      'SELECT "adminId","action","details" FROM "AdminAuditLog" WHERE "action"=? AND "target"=?',
      ['WITHDRAWAL_REVIEW_REQUESTED', withdrawalId],
    );
    expect(reviewAudit.results).toHaveLength(1);
    expect(reviewAudit.results[0]).toMatchObject({ adminId: 'admin-1', action: 'WITHDRAWAL_REVIEW_REQUESTED' });
    const reviewReturnAudit = await bridge.select<{ adminId: string; action: string }>(
      'SELECT "adminId","action" FROM "AdminAuditLog" WHERE "action"=? AND "target"=?',
      ['WITHDRAWAL_REVIEW_RETURNED', withdrawalId],
    );
    expect(reviewReturnAudit.results).toEqual([{ adminId: 'admin-1', action: 'WITHDRAWAL_REVIEW_RETURNED' }]);

    const rejectedKey = 'withdrawal-local-reject-001';
    const rejected = await operations.requestWithdrawal('user-1', { ...request, amount: '2', idempotencyKey: rejectedKey });
    const rejectedId = String(rejected.withdrawal.id);
    const released = await operations.rejectWithdrawal(rejectedId, 'controlled rejection refund', 'admin-1', 'withdrawal-reject-001');
    expect(released.withdrawal.state).toBe('REJECTED');
    expect((await operations.rejectWithdrawal(rejectedId, 'controlled rejection refund', 'admin-1', 'withdrawal-reject-001')).replayed).toBe(true);
    await expect(bridge.select<{ available: string; locked: string }>(
      'SELECT "available","locked" FROM "LedgerAccount" WHERE "id"=?', ['main-1'],
    )).resolves.toMatchObject({ results: [{ available: '8.65', locked: '0' }] });
    const rejectedActivity = await bridge.select<{ status: string; referenceType: string }>(
      'SELECT "status","referenceType" FROM "Activity" WHERE "idempotencyKey"=?',
      [`gate2:withdrawal:reserve:${rejectedKey}`],
    );
    expect(rejectedActivity.results).toEqual([{ status: 'REJECTED', referenceType: 'GATE2_WITHDRAWAL_RELEASE' }]);
    const rejectedEvents = await bridge.select<{ eventType: string }>(
      'SELECT "eventType" FROM "EventOutbox" WHERE "aggregateId"=? ORDER BY "eventType"', [rejectedId],
    );
    expect(rejectedEvents.results.map(event => event.eventType)).toEqual(['WITHDRAWAL_REJECTED', 'WITHDRAWAL_RESERVED']);
    const rejectedPosting = await bridge.select<{ availableDelta: string; lockedDelta: string }>(
      'SELECT "availableDelta","lockedDelta" FROM "LedgerPosting" WHERE "referenceType"=? AND "referenceId"=?',
      ['GATE2_WITHDRAWAL_RELEASE', rejectedId],
    );
    expect(rejectedPosting.results).toEqual([{ availableDelta: '2.1', lockedDelta: '-2.1' }]);
    const adminAudits = await bridge.select<{ action: string }>(
      'SELECT "action" FROM "AdminAuditLog" WHERE "target" IN (?,?) ORDER BY "action"', [withdrawalId, rejectedId],
    );
    expect(adminAudits.results.map(row => row.action)).toEqual([
      'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'WITHDRAWAL_REVIEW_REQUESTED', 'WITHDRAWAL_REVIEW_RETURNED', 'WITHDRAWAL_SETTLED',
    ]);

    await expect(operations.requestWithdrawal('user-1', {
      ...request, amount: '1000', idempotencyKey: 'withdrawal-local-overdraft-001',
    })).rejects.toThrow('Insufficient available funds');
  });

  it('settles a Binary stake once and publishes a durable settlement event', async () => {
    const idempotencyKey = 'binary-local-settle-001';
    const openCommand = {
      userId: 'user-1', pair: 'BTCUSDT', asset: 'USDT', side: 'CALL', stake: '1.25',
      durationSeconds: 60, expiresAt: '2020-01-01T00:01:00.000Z', entryPrice: '60000',
      entryQuoteId: 'entry-quote-001', entryProvider: 'binance', entrySource: 'rest',
      entryObservedAt: '2020-01-01T00:00:00.000Z', entryReceivedAt: '2020-01-01T00:00:00.010Z',
      entrySequence: '101', quoteFreshnessMs: 10, configurationVersion: 1,
      idempotencyKey, correlationId: idempotencyKey,
    };
    const opened = await gateway.openBinaryPosition(openCommand);
    const settled = await gateway.settleBinaryPositionAtomic({
      positionId: String(opened.id), userId: 'user-1', asset: 'USDT', stake: '1.25', payout: '2.5',
      state: 'WIN', expiryPrice: '60001', expiryQuoteId: 'expiry-quote-001', expiryProvider: 'binance',
      expirySource: 'rest', expiryObservedAt: '2020-01-01T00:01:00.000Z',
      expiryReceivedAt: '2020-01-01T00:01:00.010Z', expirySequence: '102', realizedProfit: '1.25',
      idempotencyKey, correlationId: idempotencyKey,
    });
    await gateway.settleBinaryPositionAtomic({
      positionId: String(opened.id), userId: 'user-1', asset: 'USDT', stake: '1.25', payout: '2.5',
      state: 'WIN', expiryPrice: '60001', expiryQuoteId: 'expiry-quote-001', expiryProvider: 'binance',
      expirySource: 'rest', expiryObservedAt: '2020-01-01T00:01:00.000Z',
      expiryReceivedAt: '2020-01-01T00:01:00.010Z', expirySequence: '102', realizedProfit: '1.25',
      idempotencyKey, correlationId: idempotencyKey,
    });

    expect(settled.state).toBe('WIN');
    await expect(bridge.select<{ available: string; locked: string }>(
      'SELECT "available","locked" FROM "LedgerAccount" WHERE "id"=?', ['binary-1'],
    )).resolves.toMatchObject({ results: [{ available: '3.25', locked: '0' }] });
    const postings = await bridge.select<{ referenceType: string; availableDelta: string; lockedDelta: string }>(
      'SELECT "referenceType","availableDelta","lockedDelta" FROM "LedgerPosting" WHERE "referenceId"=? OR "idempotencyKey"=?',
      [String(opened.id), idempotencyKey],
    );
    expect(postings.results).toHaveLength(3);
    expect(postings.results.map(row => [row.referenceType, row.availableDelta, row.lockedDelta])).toEqual(expect.arrayContaining([
      ['GATE2_BINARY_STAKE_RESERVE', '-1.25', '1.25'],
      ['GATE2_BINARY_STAKE_SETTLEMENT', '0', '-1.25'],
      ['GATE2_BINARY_PAYOUT', '2.5', '0'],
    ]));
    const activities = await bridge.select<{ count: number }>(
      'SELECT count(*) AS count FROM "Activity" WHERE "referenceId"=?', [String(opened.id)],
    );
    expect(activities.results[0].count).toBe(2);
    const audits = await bridge.select<{ count: number }>(
      'SELECT count(*) AS count FROM "LedgerAuditEvent" WHERE "idempotencyKey" IN (?,?,?)',
      [idempotencyKey, `gate2:binary:settlement:${String(opened.id)}:stake`, `gate2:binary:settlement:${String(opened.id)}:payout`],
    );
    expect(audits.results[0].count).toBe(3);
    const operationAudits = await bridge.select<{ count: number }>(
      'SELECT count(*) AS count FROM "Gate2OperationAudit" WHERE "operationId"=?', [String(opened.id)],
    );
    expect(operationAudits.results[0].count).toBe(1);
    const outbox = await bridge.select<{ eventType: string; idempotencyKey: string; payload: string }>(
      'SELECT "eventType","idempotencyKey","payload" FROM "EventOutbox" WHERE "aggregateId"=? ORDER BY "eventType"', [String(opened.id)],
    );
    expect(outbox.results.map(event => event.eventType)).toEqual(['BINARY_POSITION_OPENED', 'BINARY_POSITION_SETTLED']);
    expect(outbox.results.find(event => event.eventType === 'BINARY_POSITION_SETTLED')).toMatchObject({
      idempotencyKey: `event:binary:settle:${String(opened.id)}:${idempotencyKey}`,
    });
    expect(JSON.parse(outbox.results.find(event => event.eventType === 'BINARY_POSITION_SETTLED')!.payload)).toMatchObject({
      userId: 'user-1', state: 'WIN', stake: '1.25', payout: '2.5', realizedProfit: '1.25',
    });

    const lossKey = 'binary-local-loss-001';
    const lossPosition = await gateway.openBinaryPosition({
      ...openCommand, stake: '0.5', idempotencyKey: lossKey, correlationId: lossKey,
    });
    const loss = await gateway.settleBinaryPositionAtomic({
      positionId: String(lossPosition.id), userId: 'user-1', asset: 'USDT', stake: '0.5', payout: '0',
      state: 'LOSS', expiryPrice: '59999', expiryQuoteId: 'expiry-quote-loss', expiryProvider: 'binance',
      expirySource: 'rest', expiryObservedAt: '2020-01-01T00:01:00.000Z',
      expiryReceivedAt: '2020-01-01T00:01:00.010Z', expirySequence: '103', realizedProfit: '-0.5',
      idempotencyKey: lossKey, correlationId: lossKey,
    });
    expect(loss.state).toBe('LOSS');
    await expect(bridge.select<{ available: string; locked: string }>(
      'SELECT "available","locked" FROM "LedgerAccount" WHERE "id"=?', ['binary-1'],
    )).resolves.toMatchObject({ results: [{ available: '2.75', locked: '0' }] });
    const lossPostings = await bridge.select<{ referenceType: string }>(
      'SELECT "referenceType" FROM "LedgerPosting" WHERE "idempotencyKey"=? OR "referenceId"=?',
      [lossKey, String(lossPosition.id)],
    );
    expect(lossPostings.results.map(row => row.referenceType)).toEqual([
      'GATE2_BINARY_STAKE_RESERVE', 'GATE2_BINARY_STAKE_SETTLEMENT',
    ]);
    const lossOutbox = await bridge.select<{ count: number }>(
      'SELECT count(*) AS count FROM "EventOutbox" WHERE "aggregateId"=?', [String(lossPosition.id)],
    );
    expect(lossOutbox.results[0].count).toBe(2);
  });

  it('rolls back Binary settlement when its Outbox idempotency key is occupied', async () => {
    const idempotencyKey = 'binary-outbox-collision-001';
    const position = await gateway.openBinaryPosition({
      userId: 'user-1', pair: 'BTCUSDT', asset: 'USDT', side: 'CALL', stake: '0.25',
      durationSeconds: 60, expiresAt: '2020-01-01T00:01:00.000Z', entryPrice: '60000',
      entryQuoteId: 'entry-quote-collision', entryProvider: 'binance', entrySource: 'rest',
      entryObservedAt: '2020-01-01T00:00:00.000Z', entryReceivedAt: '2020-01-01T00:00:00.010Z',
      entrySequence: '201', quoteFreshnessMs: 10, configurationVersion: 1,
      idempotencyKey, correlationId: idempotencyKey,
    });
    const eventKey = `event:binary:settle:${String(position.id)}:${idempotencyKey}`;
    await bridge.batch([{
      sql: `INSERT INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","attempts","createdAt","updatedAt") VALUES (?,?,?,?,?,1,?,?,'PENDING',CURRENT_TIMESTAMP,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      params: ['collision-event', eventKey, 'BINARY_POSITION', String(position.id), 'BINARY_POSITION_SETTLED', idempotencyKey, '{}'],
    }]);

    await expect(gateway.settleBinaryPositionAtomic({
      positionId: String(position.id), userId: 'user-1', asset: 'USDT', stake: '0.25', payout: '0.5',
      state: 'WIN', expiryPrice: '60001', expiryQuoteId: 'expiry-quote-collision', expiryProvider: 'binance',
      expirySource: 'rest', expiryObservedAt: '2020-01-01T00:01:00.000Z',
      expiryReceivedAt: '2020-01-01T00:01:00.010Z', expirySequence: '202', realizedProfit: '0.25',
      idempotencyKey, correlationId: idempotencyKey,
    })).rejects.toThrow();

    await expect(gateway.getBinaryPosition(String(position.id))).resolves.toMatchObject({ state: 'ACTIVE' });
    await expect(bridge.select<{ available: string; locked: string }>(
      'SELECT "available","locked" FROM "LedgerAccount" WHERE "id"=?', ['binary-1'],
    )).resolves.toMatchObject({ results: [{ available: '1.75', locked: '0.25' }] });
    const postings = await bridge.select<{ referenceType: string }>(
      'SELECT "referenceType" FROM "LedgerPosting" WHERE "referenceId"=? OR "idempotencyKey"=?',
      [String(position.id), idempotencyKey],
    );
    expect(postings.results.map(row => row.referenceType)).toEqual(['GATE2_BINARY_STAKE_RESERVE']);
    const activities = await bridge.select<{ count: number }>(
      'SELECT count(*) AS count FROM "Activity" WHERE "referenceId"=?', [String(position.id)],
    );
    expect(activities.results[0].count).toBe(0);
  });
});
