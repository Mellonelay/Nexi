import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import {
  D1BridgeBatchStatement,
  D1WorkerBridgeService,
} from "../../src/d1/d1-worker-bridge.service";

const quote: { id: string; userId: string; fromAsset: string; toAsset: string; state: string } = {
  id: "quote-1",
  userId: "user-1",
  fromAsset: "USDT",
  toAsset: "BTC",
  state: "OPEN",
};

const accounts = {
  USDT: {
    id: "account-usdt",
    userId: "user-1",
    asset: "USDT",
    scope: "MAIN",
    status: "ACTIVE",
    available: "10",
    locked: "0",
  },
  BTC: {
    id: "account-btc",
    userId: "user-1",
    asset: "BTC",
    scope: "MAIN",
    status: "ACTIVE",
    available: "0",
    locked: "0",
  },
};

function accountForQuery(sql: string, params: unknown[]) {
  const asset = sql.includes('WHERE "userId"')
    ? params[1]
    : Object.values(accounts).find((account) => account.id === params[0])
        ?.asset;
  return accounts[String(asset) as keyof typeof accounts];
}

function createBridgeFixture() {
  quote.state = "OPEN";
  const statements: D1BridgeBatchStatement[] = [];
  const bridge = {
    isEnabled: jest.fn().mockReturnValue(true),
    select: jest.fn().mockImplementation(async (sql: string, params: unknown[]) => {
      if (sql.includes('"Gate2ConversionQuote"'))
        return { results: [quote] };
      if (sql.includes('"LedgerAccount"')) {
        const account = accountForQuery(sql, params);
        return { results: account ? [account] : [] };
      }
      return { results: [] };
    }),
    batch: jest.fn().mockImplementation(async (batch: D1BridgeBatchStatement[]) => {
      statements.push(...batch);
      quote.state = "ACCEPTED";
      return {
        results: batch.map((_, index) => ({
          success: true,
          meta: { changes: [2, 4, 6, 7, 8, 9, 13, 15].includes(index) ? 1 : 0 },
        })),
      };
    }),
  } as unknown as D1WorkerBridgeService;
  return { bridge, statements };
}

describe("conversion acceptance D1 batch", () => {
  beforeEach(() => {
    process.env.D1_RUNTIME_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.D1_RUNTIME_ENABLED;
  });

  it("keeps audit and outbox writes within the 16-statement cap", async () => {
    const { bridge, statements } = createBridgeFixture();
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.acceptConversion({
        quoteId: "quote-1",
        userId: "user-1",
        acceptanceKey: "acceptance-1",
        fromAsset: "USDT",
        toAsset: "BTC",
        inputAmount: "1",
        outputAmount: "0.00001",
      }),
    ).resolves.toMatchObject({ state: "ACCEPTED" });

    expect(statements).toHaveLength(16);
    // Conversion charges zero fees: debit only the input amount and credit
    // only the quoted output amount, with no third fee posting.
    expect(statements[2].params?.[0]).toBe("9");
    expect(statements[4].params?.[0]).toBe("0.00001");
    expect(statements.find((statement) => statement.sql.includes('UPDATE "Gate2ConversionQuote"'))?.sql).toContain('julianday("expiresAt")>julianday(\'now\')');
    const conversionPostings = statements.filter((statement) =>
      statement.sql.includes('INSERT INTO "LedgerPosting"'),
    );
    expect(conversionPostings).toHaveLength(2);
    expect(conversionPostings.map((statement) => statement.sql)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("'GATE2_CONVERSION_DEBIT'"),
        expect.stringContaining("'GATE2_CONVERSION_CREDIT'"),
      ]),
    );
    for (const statement of statements) {
      expect(statement.params ?? []).toHaveLength(statement.sql.match(/\?/g)?.length ?? 0);
    }
    const audit = statements.find((statement) =>
      statement.sql.includes('INSERT INTO "LedgerAuditEvent"'),
    );
    expect(audit?.sql).toContain("UNION ALL");
    expect(audit?.sql).toContain("CONVERSION_DEBIT_POSTED");
    expect(audit?.sql).toContain("CONVERSION_CREDIT_POSTED");
    expect(
      statements.some((statement) => statement.sql.includes('"EventOutbox"')),
    ).toBe(true);
  });
});
