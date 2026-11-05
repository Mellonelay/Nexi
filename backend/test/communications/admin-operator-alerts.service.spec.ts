import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { AdminOperatorAlertsService } from "../../src/communications/admin-operator-alerts.service";

describe("AdminOperatorAlertsService", () => {
  let db: Database.Database;
  let service: AdminOperatorAlertsService;
  const gateway = { notifyOperatorAlertsChanged: jest.fn() };
  const prisma: any = {
    $queryRawUnsafe: jest.fn((sql: string, ...params: unknown[]) =>
      db.prepare(sql).all(...params),
    ),
    atomicBatch: jest.fn((statements: Array<{ sql: string; params?: unknown[] }>) => {
      db.transaction(() => {
        for (const statement of statements) {
          db.prepare(statement.sql).run(...(statement.params ?? []));
        }
      })();
    }),
    adminRoleAssignment: {
      findUnique: jest.fn().mockResolvedValue({ roleId: "finance_operator" }),
    },
  };

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(readFileSync(new URL("../../prisma/migrations-d1/0019_admin_operator_alerts.sql", import.meta.url), "utf8"));
    db.exec(`CREATE TABLE "EventOutbox" (
      "id" TEXT PRIMARY KEY, "eventType" TEXT NOT NULL, "aggregateType" TEXT NOT NULL,
      "aggregateId" TEXT NOT NULL, "createdAt" TEXT NOT NULL, "state" TEXT NOT NULL,
      "lastErrorCode" TEXT
    )`);
    const insert = db.prepare('INSERT INTO "EventOutbox" ("id","eventType","aggregateType","aggregateId","createdAt","state","lastErrorCode") VALUES (?,?,?,?,?,?,?)');
    insert.run("evt-registration", "USER_REGISTERED", "USER", "user-1", "2026-11-05T10:00:00.000Z", "PUBLISHED", null);
    insert.run("evt-kyc", "KYC_SUBMITTED", "KYC", "kyc-1", "2026-11-05T10:01:00.000Z", "PUBLISHED", null);
    insert.run("evt-deposit", "DEPOSIT_CLAIM_SUBMITTED", "DEPOSIT_CLAIM", "deposit-1", "2026-11-05T10:02:00.000Z", "PUBLISHED", null);
    insert.run("evt-binary", "BINARY_POSITION_OPENED", "BINARY_POSITION", "position-1", "2026-11-05T10:03:00.000Z", "PUBLISHED", null);
    insert.run("evt-dead-letter", "UNRECOGNIZED_EVENT", "WORKFLOW", "private-aggregate-1", "2026-11-05T10:04:00.000Z", "DEAD_LETTERED", "DELIVERY_FAILED");
    gateway.notifyOperatorAlertsChanged.mockClear();
    prisma.$queryRawUnsafe.mockClear();
    prisma.atomicBatch.mockClear();
    service = new AdminOperatorAlertsService(prisma, gateway as any);
  });

  afterEach(() => db.close());

  it("materializes committed outbox events once and emits only a generic invalidation", async () => {
    await service.materializeCommittedEvents();
    await service.materializeCommittedEvents();

    expect(db.prepare('SELECT COUNT(*) AS count FROM "AdminOperatorAlert"').get()).toEqual({ count: 5 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM "AdminOperatorAlertSource"').get()).toEqual({ count: 5 });
    expect(gateway.notifyOperatorAlertsChanged).toHaveBeenCalledTimes(1);

    const failure = db.prepare('SELECT "category","severity","referenceType","referenceId" FROM "AdminOperatorAlert" WHERE "title"=?').get("Event delivery failed");
    expect(failure).toMatchObject({ category: "SYSTEM", severity: "HIGH", referenceType: "WORKFLOW", referenceId: "private-aggregate-1" });
  });

  it("limits alerts and read state by the operator role, then applies category preferences", async () => {
    await service.materializeCommittedEvents();
    const first = await service.list("admin-1");
    expect(first.items.map((item: any) => item.title).sort()).toEqual([
      "Deposit claim submitted",
      "Event delivery failed",
      "New user registered",
    ]);
    expect(first.unreadCount).toBe(3);

    const deposit = first.items.find((item: any) => item.title === "Deposit claim submitted");
    await service.markRead("admin-1", deposit.id);
    const afterRead = await service.list("admin-1");
    expect(afterRead.unreadCount).toBe(2);

    const kyc = db.prepare('SELECT "id" FROM "AdminOperatorAlert" WHERE "category"=?').get("IDENTITY") as { id: string };
    await expect(service.markRead("admin-1", kyc.id)).rejects.toThrow("Operator alert not found");

    await service.updatePreferences("admin-1", ["WALLET"]);
    const afterPreference = await service.list("admin-1");
    expect(afterPreference.items.map((item: any) => item.title).sort()).toEqual([
      "Event delivery failed",
      "New user registered",
    ]);
    expect(afterPreference.unreadCount).toBe(2);
  });

  it("rejects category values outside the supported preference set", async () => {
    await expect(service.updatePreferences("admin-1", ["CUSTOMERS"])).rejects.toThrow("Invalid operator alert categories");
  });
});
