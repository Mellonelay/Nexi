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
    'CREATE TABLE "SpotMarginPositionEvent" ("id" TEXT NOT NULL PRIMARY KEY, "positionId" TEXT, "type" TEXT, "asset" TEXT, "amount" TEXT, "price" TEXT, "idempotencyKey" TEXT, "metadata" TEXT, "createdAt" TEXT)',
    'CREATE TABLE "SpotMarginActivity" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "accountId" TEXT, "positionId" TEXT, "type" TEXT, "status" TEXT, "idempotencyKey" TEXT, "details" TEXT, "createdAt" TEXT)',
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

  it("looks up the original order and borrow using the authenticated user, without a write", async () => {
    const { db, bridge, gateway } = fixture();
    try {
      const owned = await gateway.getMarginOpeningIntent("user-1", openingKey);
      expect(owned.position).toBeNull();
      expect(owned.order).toMatchObject({ id: "entry-old", reserveScope: "MARGIN" });
      expect(owned.borrow).toMatchObject({ id: "borrow-1", amount: "10" });
      const foreign = await gateway.getMarginOpeningIntent("user-2", openingKey);
      expect(foreign).toEqual({ position: null, order: null, borrow: null });
      expect(bridge.batch).not.toHaveBeenCalled();
    } finally { db.close(); }
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

  it("returns the original Margin position on retry and rejects changed opening terms", async () => {
    const { db, bridge, gateway } = fixture();
    try {
      db.exec("INSERT INTO \"SpotMarginAccount\" (\"id\",\"userId\",\"pair\",\"quoteAsset\") VALUES ('isolated-1','user-1','BTCUSDT','USDT')");
      db.exec("UPDATE \"Gate2SpotOrder\" SET \"status\"='OPEN' WHERE \"id\"='entry-old'");
      const command = {
        positionId: "valid-position-1", accountId: "isolated-1", userId: "user-1",
        direction: "LONG", leverage: 2, collateral: "10", quantity: "0",
        entryPrice: "100", markPrice: "100", status: "PENDING",
        debtAsset: "USDT", debtPrincipal: "10", openIdempotencyKey: openingKey,
        entryOrderId: "entry-old", pair: "BTCUSDT", positionAsset: "BTC",
        activityId: "valid-activity-1", positionEventId: "valid-event-1",
      };
      const created = await gateway.createMarginPosition(command);
      const replay = await gateway.createMarginPosition({ ...command, positionId: "retry-position-id", activityId: "retry-activity-id", positionEventId: "retry-event-id" });
      expect(replay.id).toBe(created.id);
      await expect(gateway.createMarginPosition({ ...command, collateral: "11" })).rejects.toThrow("idempotency key was reused");
      expect(bridge.batch).toHaveBeenCalledTimes(1);
      expect(db.prepare('SELECT count(*) AS n FROM "SpotMarginPosition"').get().n).toBe(1);
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

  it("atomically releases an OPEN zero-fill entry, repays its borrow, closes the position, and reconciles Ledger", async () => {
    const { db, gateway } = fixture();
    try {
      db.exec('ALTER TABLE "SpotMarginPosition" ADD COLUMN "closedAt" TEXT');
      db.exec('ALTER TABLE "Gate2SpotOrder" ADD COLUMN "reserveAsset" TEXT');
      db.exec('ALTER TABLE "Gate2SpotOrder" ADD COLUMN "correlationId" TEXT');
      db.exec('ALTER TABLE "Gate2SpotOrder" ADD COLUMN "updatedAt" TEXT');
      db.exec("INSERT INTO \"SpotMarginAccount\" (\"id\",\"userId\",\"pair\",\"quoteAsset\") VALUES ('isolated-1','user-1','BTCUSDT','USDT')");
      db.exec("INSERT INTO \"SpotMarginPosition\" (\"id\",\"accountId\",\"direction\",\"quantity\",\"debtAsset\",\"debtPrincipal\",\"status\",\"openIdempotencyKey\",\"entryOrderId\") VALUES ('pending-1','isolated-1','LONG','0','USDT','10','PENDING','margin-open-old','entry-old')");
      db.exec("UPDATE \"Gate2SpotOrder\" SET \"status\"='OPEN',\"reserveAsset\"='USDT',\"correlationId\"='margin-open-old',\"reservedAmount\"='12.002' WHERE \"id\"='entry-old'");
      db.exec("UPDATE \"LedgerAccount\" SET \"available\"='47.998',\"locked\"='12.002' WHERE \"id\"='account-1'");
      db.exec("INSERT INTO \"LedgerPosting\" (\"id\",\"accountId\",\"asset\",\"kind\",\"amount\",\"availableDelta\",\"lockedDelta\",\"referenceType\",\"referenceId\",\"idempotencyKey\",\"correlationId\") VALUES ('seed-1','account-1','USDT','CREDIT','50','50','0','TEST_FIXTURE','seed','seed-key','seed')");
      db.exec("INSERT INTO \"LedgerPosting\" (\"id\",\"accountId\",\"asset\",\"kind\",\"amount\",\"availableDelta\",\"lockedDelta\",\"referenceType\",\"referenceId\",\"idempotencyKey\",\"correlationId\") VALUES ('reserve-1','account-1','USDT','RESERVE','12.002','-12.002','12.002','TEST_FIXTURE','entry-old','reserve-key','margin-open-old')");
      expect(await gateway.reconcile("account-1", "USDT")).toMatchObject({ available: "47.998", locked: "12.002" });
      const result = await gateway.cancelPendingMarginPosition("user-1", "pending-1", "margin-cancel-key-03");
      expect(result).toMatchObject({ state: "CLOSED", replayed: false });
      expect(db.prepare('SELECT "status","reservedAmount" FROM "Gate2SpotOrder"').get()).toMatchObject({ status: "CANCELED", reservedAmount: "0" });
      expect(db.prepare('SELECT "status" FROM "SpotMarginPosition"').get().status).toBe("CLOSED");
      expect(await gateway.reconcile("account-1", "USDT")).toMatchObject({ available: "50", locked: "0" });
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'DEBIT\'').get().n).toBe(1);
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'RELEASE\'').get().n).toBe(1);
      expect(db.prepare('SELECT count(*) AS n FROM "EventOutbox"').get().n).toBe(3);
      const replay = await gateway.cancelPendingMarginPosition("user-1", "pending-1", "margin-cancel-key-03");
      expect(replay.replayed).toBe(true);
      expect(await gateway.reconcile("account-1", "USDT")).toMatchObject({ available: "50", locked: "0" });
    } finally { db.close(); }
  });

  it("rolls back release and repayment if a pending entry fills before its guarded cancellation", async () => {
    const { db, bridge, gateway } = fixture();
    try {
      db.exec('ALTER TABLE "SpotMarginPosition" ADD COLUMN "closedAt" TEXT');
      db.exec('ALTER TABLE "Gate2SpotOrder" ADD COLUMN "reserveAsset" TEXT');
      db.exec('ALTER TABLE "Gate2SpotOrder" ADD COLUMN "correlationId" TEXT');
      db.exec('ALTER TABLE "Gate2SpotOrder" ADD COLUMN "updatedAt" TEXT');
      db.exec("INSERT INTO \"SpotMarginAccount\" (\"id\",\"userId\") VALUES ('isolated-1','user-1')");
      db.exec("INSERT INTO \"SpotMarginPosition\" (\"id\",\"accountId\",\"quantity\",\"debtAsset\",\"status\",\"openIdempotencyKey\",\"entryOrderId\") VALUES ('pending-1','isolated-1','0','USDT','PENDING','margin-open-old','entry-old')");
      db.exec("UPDATE \"Gate2SpotOrder\" SET \"status\"='OPEN',\"reserveAsset\"='USDT',\"correlationId\"='margin-open-old',\"reservedAmount\"='12.002' WHERE \"id\"='entry-old'");
      db.exec("UPDATE \"LedgerAccount\" SET \"available\"='47.998',\"locked\"='12.002' WHERE \"id\"='account-1'");
      const actualBatch = (bridge.batch as jest.Mock).getMockImplementation()!;
      (bridge.batch as jest.Mock).mockImplementationOnce(async (statements: D1BridgeBatchStatement[]) => {
        db.exec("UPDATE \"Gate2SpotOrder\" SET \"status\"='PARTIALLY_FILLED',\"filled\"='0.00001' WHERE \"id\"='entry-old'");
        return actualBatch(statements);
      });
      await expect(gateway.cancelPendingMarginPosition("user-1", "pending-1", "margin-cancel-race-01")).rejects.toThrow();
      expect(db.prepare('SELECT "available","locked" FROM "LedgerAccount"').get()).toMatchObject({ available: "47.998", locked: "12.002" });
      expect(db.prepare('SELECT "status" FROM "SpotMarginPosition"').get().status).toBe("PENDING");
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'DEBIT\'').get().n).toBe(0);
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'RELEASE\'').get().n).toBe(0);
    } finally { db.close(); }
  });

  it("cancels a zero-fill pending position after reserve release and repays the borrow exactly once", async () => {
    const { db, gateway } = fixture();
    try {
      db.exec('ALTER TABLE "SpotMarginPosition" ADD COLUMN "closedAt" TEXT');
      db.exec("INSERT INTO \"SpotMarginAccount\" (\"id\",\"userId\",\"pair\",\"quoteAsset\") VALUES ('isolated-1','user-1','BTCUSDT','USDT')");
      db.exec("INSERT INTO \"SpotMarginPosition\" (\"id\",\"accountId\",\"direction\",\"quantity\",\"debtAsset\",\"debtPrincipal\",\"status\",\"openIdempotencyKey\",\"entryOrderId\") VALUES ('pending-1','isolated-1','LONG','0','USDT','10','PENDING','margin-open-old','entry-old')");
      const first = await gateway.cancelPendingMarginPosition("user-1", "pending-1", "margin-cancel-key-01");
      expect(first).toMatchObject({ positionId: "pending-1", state: "CLOSED", replayed: false });
      expect(db.prepare('SELECT "available" FROM "LedgerAccount"').get().available).toBe("50");
      expect(db.prepare('SELECT "status" FROM "SpotMarginPosition"').get().status).toBe("CLOSED");
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'DEBIT\'').get().n).toBe(1);
      expect(db.prepare('SELECT count(*) AS n FROM "Activity"').get().n).toBe(2);
      expect(db.prepare('SELECT count(*) AS n FROM "EventOutbox"').get().n).toBe(2);
      const replay = await gateway.cancelPendingMarginPosition("user-1", "pending-1", "margin-cancel-key-01");
      expect(replay.replayed).toBe(true);
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'DEBIT\'').get().n).toBe(1);
    } finally { db.close(); }
  });

  it("rejects pending cancellation if the entry has executed trades or belongs to another user", async () => {
    const { db, gateway } = fixture();
    try {
      db.exec('ALTER TABLE "SpotMarginPosition" ADD COLUMN "closedAt" TEXT');
      db.exec("INSERT INTO \"SpotMarginAccount\" (\"id\",\"userId\") VALUES ('isolated-1','user-1')");
      db.exec("INSERT INTO \"SpotMarginPosition\" (\"id\",\"accountId\",\"quantity\",\"debtAsset\",\"status\",\"openIdempotencyKey\",\"entryOrderId\") VALUES ('pending-1','isolated-1','0','USDT','PENDING','margin-open-old','entry-old')");
      await expect(gateway.cancelPendingMarginPosition("user-2", "pending-1", "margin-cancel-key-02")).rejects.toThrow();
      db.exec("INSERT INTO \"Gate2SpotTrade\" (\"buyerOrderId\",\"sellerOrderId\") VALUES ('entry-old','trade-peer')");
      await expect(gateway.cancelPendingMarginPosition("user-1", "pending-1", "margin-cancel-key-02")).rejects.toThrow("Margin entry has executed trades");
      expect(db.prepare('SELECT "available" FROM "LedgerAccount"').get().available).toBe("60");
      expect(db.prepare('SELECT count(*) AS n FROM "LedgerPosting" WHERE "kind"=\'DEBIT\'').get().n).toBe(0);
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
