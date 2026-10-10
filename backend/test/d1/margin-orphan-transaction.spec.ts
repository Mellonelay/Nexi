import { createRequire } from "node:module";
import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import type { D1BridgeBatchStatement, D1WorkerBridgeService } from "../../src/d1/d1-worker-bridge.service";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");

const openingKey = "margin-open-old";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec([
    'CREATE TABLE "LedgerAccount" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "asset" TEXT, "scope" TEXT, "status" TEXT, "available" TEXT, "locked" TEXT, "updatedAt" TEXT)',
    'CREATE TABLE "LedgerPosting" ("id" TEXT NOT NULL PRIMARY KEY, "accountId" TEXT, "asset" TEXT, "kind" TEXT, "amount" TEXT, "availableDelta" TEXT, "lockedDelta" TEXT, "referenceType" TEXT, "referenceId" TEXT, "idempotencyKey" TEXT, "correlationId" TEXT, "economicGroup" TEXT, "createdAt" TEXT, "metadata" TEXT)',
    'CREATE TABLE "LedgerIdempotency" ("id" TEXT NOT NULL PRIMARY KEY, "idempotencyKey" TEXT UNIQUE, "operation" TEXT, "accountId" TEXT, "debitPostingId" TEXT, "creditPostingId" TEXT, "createdAt" TEXT, "updatedAt" TEXT)',
    'CREATE TABLE "Gate2SpotOrder" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "idempotencyKey" TEXT, "status" TEXT, "filled" TEXT, "reservedAmount" TEXT, "reserveScope" TEXT)',
    'CREATE TABLE "Gate2SpotTrade" ("buyerOrderId" TEXT, "sellerOrderId" TEXT)',
    'CREATE TABLE "SpotMarginAccount" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "pair" TEXT, "quoteAsset" TEXT)',
    'CREATE TABLE "SpotMarginPosition" ("id" TEXT NOT NULL PRIMARY KEY, "accountId" TEXT, "direction" TEXT, "leverage" INTEGER, "collateral" TEXT, "quantity" TEXT, "entryPrice" TEXT, "markPrice" TEXT, "debtAsset" TEXT, "debtPrincipal" TEXT, "interestAccrued" TEXT, "realizedPnl" TEXT, "unrealizedPnl" TEXT, "status" TEXT, "openIdempotencyKey" TEXT, "entryOrderId" TEXT, "openedAt" TEXT, "updatedAt" TEXT)',
    'CREATE TABLE "LedgerAuditEvent" ("id" TEXT NOT NULL PRIMARY KEY, "accountId" TEXT, "postingId" TEXT, "eventType" TEXT, "idempotencyKey" TEXT, "correlationId" TEXT, "details" TEXT, "createdAt" TEXT)',
    'CREATE TABLE "Activity" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "type" TEXT, "status" TEXT, "referenceType" TEXT, "referenceId" TEXT, "idempotencyKey" TEXT, "ledgerCorrelationId" TEXT, "ledgerPostingId" TEXT, "asset" TEXT, "amount" TEXT, "details" TEXT, "createdAt" TEXT)',
    'CREATE TABLE "EventOutbox" ("id" TEXT NOT NULL PRIMARY KEY, "idempotencyKey" TEXT UNIQUE, "aggregateType" TEXT, "aggregateId" TEXT, "eventType" TEXT, "eventVersion" INTEGER, "correlationId" TEXT, "payload" TEXT, "state" TEXT, "availableAt" TEXT, "attempts" INTEGER, "createdAt" TEXT, "updatedAt" TEXT)',
  ].join(";"));
  db.exec("INSERT INTO \"LedgerAccount\" (\"id\",\"userId\",\"asset\",\"scope\",\"status\",\"available\",\"locked\") VALUES ('account-1','user-1','USDT','MARGIN','ACTIVE','60','0')");
  db.exec("INSERT INTO \"LedgerPosting\" (\"id\",\"accountId\",\"asset\",\"kind\",\"amount\",\"availableDelta\",\"lockedDelta\",\"referenceType\",\"referenceId\",\"idempotencyKey\",\"correlationId\",\"economicGroup\") VALUES ('borrow-1','account-1','USDT','CREDIT','10','10','0','SPOT_MARGIN_BORROW','margin-open-old','margin:borrow:margin-open-old','margin-open-old','isolated-1')");
  db.exec("INSERT INTO \"Gate2SpotOrder\" (\"id\",\"userId\",\"idempotencyKey\",\"status\",\"filled\",\"reservedAmount\",\"reserveScope\") VALUES ('entry-old','user-1','margin:entry:margin-open-old','CANCELED','0','0','MARGIN')");
  const bridge = {
    isEnabled: jest.fn().mockReturnValue(true),
    select: jest.fn().mockImplementation(async (sql: string, params: unknown[] = []) => ({
      results: db.prepare(sql).all(...params),
    })),
    batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => {
      db.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((statement) => {
          const result = db.prepare(statement.sql).run(...(statement.params ?? []));
          return { success: true, meta: { changes: Number(result.changes) } };
        });
        db.exec("COMMIT");
        return { results };
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }),
  };
  return { db, bridge, gateway: new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService) };
}

describe("D1 orphan Margin borrow repayment — real SQLite transaction", () => {
  const previous = process.env.D1_RUNTIME_ENABLED;
  beforeEach(() => { process.env.D1_RUNTIME_ENABLED = "true"; });
  afterAll(() => {
    if (previous === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previous;
  });

  it("debits exactly once, audits, publishes via Outbox and safely replays", async () => {
    const { db, bridge, gateway } = fixture();
    try {
      const first = await gateway.repayUnmatchedMarginBorrow("user-1", openingKey);
      expect(first.replayed).toBe(false);
      expect(db.prepare('SELECT "available" FROM "LedgerAccount"').get().available).toBe("50");
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'DEBIT\'').get().n).toBe(1);
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerAuditEvent"').get().n).toBe(1);
      expect(db.prepare('SELECT count(*) AS n FROM "Activity"').get().n).toBe(1);
      expect(db.prepare('SELECT count(*) AS n FROM "EventOutbox"').get().n).toBe(1);
      const replay = await gateway.repayUnmatchedMarginBorrow("user-1", openingKey);
      expect(replay.replayed).toBe(true);
      expect(bridge.batch).toHaveBeenCalledTimes(1);
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting"').get().n).toBe(2);
    } finally { db.close(); }
  });

  it("rolls back completely if a position appeared before the debit", async () => {
    const { db, gateway } = fixture();
    try {
      db.exec("INSERT INTO \"SpotMarginAccount\" (\"id\",\"userId\") VALUES ('margin-1','user-1')");
      db.exec("INSERT INTO \"SpotMarginPosition\" (\"id\",\"accountId\",\"openIdempotencyKey\") VALUES ('position-1','margin-1','margin-open-old')");
      await expect(gateway.repayUnmatchedMarginBorrow("user-1", openingKey)).rejects.toThrow();
      expect(db.prepare('SELECT "available" FROM "LedgerAccount"').get().available).toBe("60");
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'DEBIT\'').get().n).toBe(0);
      expect(db.prepare('SELECT count(*) AS n FROM "EventOutbox"').get().n).toBe(0);
    } finally { db.close(); }
  });

  it("refuses to repay an order involved in a trade", async () => {
    const { db, gateway } = fixture();
    try {
      db.exec("INSERT INTO \"Gate2SpotTrade\" (\"buyerOrderId\",\"sellerOrderId\") VALUES ('entry-old','other-order')");
      await expect(gateway.repayUnmatchedMarginBorrow("user-1", openingKey)).rejects.toThrow();
      expect(db.prepare('SELECT "available" FROM "LedgerAccount"').get().available).toBe("60");
    } finally { db.close(); }
  });

  it("materializes a valid pending position when the entry is active and debt has not been repaid", async () => {
    const { db, bridge, gateway } = fixture();
    try {
      db.exec("INSERT INTO \"SpotMarginAccount\" (\"id\",\"userId\",\"pair\",\"quoteAsset\") VALUES ('isolated-1','user-1','BTCUSDT','USDT')");
      db.exec("UPDATE \"Gate2SpotOrder\" SET \"status\"='OPEN' WHERE \"id\"='entry-old'");
      let inserted = -1;
      (bridge.batch as jest.Mock).mockImplementationOnce(async (statements: D1BridgeBatchStatement[]) => {
        inserted = Number(db.prepare(statements[0].sql).run(...(statements[0].params ?? [])).changes);
        return { results: statements.map((_, index) => ({ success: true, meta: { changes: index === 0 ? inserted : 0 } })) };
      });
      const position = await gateway.createMarginPosition({
        positionId: "valid-position-1", accountId: "isolated-1", userId: "user-1",
        direction: "LONG", leverage: 2, collateral: "10", quantity: "0",
        entryPrice: "100", markPrice: "100", status: "PENDING",
        debtAsset: "USDT", debtPrincipal: "10", openIdempotencyKey: openingKey,
        entryOrderId: "entry-old", pair: "BTCUSDT", positionAsset: "BTC",
        activityId: "valid-activity-1", positionEventId: "valid-event-1",
      });
      expect(inserted).toBe(1);
      expect(position).toMatchObject({ id: "valid-position-1", status: "PENDING" });
    } finally { db.close(); }
  });

  it("blocks delayed position materialization after an orphan borrow was repaid", async () => {
    const { db, bridge, gateway } = fixture();
    try {
      await gateway.repayUnmatchedMarginBorrow("user-1", openingKey);
      // Even if a stale worker tries to re-open the order, completed repayment wins.
      db.exec("UPDATE \"Gate2SpotOrder\" SET \"status\"='OPEN' WHERE \"id\"='entry-old'");
      let inserted = -1;
      (bridge.batch as jest.Mock).mockImplementationOnce(async (statements: D1BridgeBatchStatement[]) => {
        inserted = Number(db.prepare(statements[0].sql).run(...(statements[0].params ?? [])).changes);
        return { results: statements.map((_, index) => ({ success: true, meta: { changes: index === 0 ? inserted : 0 } })) };
      });
      await expect(gateway.createMarginPosition({
        positionId: "late-position-1", accountId: "isolated-1", userId: "user-1",
        direction: "LONG", leverage: 2, collateral: "10", quantity: "0",
        entryPrice: "100", markPrice: "100", status: "PENDING",
        debtAsset: "USDT", debtPrincipal: "10", openIdempotencyKey: openingKey,
        entryOrderId: "entry-old", pair: "BTCUSDT", positionAsset: "BTC",
        activityId: "late-activity-1", positionEventId: "late-event-1",
      })).rejects.toThrow();
      expect(inserted).toBe(0);
      expect(db.prepare('SELECT count(*) AS n FROM "SpotMarginPosition"').get().n).toBe(0);
    } finally { db.close(); }
  });

  it("refuses to repay another user's borrow", async () => {
    const { db, gateway } = fixture();
    try {
      await expect(gateway.repayUnmatchedMarginBorrow("user-2", openingKey))
        .rejects.toThrow("Owned Margin borrow not found");
      expect(db.prepare('SELECT "available" FROM "LedgerAccount"').get().available).toBe("60");
    } finally { db.close(); }
  });
});
