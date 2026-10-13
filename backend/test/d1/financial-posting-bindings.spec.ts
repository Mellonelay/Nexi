import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import { D1BridgeBatchStatement, D1WorkerBridgeService } from "../../src/d1/d1-worker-bridge.service";

const account = { id: "account-1", userId: "user-1", asset: "USDT", scope: "MARGIN", status: "ACTIVE", available: "10", locked: "3" };
const withdrawal = { id: "withdrawal-1", userId: "user-1", asset: "USDT", amount: "3", reservedAmount: "3", state: "APPROVED" };
const position = { id: "position-1", userId: "user-1", accountId: "margin-account-1", status: "OPEN", collateral: "2", accountQuoteAsset: "USDT", debtAsset: "USDT", debtPrincipal: "1", interestAccrued: "0" };

function setup(changes: number[]) {
  let statements: D1BridgeBatchStatement[] = [];
  const bridge = {
    isEnabled: jest.fn(() => true),
    select: jest.fn(async (sql: string) => ({
      results: sql.includes("Gate2Withdrawal") ? [withdrawal]
        : sql.includes('"SpotMarginPositionEvent"') ? []
        : sql.includes('"SpotMarginPosition"') ? [position]
        : sql.includes("LedgerAccount") ? [account] : [],
    })),
    batch: jest.fn(async (input: D1BridgeBatchStatement[]) => {
      statements = input;
      return { results: input.map((_, index) => ({ success: true, meta: { changes: changes.includes(index) ? 1 : 0 } })) };
    }),
  } as unknown as D1WorkerBridgeService;
  process.env.D1_RUNTIME_ENABLED = "true";
  return { gateway: new D1FinancialCommandGateway(bridge), statements: () => statements };
}

afterEach(() => { delete process.env.D1_RUNTIME_ENABLED; });

function expectBindingsToMatch(sqlStatements: D1BridgeBatchStatement[]) {
  for (const statement of sqlStatements) {
    expect(statement.params).toHaveLength((statement.sql.match(/\?/g) ?? []).length);
  }
}

test("binds withdrawal settlement ledger fields in SQL placeholder order", async () => {
  const test = setup([1, 3, 6]);
  await test.gateway.settleWithdrawalAtomic("withdrawal-1", "receipt-1");
  const posting = test.statements().find(statement => statement.sql.includes("GATE2_WITHDRAWAL_SETTLEMENT"));
  expect(posting).toBeDefined();
  expectBindingsToMatch(test.statements());
  expect(posting?.params).toContain("-3");
});

test("projects Margin interest to canonical Activity and EventOutbox atomically", async () => {
  const test = setup([0, 4]);
  await test.gateway.accrueMarginInterest("position-1", "user-1", "0.25", "0.1", 3600, "interest-key");
  const statements = test.statements();
  const activity = statements.find(statement => statement.sql.includes('INSERT OR IGNORE INTO "Activity"'));
  const outbox = statements.find(statement => statement.sql.includes("EventOutbox"));
  expect(activity?.params).toContain("activity:margin:interest:position-1:interest-key");
  expect(activity?.params).toContain("margin:event:interest:interest-key");
  expect(activity?.sql).toContain('FROM "SpotMarginPositionEvent"');
  expect(outbox?.params).toContain("event:margin:interest:position-1:interest-key");
  expectBindingsToMatch(statements);
});

test("binds Margin close ledger fields in SQL placeholder order", async () => {
  const test = setup([1, 3, 4, 7, 10]);
  await test.gateway.settleMarginClose({
    positionId: "position-1", userId: "user-1", closeOrderId: "close-1", state: "CLOSED",
    markPrice: "1", realizedPnl: "0", repayment: "3", debtAsset: "USDT", activityId: "activity-1",
    idempotencyKey: "close-key", correlationId: "close-1",
  });
  const posting = test.statements().find(statement => statement.params.includes("SPOT_MARGIN_REPAYMENT"));
  expect(posting).toBeDefined();
  expectBindingsToMatch(test.statements());
  expect(posting?.params).toContain("SPOT_MARGIN_REPAYMENT");
  const activity = test.statements().find(statement => statement.sql.includes('INSERT OR IGNORE INTO "Activity"'));
  expect(activity?.params).toContain("activity:margin:settlement:position-1:close-key");
  expect(activity?.sql).toContain('FROM "LedgerPosting"');
  expectBindingsToMatch(test.statements());
});
