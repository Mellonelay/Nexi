import Database from "better-sqlite3";
import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";

describe("Binary global policy initialization", () => {
  let db: Database.Database;
  let gateway: D1FinancialCommandGateway;
  const durations = [30, 60, 180, 280, 420];

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE Gate2BinaryConfiguration (
        id TEXT PRIMARY KEY, pair TEXT NOT NULL, durationSeconds INTEGER NOT NULL,
        payoutRate TEXT NOT NULL, lossRate TEXT NOT NULL, minStake TEXT NOT NULL,
        maxStake TEXT NOT NULL, settlementDelaySeconds INTEGER NOT NULL,
        version INTEGER NOT NULL, enabled INTEGER NOT NULL, createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL, UNIQUE(pair, durationSeconds, version)
      );
      CREATE TABLE SystemConfig (
        id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL,
        description TEXT, updatedAt TEXT NOT NULL
      );
      CREATE TABLE AdminAuditLog (
        id TEXT PRIMARY KEY, adminId TEXT NOT NULL, action TEXT NOT NULL,
        target TEXT, details TEXT, createdAt TEXT NOT NULL
      );
      CREATE TABLE EventOutbox (
        id TEXT PRIMARY KEY, idempotencyKey TEXT NOT NULL UNIQUE,
        aggregateType TEXT NOT NULL, aggregateId TEXT NOT NULL, eventType TEXT NOT NULL,
        eventVersion INTEGER NOT NULL, correlationId TEXT, payload TEXT NOT NULL,
        state TEXT NOT NULL, availableAt TEXT NOT NULL, attempts INTEGER NOT NULL,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );
    `);
    const insert = db.prepare(`
      INSERT INTO Gate2BinaryConfiguration VALUES (?, ?, ?, ?, '0', ?, ?, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    for (const pair of ["BTCUSDT", "ETHUSDT"]) {
      for (const duration of durations) {
        insert.run(
          pair + duration,
          pair,
          duration,
          pair === "BTCUSDT" ? "0.75" : "0.90",
          pair === "BTCUSDT" ? "1" : "2",
          "1000",
        );
      }
    }
    const bridge = {
      isEnabled: () => true,
      select: async (sql: string, params: unknown[] = []) => ({
        results: db.prepare(sql).all(...params),
      }),
      batch: async (statements: Array<{ sql: string; params: unknown[] }>) =>
        db
          .transaction(() => ({
            results: statements.map((statement) => ({
              meta: {
                changes: db.prepare(statement.sql).run(...statement.params)
                  .changes,
              },
            })),
          }))
          .immediate(),
    };
    gateway = new D1FinancialCommandGateway(bridge as any);
  });

  afterEach(() => db.close());

  function command(key = "global-init-123") {
    return {
      minStake: "5.25",
      maxStake: "500",
      durations: durations.map((durationSeconds, index) => ({
        durationSeconds,
        payoutRate: 0.8 + index * 0.01,
        enabled: durationSeconds !== 60,
      })),
      adminId: "admin-1",
      reason: "Set shared policy",
      idempotencyKey: key,
    };
  }

  it("returns an empty operator draft despite conflicting legacy values", async () => {
    await expect(gateway.getBinaryGlobalConfiguration()).resolves.toEqual({
      version: 0,
      minStake: "",
      maxStake: "",
      durations: durations.map((durationSeconds) => ({
        durationSeconds,
        payoutRate: 0,
        enabled: false,
      })),
    });
    expect(db.prepare("SELECT COUNT(*) AS n FROM SystemConfig").get()).toEqual({
      n: 0,
    });
  });

  it("saves explicit terms once, retains historical snapshots and enforces global duration enablement", async () => {
    const input = command();
    const saved: any = await gateway.updateBinaryGlobalConfiguration(input);
    expect(saved).toEqual(
      expect.objectContaining({
        version: 1,
        minStake: "5.25",
        maxStake: "500",
      }),
    );
    await expect(
      gateway.updateBinaryGlobalConfiguration(input),
    ).resolves.toEqual({ ...saved, replayed: true });
    await expect(
      gateway.updateBinaryGlobalConfiguration({ ...input, minStake: "6" }),
    ).rejects.toThrow();

    const historical: any = await gateway.getBinaryConfiguration(
      "BTCUSDT",
      60,
      1,
    );
    expect(historical).toEqual(
      expect.objectContaining({
        payoutRate: "0.75",
        minStake: "1",
        version: 1,
        enabled: 1,
      }),
    );
    const current: any = await gateway.getBinaryConfiguration("BTCUSDT", 60);
    expect(current).toEqual(
      expect.objectContaining({ version: 2, enabled: false, minStake: "5.25" }),
    );
    const rows: any[] = await gateway.listBinaryConfigurations();
    expect(rows).toHaveLength(10);
    expect(
      rows
        .filter((row) => row.durationSeconds === 60)
        .every((row) => row.pairEnabled && !row.enabled),
    ).toBe(true);
    expect(
      rows.every((row) => row.minStake === "5.25" && row.maxStake === "500"),
    ).toBe(true);
    expect(
      db.prepare("SELECT COUNT(*) AS n FROM Gate2BinaryConfiguration").get(),
    ).toEqual({ n: 20 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM EventOutbox").get()).toEqual({
      n: 1,
    });
  });

  it("rejects missing durations and rolls back competing first writes", async () => {
    const input = command();
    await expect(
      gateway.updateBinaryGlobalConfiguration({
        ...input,
        durations: input.durations.slice(0, 4),
      }),
    ).rejects.toThrow();
    const results = await Promise.allSettled([
      gateway.updateBinaryGlobalConfiguration(input),
      gateway.updateBinaryGlobalConfiguration({
        ...input,
        minStake: "7",
        idempotencyKey: "global-init-456",
      }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      db.prepare("SELECT COUNT(*) AS n FROM Gate2BinaryConfiguration").get(),
    ).toEqual({ n: 20 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM AdminAuditLog").get()).toEqual(
      { n: 1 },
    );
    expect(db.prepare("SELECT COUNT(*) AS n FROM EventOutbox").get()).toEqual({
      n: 1,
    });
  });
});
