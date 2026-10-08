import { BadRequestException } from "@nestjs/common";
import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import { D1BridgeBatchStatement, D1WorkerBridgeService } from "../../src/d1/d1-worker-bridge.service";

const createdCurrency = {
  id: 101, symbol: "BTC", name: "Bitcoin", rate: "1.0",
  minDeposit: "0.001", maxDeposit: "10", minWithdrawal: "0.001",
  maxWithdrawal: "10", withdrawalFee: "0.0001", depositEnabled: 0,
  withdrawEnabled: 0, confirmationCount: 3, decimals: 8, isActive: 0,
};

type CurrencyAuditRecord = {
  adminId: string;
  target: string;
  reason: string;
  payload: string;
  details: string;
};

function isCurrencyCreationAuditQuery(sql: string): boolean {
  return sql.includes('FROM "AdminAuditLog"') && sql.includes("CURRENCY_CREATED");
}

function matchesCurrencyCreationAudit(
  params: unknown[],
  auditRecord: CurrencyAuditRecord | undefined,
): boolean {
  if (!auditRecord) return false;
  if (params.length < 4) return true;
  return params[1] === auditRecord.adminId
    && params[2] === auditRecord.reason
    && params[3] === auditRecord.payload;
}

function currencyCreationAuditResult(
  sql: string,
  params: unknown[],
  auditRecord: CurrencyAuditRecord | undefined,
) {
  if (!isCurrencyCreationAuditQuery(sql)) return undefined;
  return { results: matchesCurrencyCreationAudit(params, auditRecord) ? [auditRecord] : [] };
}

function selectCurrency(
  sql: string,
  params: unknown[],
  auditRecord: CurrencyAuditRecord | undefined,
) {
  const auditResult = currencyCreationAuditResult(sql, params, auditRecord);
  if (auditResult) return auditResult;
  if (sql.includes('FROM "Currency"') && sql.includes('WHERE "symbol"=?')) {
    return { results: [createdCurrency] };
  }
  return { results: [] };
}

function createCurrencyBridge() {
  let auditRecord: CurrencyAuditRecord | undefined;
  const bridge = {
    isEnabled: jest.fn().mockReturnValue(true),
    select: jest.fn().mockImplementation(async (sql: string, params: unknown[] = []) =>
      selectCurrency(sql, params, auditRecord),
    ),
    batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
      results: statements.map(() => ({ success: true, meta: { changes: 1 } })),
    })),
  } as unknown as D1WorkerBridgeService;
  return {
    bridge,
    recordAudit(command: { adminId: string; symbol: string }, details: Record<string, unknown>) {
      auditRecord = {
        adminId: command.adminId,
        target: command.symbol,
        reason: String(details.reason),
        payload: JSON.stringify(details.payload),
        details: JSON.stringify(details),
      };
    },
  };
}

function assertCurrencyCreationStatements(bridge: D1WorkerBridgeService, command: Record<string, unknown>) {
  const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
  expect(statements[0].sql).toContain('INSERT OR IGNORE INTO "Currency"');
  expect(statements[0].sql).not.toContain("MarketAssetCapability");
  expect(statements[1].sql).toContain('INSERT INTO "AdminAuditLog"');
  expect(statements[2].sql).toContain('INSERT OR IGNORE INTO "EventOutbox"');
  expect(statements[0].params).toContain(0);
  const details = JSON.parse(String(statements[1].params[3]));
  expect(details.reason).toBe(command.reason);
  expect(details.idempotencyKey).toBe(command.idempotencyKey);
  expect(statements[2].sql).toContain("changes()=1");
  return details;
}

describe("D1 Admin currency creation", () => {
  beforeEach(() => {
    process.env.D1_RUNTIME_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.D1_RUNTIME_ENABLED;
  });

  it("creates a disabled currency with idempotent Admin audit and outbox evidence", async () => {
    const { bridge, recordAudit } = createCurrencyBridge();
    const gateway = new D1FinancialCommandGateway(bridge);
    const command = {
      symbol: "BTC", name: "Bitcoin", rate: "1.0",
      minDeposit: "0.001", maxDeposit: "10",
      minWithdrawal: "0.001", maxWithdrawal: "10", withdrawalFee: "0.0001",
      confirmationCount: 3, decimals: 8, adminId: "admin-1",
      reason: "Configure the BTC wallet asset", idempotencyKey: "wallet-currency-btc-0001",
    };

    await expect((gateway as any).createAdminCurrency(command)).resolves.toMatchObject({
      id: 101, symbol: "BTC", depositEnabled: 0, withdrawEnabled: 0, isActive: 0,
    });
    const details = assertCurrencyCreationStatements(bridge, command);
    recordAudit(command, details);
    await expect((gateway as any).createAdminCurrency(command)).resolves.toMatchObject({ id: 101, symbol: "BTC" });
    await expect((gateway as any).createAdminCurrency({ ...command, name: "Different payload" }))
      .rejects.toThrow("Currency creation idempotency key was already used");
    expect(bridge.batch).toHaveBeenCalledTimes(1);
  });
});
