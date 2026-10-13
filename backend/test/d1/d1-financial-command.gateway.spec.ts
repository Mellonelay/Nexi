import { BadRequestException } from "@nestjs/common";
import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import {
  D1BridgeBatchStatement,
  D1WorkerBridgeService,
} from "../../src/d1/d1-worker-bridge.service";

describe("D1FinancialCommandGateway", () => {
  const account = {
    id: "account-1",
    userId: "user-1",
    asset: "USDT",
    scope: "MAIN",
    status: "ACTIVE",
    available: "10.00",
    locked: "0.00",
  };

  const createBridge = (overrides: Partial<Record<string, jest.Mock>> = {}) => {
    const bridge = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount")) return { results: [account] };
        return { results: [] };
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
          results: statements.map((_, index) => ({
            success: true,
            meta: {
              changes:
                index === 1 || index === 3 || index === 5 || index === 6
                  ? 1
                  : 0,
            },
          })),
        })),
      ...overrides,
    } as unknown as D1WorkerBridgeService;
    return bridge;
  };

  beforeEach(() => {
    process.env.D1_RUNTIME_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.D1_RUNTIME_ENABLED;
  });

  describe("financial quote freshness", () => {
    const now = Date.parse("2026-10-08T01:00:00Z");
    let clock: jest.SpyInstance;
    let previousThreshold: string | undefined;

    beforeEach(() => {
      previousThreshold = process.env.NEXI_MARKET_STALE_AFTER_MS;
      process.env.NEXI_MARKET_STALE_AFTER_MS = "30000";
      clock = jest.spyOn(Date, "now").mockReturnValue(now);
    });

    afterEach(() => {
      clock.mockRestore();
      if (previousThreshold === undefined) delete process.env.NEXI_MARKET_STALE_AFTER_MS;
      else process.env.NEXI_MARKET_STALE_AFTER_MS = previousThreshold;
    });

    const quote = (observedAge: number, receivedAge: number) => ({
      id: "quote-1", pairId: "pair-1", symbol: "USDHKD",
      provider: "biquote", source: "biquote:signalr", sequence: "90440",
      price: "7.8", state: "LIVE",
      observedAt: new Date(now - observedAge).toISOString(),
      receivedAt: new Date(now - receivedAge).toISOString(),
    });

    it.each([
      [31000, 1000],
      [1000, 31000],
    ])("rejects stale evidence with observation age %i and receipt age %i", async (observedAge, receivedAge) => {
      const bridge = createBridge({ select: jest.fn().mockResolvedValue({ results: [quote(observedAge, receivedAge)] }) });
      const gateway = new D1FinancialCommandGateway(bridge);
      await expect(gateway.getLiveMarketQuote("pair-1")).resolves.toBeNull();
      expect(bridge.batch).not.toHaveBeenCalled();
    });

    it("returns fresh evidence with freshness measured from the older timestamp", async () => {
      const bridge = createBridge({ select: jest.fn().mockResolvedValue({ results: [quote(2000, 1000)] }) });
      const gateway = new D1FinancialCommandGateway(bridge);
      await expect(gateway.getLiveMarketQuote("pair-1")).resolves.toMatchObject({ freshnessMs: 2000, sequence: "90440" });
      expect(bridge.batch).not.toHaveBeenCalled();
    });
  });

  it("resolves a six-digit NEXI recipient code through D1 without loading a full user record", async () => {
    const bridge = createBridge({
      select: jest.fn().mockResolvedValue({
        results: [
          {
            id: "user-2",
            userCode: 123456,
            email: "recipient@example.test",
            displayName: "Recipient",
            role: "USER",
          },
        ],
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(gateway.getUserByUserCode(123456)).resolves.toMatchObject({
      id: "user-2",
      userCode: 123456,
    });
    expect(bridge.select).toHaveBeenCalledWith(
      expect.stringContaining('WHERE "userCode"=?'),
      [123456],
    );
  });

  it("uses exact decimal strings and an atomic D1 batch for credit", async () => {
    const bridge = createBridge();
    const gateway = new D1FinancialCommandGateway(bridge);

    const result = await gateway.credit({
      accountId: "account-1",
      asset: "usdt",
      amount: "0.10",
      referenceType: "TEST",
      referenceId: "credit-1",
      idempotencyKey: "credit-key-1",
    });

    expect(result).toMatchObject({
      accountId: "account-1",
      available: "10",
      locked: "0",
      replayed: false,
    });
    expect(bridge.batch).toHaveBeenCalledTimes(1);
    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(7);
    expect(statements[3].params).toContain("0.1");
  });

  it("rejects insufficient funds before emitting a financial batch", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        return { results: [{ ...account, available: "0.01" }] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.debit({
        accountId: "account-1",
        asset: "USDT",
        amount: "1",
        referenceType: "TEST",
        referenceId: "debit-1",
        idempotencyKey: "debit-key-1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(bridge.batch).not.toHaveBeenCalled();
  });

  it("returns a completed idempotent posting without issuing another batch", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency"))
          return {
            results: [
              {
                operation: "CREDIT",
                accountId: "account-1",
                debitPostingId: "posting-1",
                creditPostingId: null,
                id: "idem-1",
              },
            ],
          };
        return { results: [account] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.credit({
        accountId: "account-1",
        asset: "USDT",
        amount: "1",
        referenceType: "TEST",
        referenceId: "credit-1",
        idempotencyKey: "credit-key-1",
      }),
    ).resolves.toMatchObject({ postingId: "posting-1", replayed: true });
    expect(bridge.batch).not.toHaveBeenCalled();
  });

  it("guards withdrawal approval to the pending state and emits audit/outbox statements", async () => {
    const bridge = createBridge({
      batch: jest.fn().mockResolvedValue({
        results: [
          { meta: { changes: 1 } },
          { meta: { changes: 1 } },
          { meta: { changes: 1 } },
        ],
      }),
      select: jest.fn().mockResolvedValue({
        results: [{ id: "withdrawal-1", state: "APPROVED" }],
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(
      gateway.approveWithdrawal(
        "withdrawal-1",
        "ok",
        "admin-1",
        "approval-key-1",
      ),
    ).resolves.toMatchObject({ id: "withdrawal-1" });
    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[0].sql).toContain(`AND "state"='PENDING_REVIEW'`);
    expect(statements[1].sql).toContain("AdminAuditLog");
    expect(statements[2].sql).toContain("EventOutbox");
  });

  it("marks overdue loans and emits one idempotent outbox event per transition", async () => {
    const bridge = createBridge({
      select: jest.fn().mockResolvedValue({
        results: [
          { id: "loan-1", dueDate: "2026-08-01T00:00:00.000Z" },
          { id: "loan-2", dueDate: "2026-08-02T00:00:00.000Z" },
        ],
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
          results: statements.map((_, index) => ({
            success: true,
            meta: { changes: index % 2 === 0 ? 1 : 1 },
          })),
        })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.markOverdueLoans("2026-09-01T00:00:00.000Z"),
    ).resolves.toEqual({ count: 2 });

    expect(bridge.select).toHaveBeenCalledWith(
      expect.stringContaining('FROM "LoanApplication"'),
      ["2026-09-01T00:00:00.000Z"],
    );
    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(4);
    expect(statements[0].sql).toContain("SET \"status\"='OVERDUE'");
    expect(statements[1].sql).toContain("EventOutbox");
    expect(statements[1].sql).toContain(
      'WHERE EXISTS (SELECT 1 FROM "LoanApplication"',
    );
    expect(statements[1].params).toContain("LOAN_OVERDUE");
    expect(statements[3].params).toContain(
      "event:loan:overdue:loan-2:2026-08-02T00:00:00.000Z",
    );
  });

  it("creates a D1 loan application with a guarded submission outbox event", async () => {
    const bridge = createBridge({
      select: jest.fn().mockResolvedValue({
        results: [{ id: "loan-apply-1", userId: "user-1", status: "PENDING" }],
      }),
      batch: jest.fn().mockResolvedValue({
        results: [
          { success: true, meta: { changes: 1 } },
          { success: true, meta: { changes: 1 } },
        ],
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.applyLoan({
        id: "loan-apply-1",
        userId: "user-1",
        amount: "10",
        currency: "USDT",
        term: 30,
        durationDays: 30,
        interestRate: "0.1",
        totalRepayment: "11",
        productSnapshot: { currency: "USDT", durationDays: 30 },
      }),
    ).resolves.toMatchObject({ id: "loan-apply-1" });

    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(2);
    expect(statements[0].sql).toContain("LoanApplication");
    expect(statements[1].sql).toContain("EventOutbox");
    expect(statements[1].params).toContain("LOAN_APPLICATION_SUBMITTED");
  });

  it("posts a same-user Wallet transfer once with one Activity and one outbox event", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount")) return { results: [
          account,
          { ...account, id: "account-2", scope: "SPOT" },
        ] };
        return { results: [] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    const result = await gateway.pairedTransfer({
      debitAccountId: "account-1", creditAccountId: "account-2", asset: "USDT", amount: "1.25",
      referenceType: "WALLET_ACCOUNT_TRANSFER", referenceId: "wallet-transfer",
      idempotencyKey: "wallet-transfer-key", sameUserTransfer: { userId: "user-1", fromScope: "MAIN", toScope: "SPOT" },
    });
    expect(result.replayed).toBe(false);
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(12);
    expect(statements.filter((statement) => statement.sql.includes('INSERT OR IGNORE INTO "Activity"'))).toHaveLength(1);
    expect(JSON.parse(String(statements[10].params[10]))).toMatchObject({
      direction: "PAIRED_TRANSFER",
      sourceScope: "MAIN",
      destinationScope: "SPOT",
      sourceAccountId: "account-1",
      destinationAccountId: "account-2",
    });
    expect(statements[11].sql).toContain("EventOutbox");
  });

  it("replays an identical paired transfer and rejects an idempotency collision", async () => {
    let idempotencyLookups = 0;
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency")) {
          idempotencyLookups += 1;
          return idempotencyLookups === 1 ? { results: [] } : { results: [{
            id: "ledger-idem-1", operation: "PAIRED_TRANSFER", accountId: "account-1",
            debitPostingId: "debit-1", creditPostingId: "credit-1",
          }] };
        }
        if (sql.includes('FROM "LedgerPosting"')) return { results: [
          { id: "debit-1", accountId: "account-1", asset: "USDT", amount: "1.25", referenceType: "WALLET_ACCOUNT_TRANSFER", referenceId: "wallet-transfer" },
          { id: "credit-1", accountId: "account-2", asset: "USDT", amount: "1.25", referenceType: "WALLET_ACCOUNT_TRANSFER", referenceId: "wallet-transfer" },
        ] };
        if (sql.includes("LedgerAccount")) return { results: [
          account,
          { ...account, id: "account-2", scope: "SPOT" },
        ] };
        return { results: [] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    const command = {
      debitAccountId: "account-1", creditAccountId: "account-2", asset: "USDT", amount: "1.25",
      referenceType: "WALLET_ACCOUNT_TRANSFER", referenceId: "wallet-transfer",
      idempotencyKey: "wallet-transfer-key", sameUserTransfer: { userId: "user-1", fromScope: "MAIN", toScope: "SPOT" },
    };
    await gateway.pairedTransfer(command);
    expect((await gateway.pairedTransfer(command)).replayed).toBe(true);
    await expect(gateway.pairedTransfer({ ...command, amount: "1.5" })).rejects.toThrow("Idempotency key belongs to another financial transfer");
    expect(bridge.batch).toHaveBeenCalledTimes(1);
  });

  it("rejects a same-user transfer whose account owner or scope does not match", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount")) return { results: [
          account,
          { ...account, id: "account-2", scope: "SPOT" },
        ] };
        return { results: [] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.pairedTransfer({
      debitAccountId: "account-1", creditAccountId: "account-2", asset: "USDT", amount: "1",
      referenceType: "WALLET_ACCOUNT_TRANSFER", referenceId: "wallet-transfer",
      idempotencyKey: "wallet-transfer-key", sameUserTransfer: { userId: "user-2", fromScope: "MAIN", toScope: "SPOT" },
    })).rejects.toThrow("Wallet transfer account ownership or scope mismatch");
    expect(bridge.batch).not.toHaveBeenCalled();
  });

  it("rejects a same-user transfer when available funds are insufficient", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount")) return { results: [
          { ...account, available: "0.5", locked: "10" },
          { ...account, id: "account-2", scope: "SPOT" },
        ] };
        return { results: [] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.pairedTransfer({
      debitAccountId: "account-1", creditAccountId: "account-2", asset: "USDT", amount: "1",
      referenceType: "WALLET_ACCOUNT_TRANSFER", referenceId: "wallet-transfer",
      idempotencyKey: "wallet-transfer-key", sameUserTransfer: { userId: "user-1", fromScope: "MAIN", toScope: "SPOT" },
    })).rejects.toThrow("Insufficient available funds");
    expect(bridge.batch).not.toHaveBeenCalled();
  });

  it("keeps the internal transfer record and audit in the same D1 batch", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount"))
          return {
            results: [
              account,
              { ...account, id: "account-2", userId: "user-2" },
            ],
          };
        return { results: [] };
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
          results: statements.map((_, index) => ({
            success: true,
            meta: { changes: [1, 3, 5, 6, 11].includes(index) ? 1 : 0 },
          })),
        })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await gateway.pairedTransfer({
      debitAccountId: "account-1",
      creditAccountId: "account-2",
      asset: "USDT",
      amount: "1.25",
      referenceType: "TRANSFER",
      referenceId: "transfer-1",
      idempotencyKey: "transfer-key-1",
      internalTransfer: {
        transferId: "transfer-1",
        fromUserId: "user-1",
        toUserId: "user-2",
      },
    });

    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(16);
    expect(statements[11].sql).toContain("Gate2InternalTransfer");
    expect(statements[12].sql).toContain("TRANSFER_PAIRED");
    expect(statements[13].sql).toContain("TRANSFER_RECEIVED");
    expect(statements[14].sql).toContain("GATE2_INTERNAL_TRANSFER_RECEIVED");
    expect(statements[15].sql).toContain("EventOutbox");
  });

  it("reserves funds and creates a Spot order in the same D1 batch", async () => {
    let orderLookup = 0;
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("Gate2SpotOrder")) {
          orderLookup += 1;
          return {
            results:
              orderLookup > 1
                ? [{ id: "order-1", userId: "user-1", status: "OPEN" }]
                : [],
          };
        }
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount")) return { results: [account] };
        return { results: [] };
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
          results: statements.map((_, index) => ({
            success: true,
            meta: { changes: [1, 3, 7].includes(index) ? 1 : 0 },
          })),
        })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    const result = await gateway.reserveSpotOrder({
      userId: "user-1",
      pair: "BTCUSDT",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      side: "BUY",
      type: "LIMIT",
      amount: "0.1",
      price: "100",
      stopPrice: null,
      reserveAsset: "USDT",
      reserveScope: "MAIN",
      reservedAmount: "9.01",
      feeRate: "0.001",
      idempotencyKey: "spot-order-key-1",
      correlationId: "spot-order-key-1",
    });

    expect(result).toEqual(
      expect.objectContaining({ id: "order-1", status: "OPEN" }),
    );
    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(9);
    expect(statements[1].sql).toContain("LedgerAccount");
    expect(statements[7].sql).toContain("Gate2SpotOrder");
    expect(statements[7].params).toContain("BTCUSDT");
    expect(statements[8].sql).toContain("EventOutbox");
  });

  it("atomically borrows before reserving the margin entry order", async () => {
    let orderLookup = 0;
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("Gate2SpotOrder")) {
          orderLookup += 1;
          return { results: orderLookup > 1 ? [{ id: "order-1", status: "OPEN" }] : [] };
        }
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount")) return { results: [{ ...account, scope: "MARGIN", available: "25.00" }] };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map((_, index) => ({ success: true, meta: { changes: [1, 3, 8, 10, 14].includes(index) ? 1 : 0 } })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await gateway.reserveSpotOrder({
      userId: "user-1", pair: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT", side: "SELL", type: "LIMIT",
      amount: "1.25", price: "100", stopPrice: null, reserveAsset: "BTC", reserveScope: "MARGIN", reservedAmount: "1.25",
      feeRate: "0.001", idempotencyKey: "margin-entry-key-1", correlationId: "margin-entry-key-1",
      borrow: {
        accountId: "account-1", asset: "BTC", amount: "1.25", referenceType: "SPOT_MARGIN_BORROW", referenceId: "margin-open-1",
        idempotencyKey: "margin:borrow:margin-open-1", correlationId: "margin-open-1", economicGroup: "margin-account-1",
      },
    });

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(16);
    expect(statements[0].sql).toContain("LedgerIdempotency");
    expect(statements[3].sql).toContain("LedgerPosting");
    expect(statements[7].sql).toContain("LedgerIdempotency");
    expect(statements[14].sql).toContain("Gate2SpotOrder");
  });


  it("repays only an owned canceled and unfilled Margin borrow in one guarded ledger batch", async () => {
    const marginAccount = { ...account, scope: "MARGIN", available: "60", locked: "0" };
    const original = { id: "borrow-posting-1", accountId: "account-1", asset: "USDT", amount: "10", correlationId: "margin-open-old", economicGroup: "isolated-margin-1" };
    const order = { id: "entry-order-old", status: "CANCELED", filled: "0", reservedAmount: "0" };
    let recordedPosting = "";
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "LedgerPosting" p JOIN')) return { results: [original] };
        if (sql.includes('FROM "Gate2SpotOrder"')) return { results: [order] };
        if (sql.includes('FROM "LedgerIdempotency"')) return { results: recordedPosting ? [{ operation: "DEBIT", accountId: "account-1", debitPostingId: recordedPosting }] : [] };
        if (sql.includes('FROM "LedgerAccount"')) return { results: [marginAccount] };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => {
        recordedPosting = String(statements[3].params?.[0] ?? "");
        return { results: statements.map((_, index) => ({ success: true, meta: { changes: [1, 3, 7].includes(index) ? 1 : 0 } })) };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await gateway.repayUnmatchedMarginBorrow("user-1", "margin-open-old");
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(8);
    expect(statements[0].sql).toContain('NOT EXISTS (\n          SELECT 1 FROM "SpotMarginPosition"');
    expect(statements[0].sql).toContain('"Gate2SpotTrade"');
    expect(statements[0].sql).toContain('"SPOT_MARGIN_BORROW"'.replaceAll('"', "'"));
    expect(statements[3].params).toContain("SPOT_MARGIN_ORPHAN_REPAYMENT");
    expect(statements[7].sql).toContain('"EventOutbox"');
    await expect(gateway.repayUnmatchedMarginBorrow("user-1", "margin-open-old"))
      .resolves.toMatchObject({ replayed: true });
    expect(bridge.batch).toHaveBeenCalledTimes(1);
  });

  it("rejects repayment when a Margin entry was not fully canceled and released", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "LedgerPosting" p JOIN')) return { results: [{ id: "borrow-1", accountId: "account-1", asset: "USDT", amount: "10", correlationId: "original", economicGroup: null }] };
        if (sql.includes('FROM "Gate2SpotOrder"')) return { results: [{ id: "entry-1", status: "OPEN", filled: "0", reservedAmount: "10" }] };
        return { results: [] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.repayUnmatchedMarginBorrow("user-1", "margin-open-old"))
      .rejects.toThrow("Margin entry must be canceled");
    expect(bridge.batch).not.toHaveBeenCalled();
  });

  it("matches crossing Spot orders with one atomic D1 batch and no incompatible locking syntax", async () => {
    const buy = {
      id: "buy-1",
      userId: "buyer-1",
      pair: "BTCUSDT",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      side: "BUY",
      status: "OPEN",
      type: "LIMIT",
      amount: "1",
      filled: "0",
      remaining: "1",
      price: "100",
      reservedAmount: "100.1",
      feeRate: "0.001",
      reserveAsset: "USDT",
      reserveScope: "MAIN",
      createdAt: "2026-08-27T00:00:00.000Z",
    };
    const sell = {
      id: "sell-1",
      userId: "seller-1",
      pair: "BTCUSDT",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      side: "SELL",
      status: "OPEN",
      type: "LIMIT",
      amount: "1",
      filled: "0",
      remaining: "1",
      price: "99",
      reservedAmount: "1",
      feeRate: "0.001",
      reserveAsset: "BTC",
      reserveScope: "MAIN",
      createdAt: "2026-08-27T00:00:01.000Z",
    };
    const accounts = [
      {
        ...account,
        id: "buyer-usdt",
        userId: "buyer-1",
        asset: "USDT",
        locked: "100.1",
      },
      {
        ...account,
        id: "seller-btc",
        userId: "seller-1",
        asset: "BTC",
        available: "0",
        locked: "1",
      },
      {
        ...account,
        id: "buyer-btc",
        userId: "buyer-1",
        asset: "BTC",
        available: "0",
      },
      {
        ...account,
        id: "seller-usdt",
        userId: "seller-1",
        asset: "USDT",
        available: "0",
      },
    ];
    let tradeLookup = 0;
    const bridge = createBridge({
      select: jest
        .fn()
        .mockImplementation(async (sql: string, params: unknown[] = []) => {
          if (sql.includes("Gate2SpotTrade")) {
            tradeLookup += 1;
            return tradeLookup === 1
              ? { results: [] }
              : { results: [{ id: "trade-1", pair: "BTCUSDT", amount: "1" }] };
          }
          if (sql.includes('FROM "Gate2SpotOrder"'))
            return { results: [buy, sell] };
          if (sql.includes('WHERE "userId" = ?')) {
            const user = String(params[0]);
            const asset = String(params[1]);
            return {
              results: accounts
                .filter((row) => row.userId === user && row.asset === asset)
                .slice(0, 1),
            };
          }
          if (sql.includes('FROM "LedgerAccount"'))
            return { results: accounts };
          return { results: [] };
        }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
          results: statements.map((_, index) => ({
            success: true,
            meta: {
              changes:
                (
                  {
                    2: 1,
                    4: 1,
                    6: 1,
                    8: 1,
                    10: 5,
                    11: 1,
                    12: 5,
                    13: 1,
                    14: 2,
                    15: 2,
                  } as Record<number, number>
                )[index] ?? 0,
            },
          })),
        })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    const result = await gateway.matchSpotOrder({ pair: "BTCUSDT" });

    expect(result).toEqual(
      expect.objectContaining({ id: "trade-1", pair: "BTCUSDT", amount: "1" }),
    );
    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(16);
    expect(statements[15].sql).toContain("Gate2SpotOrder");
  });

  it("credits a deposit with ledger, guarded state, audit, and outbox in one batch", async () => {
    const deposit = {
      id: "deposit-atomic-1",
      userId: "user-1",
      asset: "USDT",
      amount: "2.50",
      confirmations: 12,
      requiredConfirmations: 6,
      state: "CONFIRMING",
      creditPostingId: null,
    };
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("Gate2Deposit")) return { results: [deposit] };
        if (sql.includes("LedgerAccount")) return { results: [account] };
        return { results: [] };
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
          results: statements.map((_, index) => ({
            success: true,
            meta: { changes: [1, 3, 6].includes(index) ? 1 : 0 },
          })),
        })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.creditDepositAtomic("deposit-atomic-1", "operator-confirmed"),
    ).resolves.toMatchObject({ id: "deposit-atomic-1" });

    expect(bridge.batch).toHaveBeenCalledTimes(1);
    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(11);
    expect(statements[1].sql).toContain('"available"=?');
    expect(statements[6].sql).toContain("SET \"state\"='CREDITED'");
    expect(statements[8].sql).toContain("Gate2OperationAudit");
    expect(statements[9].sql).toContain('INSERT OR IGNORE INTO "Activity"');
    expect(statements[9].params).toContain("deposit-atomic-1");
    expect(statements[10].sql).toContain("EventOutbox");
  });

  it("rejects a deposit atomically and publishes a replay-safe outbox event", async () => {
    const deposit = {
      id: "deposit-reject-1",
      userId: "user-1",
      asset: "USDT",
      amount: "2.50",
      confirmations: 1,
      requiredConfirmations: 6,
      state: "CONFIRMING",
      creditPostingId: null,
    };
    const bridge = createBridge({
      select: jest
        .fn()
        .mockImplementation(async (sql: string) =>
          sql.includes("Gate2Deposit")
            ? { results: [deposit] }
            : { results: [] },
        ),
      batch: jest.fn().mockResolvedValue({
        results: [
          { success: true, meta: { changes: 1 } },
          { success: true, meta: { changes: 0 } },
          { success: true, meta: { changes: 1 } },
          { success: true, meta: { changes: 1 } },
          { success: true, meta: { changes: 1 } },
        ],
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.rejectDepositAtomic(
        "deposit-reject-1",
        "invalid proof",
        "admin-1",
        "reject-key-1",
      ),
    ).resolves.toMatchObject({ id: "deposit-reject-1" });

    const statements = (bridge.batch as jest.Mock).mock
      .calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(5);
    expect(statements[0].sql).toContain("SET \"state\"='REJECTED'");
    expect(statements[2].sql).toContain("Gate2OperationAudit");
    expect(statements[4].sql).toContain("EventOutbox");
    expect(statements[4].params).toContain(
      "event:deposit:reject:deposit-reject-1",
    );
  });

  it("accepts only one concurrent withdrawal settlement and rejects a lost guarded transition", async () => {
    const withdrawal = {
      id: "withdrawal-concurrent-1",
      requestKey: "withdrawal-concurrent-1",
      userId: "user-1",
      asset: "USDT",
      amount: "3.00",
      reservedAmount: "3.00",
      state: "APPROVED",
    };
    let batches = 0;
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("Gate2Withdrawal")) return { results: [withdrawal] };
        if (sql.includes("LedgerAccount")) return { results: [account] };
        return { results: [] };
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => {
          batches += 1;
          const won = batches === 1;
          return {
            results: statements.map((_, index) => ({
              success: true,
              meta: { changes: won && [1, 3, 6].includes(index) ? 1 : 0 },
            })),
          };
        }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    const results = await Promise.allSettled([
      gateway.settleWithdrawalAtomic("withdrawal-concurrent-1", "tx-receipt-1"),
      gateway.settleWithdrawalAtomic("withdrawal-concurrent-1", "tx-receipt-2"),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(bridge.batch).toHaveBeenCalledTimes(2);
  });

  it("fails closed when a guarded settlement statement reports no account change", async () => {
    const withdrawal = {
      id: "withdrawal-partial-1",
      requestKey: "withdrawal-partial-1",
      userId: "user-1",
      asset: "USDT",
      amount: "3.00",
      reservedAmount: "3.00",
      state: "APPROVED",
    };
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("Gate2Withdrawal")) return { results: [withdrawal] };
        if (sql.includes("LedgerAccount"))
          return { results: [{ ...account, locked: "1.00" }] };
        return { results: [] };
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
          results: statements.map(() => ({
            success: true,
            meta: { changes: 0 },
          })),
        })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(
      gateway.settleWithdrawalAtomic("withdrawal-partial-1", "tx-receipt-fail"),
    ).rejects.toThrow("D1 withdrawal settlement account transition");
    expect(bridge.batch).toHaveBeenCalledTimes(1);
  });

  it("executes an approved Admin financial correction atomically with ledger, audit, activity and outbox statements", async () => {
    let batchStatements: D1BridgeBatchStatement[] = [];
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("AdminGovernanceCommand"))
          return {
            results: [
              {
                id: "gov-1",
                commandType: "FINANCIAL_CORRECTION",
                status: batchStatements.length ? "EXECUTED" : "APPROVED",
                requestedBy: "admin-requester",
              },
            ],
          };
        if (sql.includes("LedgerIdempotency")) return { results: [] };
        if (sql.includes("LedgerAccount")) return { results: [account] };
        return { results: [] };
      }),
      batch: jest
        .fn()
        .mockImplementation(async (statements: D1BridgeBatchStatement[]) => {
          batchStatements = statements;
          return {
            results: statements.map((_, index) => ({
              success: true,
              meta: { changes: [1, 3, 7].includes(index) ? 1 : 0 },
            })),
          };
        }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    const result = await gateway.applyAdminFinancialCorrection({
      governanceCommandId: "gov-1",
      userId: "user-1",
      asset: "USDT",
      amount: "2",
      direction: "CREDIT",
      idempotencyKey: "corr-1",
      reason: "reconcile",
      adminId: "admin-executor",
    });
    expect(result.replayed).toBe(false);
    const sql = batchStatements.map((statement) => statement.sql).join("\n");
    expect(sql).toContain('"LedgerPosting"');
    expect(sql).toContain('"Activity"');
    expect(sql).toContain('"AdminGovernanceCommand"');
    expect(sql).toContain('"AdminAuditLog"');
    expect(sql).toContain('"EventOutbox"');
  });

  it("updates canonical D1 currency controls with audit and outbox evidence", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "Currency" WHERE "id"=?')) {
          return { results: [{ id: 1, symbol: "USDT", minDeposit: 10, maxDeposit: 10000, depositEnabled: 1, withdrawEnabled: 1 }] };
        }
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map(() => ({ success: true, meta: { changes: 1 } })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(gateway.updateAdminCurrency({
      id: 1,
      patch: { minDeposit: 25, maxDeposit: 5000, depositEnabled: false },
      adminId: "admin-1",
      reason: "adjust wallet limits",
      idempotencyKey: "currency-config-12345678",
    })).resolves.toMatchObject({ id: 1, symbol: "USDT" });

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements.some((statement) => statement.sql.includes('UPDATE "Currency"'))).toBe(true);
    expect(statements.some((statement) => statement.sql.includes('INSERT OR IGNORE INTO "EventOutbox"'))).toBe(true);
    expect(statements.some((statement) => statement.sql.includes('INSERT INTO "AdminAuditLog"'))).toBe(true);
  });

  it("does not emit currency audit or outbox when the symbol already exists", async () => {
    const bridge = createBridge({
      batch: jest.fn().mockResolvedValue({
        results: [
          { success: true, meta: { changes: 0 } },
          { success: true, meta: { changes: 0 } },
          { success: true, meta: { changes: 0 } },
        ],
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect((gateway as any).createAdminCurrency({
      symbol: "BTC",
      name: "Bitcoin",
      adminId: "admin-1",
      reason: "Configure the BTC wallet asset",
      idempotencyKey: "wallet-currency-btc-conflict",
    })).rejects.toThrow("Currency symbol already exists");

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[1].sql).toContain("WHERE changes()=1");
    expect(statements[2].sql).toContain("changes()=1");
  });

  it("defaults new Wallet currencies to disabled with canonical configuration defaults", () => {
    const gateway = new D1FinancialCommandGateway(createBridge());
    expect((gateway as any).adminCurrencyPayload({
      symbol: " usdt ",
      name: " Tether ",
      adminId: "admin-1",
      reason: "Configure the Tether wallet asset",
      idempotencyKey: "wallet-currency-usdt-0001",
    })).toEqual({
      symbol: "USDT",
      name: "Tether",
      logo: null,
      rate: "1.0",
      minDeposit: "10.0",
      maxDeposit: "10000.0",
      minWithdrawal: "10.0",
      maxWithdrawal: "10000.0",
      withdrawalFee: "1.0",
      depositEnabled: false,
      withdrawEnabled: false,
      confirmationCount: 3,
      decimals: 18,
      isActive: false,
    });
  });



  it("creates and updates Mining plans through D1 with Admin audit and EventOutbox", async () => {
    const plan = { id: "plan-1", name: "Basic", currency: "USDT", lockupPeriod: 7, dailyYield: "0.02", dailyYieldDecimal: "0.02", minDeposit: "10", minDepositDecimal: "10", maxDeposit: "100", maxDepositDecimal: "100", isActive: 0 };
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "AdminAuditLog"')) return { results: [] };
        if (sql.includes('FROM "MiningPlan"')) return { results: [plan] };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map(() => ({ success: true, meta: { changes: 1 } })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    const command = { id: "plan-1", name: "Basic", currency: "USDT", lockupPeriod: 7, dailyYield: "0.02", minDeposit: "10", maxDeposit: "100", isActive: false, adminId: "admin-1", reason: "reviewed plan change", idempotencyKey: "mining-plan-key-01" };

    await expect(gateway.createMiningPlan(command)).resolves.toMatchObject({ id: "plan-1" });
    await expect(gateway.updateMiningPlan(command)).resolves.toMatchObject({ id: "plan-1" });

    const createStatements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    const updateStatements = (bridge.batch as jest.Mock).mock.calls[1][0] as D1BridgeBatchStatement[];
    for (const statements of [createStatements, updateStatements]) {
      expect(statements).toHaveLength(3);
      expect(statements[1].sql).toContain('INSERT INTO "AdminAuditLog"');
      expect(statements[2].sql).toContain('INSERT OR IGNORE INTO "EventOutbox"');
      expect(statements[2].sql).toContain("changes()=1");
      const audit = JSON.parse(String(statements[1].params[4]));
      expect(audit.reason).toBe(command.reason);
      expect(audit.idempotencyKey).toBe(command.idempotencyKey);
    }
    expect(createStatements[0].sql).toContain('INSERT OR IGNORE INTO "MiningPlan"');
    expect(updateStatements[0].sql).toContain('UPDATE "MiningPlan"');
    expect(createStatements[0].params).toContain(0);
    expect(updateStatements[0].params).toContain(0);
  });

  it("keeps inactive Mining plans visible to Admin without exposing them in the Public list", async () => {
    const bridge = createBridge({
      select: jest.fn().mockResolvedValue({ results: [{ id: "inactive-plan", isActive: 0 }] }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.listAdminMiningPlans()).resolves.toEqual([{ id: "inactive-plan", isActive: 0 }]);
    expect(bridge.select).toHaveBeenCalledWith(expect.not.stringContaining('WHERE "isActive"=1'));
  });

  it("renames a Binary duration through a versioned D1 config update with audit and outbox", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "Gate2BinaryConfiguration"') && sql.includes('ORDER BY "version" DESC')) {
          return { results: [{ id: "cfg-60", pair: "BTCUSDT", durationSeconds: 60, payoutRate: "0.85", lossRate: "0", minStake: "1", maxStake: "1000", settlementDelaySeconds: 0, version: 3, enabled: 1 }] };
        }
        if (sql.includes('SELECT "id" FROM "Gate2BinaryConfiguration"')) return { results: [] };
        if (sql.includes('WHERE "id"=?')) return { results: [{ id: "cfg-next", pair: "BTCUSDT", durationSeconds: 90, version: 4, enabled: 1 }] };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map(() => ({ success: true, meta: { changes: 1 } })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(gateway.updateBinaryConfiguration({
      pair: "BTCUSDT",
      sourceDurationSeconds: 60,
      durationSeconds: 90,
      payoutRate: 0.88,
      minStake: 5,
      maxStake: 500,
      enabled: true,
      adminId: "admin-1",
      reason: "edit option box",
      idempotencyKey: "binary-config-12345678",
    })).resolves.toMatchObject({ durationSeconds: 90, version: 4 });

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[0].sql).toContain('UPDATE "Gate2BinaryConfiguration"');
    expect(statements[1].sql).toContain('INSERT INTO "Gate2BinaryConfiguration"');
    expect(statements.some((statement) => statement.sql.includes('AdminAuditLog'))).toBe(true);
    expect(statements.some((statement) => statement.sql.includes('EventOutbox'))).toBe(true);
  });

  it("keeps Wallet funding capability independent from market capabilities", async () => {
    const bridge = createBridge({
      select: jest.fn().mockResolvedValue({ results: [{ id: "wallet-network-1" }] }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.hasAssetCapability("USDT", "TRC20", "deposit")).resolves.toBe(true);
    const [sql, params] = (bridge.select as jest.Mock).mock.calls[0];
    expect(sql).toContain('FROM "Currency"');
    expect(sql).toContain('JOIN "WalletNetwork"');
    expect(sql).not.toContain("MarketAsset");
    expect(params).toEqual(["USDT", "TRC20"]);
  });

  it("creates Wallet networks disabled with atomic Admin audit and outbox", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "AdminAuditLog"')) return { results: [] };
        if (sql.includes('FROM "Currency"')) return { results: [{ id: 3 }] };
        if (sql.includes('FROM "WalletNetwork"')) return { results: [{ id: "network-1", code: "BASE", isActive: 0 }] };
        return { results: [] };
      }),
      batch: jest.fn().mockResolvedValue({ results: [0, 1, 2].map(() => ({ success: true, meta: { changes: 1 } })) }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.createAdminWalletNetwork({
      currencyId: 3, code: "base", name: "Base", adminId: "admin-1",
      reason: "Configure Base wallet network", idempotencyKey: "wallet-net-base-0001",
    })).resolves.toMatchObject({ id: "network-1", code: "BASE", isActive: 0 });
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[0].sql).toContain('INSERT OR IGNORE INTO "WalletNetwork"');
    expect(statements[0].sql).toContain('VALUES (?,?,?,?,0,0,0');
    expect(statements[1].sql).toContain('AdminAuditLog');
    expect(statements[2].sql).toContain('EventOutbox');
  });

  it("binds new deposit addresses to configured Wallet networks and keeps them inactive", async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "DepositAddress" d JOIN "AdminAuditLog"')) return { results: [] };
        if (sql.includes('FROM "Currency"')) return { results: [{ id: 3, symbol: "ETH" }] };
        if (sql.includes('FROM "WalletNetwork"')) return { results: [{ id: "wallet-net-base", code: "BASE" }] };
        if (sql.includes('FROM "DepositAddress" WHERE "id"=?')) return { results: [{ id: "address-1", walletNetworkId: "wallet-net-base", isActive: 0 }] };
        return { results: [] };
      }),
      batch: jest.fn().mockResolvedValue({ results: [0, 1, 2].map(() => ({ success: true, meta: { changes: 1 } })) }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.createAdminDepositAddress({ currencyId: 3, network: "base", address: "0x12345678", adminId: "admin-1", reason: "Configure deposit address", idempotencyKey: "wallet-address-base-01" })).resolves.toMatchObject({ walletNetworkId: "wallet-net-base", isActive: 0 });
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[0].sql).toContain('"walletNetworkId"');
    expect(statements[0].sql).toContain('VALUES (?,?,?,?,?,?,0');
    expect(statements[1].sql).toContain('AdminAuditLog');
    expect(statements[2].sql).toContain('EventOutbox');
  });

  it("serves deposit destinations only through active Wallet asset, network, and address authority", async () => {
    const bridge = createBridge();
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.listDepositDestinations()).resolves.toEqual([]);
    const [sql] = (bridge.select as jest.Mock).mock.calls[0];
    expect(sql).toContain('JOIN "WalletNetwork"');
    expect(sql).toContain('w."isActive"=1');
    expect(sql).toContain('w."depositEnabled"=1');
    expect(sql).not.toContain("MarketNetwork");
  });

  it("updates Wallet network controls with replay-safe audit and outbox", async () => {
    const network = { id: "wallet-net-1", isActive: 0, depositEnabled: 0, withdrawEnabled: 0 };
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM "AdminAuditLog"')) return { results: [] };
        if (sql.includes('FROM "WalletNetwork"')) return { results: [network] };
        return { results: [] };
      }),
      batch: jest.fn().mockResolvedValue({ results: [0, 1, 2].map(() => ({ success: true, meta: { changes: 1 } })) }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    await expect(gateway.updateAdminWalletNetwork({
      id: "wallet-net-1", patch: { isActive: true, depositEnabled: true }, adminId: "admin-1",
      reason: "Enable deposits", idempotencyKey: "wallet-net-enable-01",
    })).resolves.toMatchObject({ id: "wallet-net-1" });
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[0].sql).toContain('UPDATE "WalletNetwork"');
    expect(statements[0].params).toEqual([1, 1, "wallet-net-1"]);
    expect(statements[1].sql).toContain('AdminAuditLog');
    expect(statements[2].sql).toContain('EventOutbox');
  });

  it("includes the loan identity in the committed approval event for workflow dispatch", async () => {
    const loan = {
      id: "loan-42",
      userId: "user-1",
      currency: "USDT",
      amountDecimal: "5",
      durationDays: 30,
      status: "PENDING",
    };
    const bridge = createBridge({
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map((_, index) => ({
          success: true,
          meta: { changes: [0, 1, 3, 7].includes(index) ? 1 : 0 },
        })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);
    jest.spyOn(gateway, "getLoanApplication").mockResolvedValueOnce(loan).mockResolvedValueOnce({
      ...loan,
      status: "ACTIVE",
      dueDate: "2026-11-07T00:00:00.000Z",
    });
    jest.spyOn(gateway as any, "getAccountForUser").mockResolvedValue(account);
    jest.spyOn(gateway as any, "findAccount").mockResolvedValue(account);

    await gateway.approveLoan({
      loanId: loan.id,
      idempotencyKey: "approve-42",
      adminId: "admin-1",
      reason: "Approved after review",
    });

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    const approvalEvent = statements.at(-1)!;
    expect(approvalEvent.sql).toContain('INSERT OR IGNORE INTO "EventOutbox"');
    expect(approvalEvent.params).toContain(
      JSON.stringify({ loanId: loan.id, adminId: "admin-1", reason: "Approved after review" }),
    );
  });

  it("binds every KYC decision batch statement and timestamps governance commands in D1", async () => {
    const bridge = createBridge({
      select: jest.fn().mockResolvedValue({
        results: [{ id: "kyc-1", userId: "user-1", status: "PENDING" }],
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await gateway.decideKyc({
      id: "kyc-1",
      decision: "APPROVED",
      reason: "Controlled test review",
      adminId: "admin-1",
      idempotencyKey: "kyc-decision-1",
    });

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    for (const statement of statements) {
      expect(statement.params).toHaveLength((statement.sql.match(/\?/g) ?? []).length);
    }
    expect(statements[0].sql).toContain("'EXECUTED',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP");
  });

  it("uses a deterministic UTC-day mining reward idempotency key", async () => {
    const bridge = createBridge();
    const gateway = new D1FinancialCommandGateway(bridge);
    const today = new Date().toISOString().slice(0, 10);
    const subscription = {
      id: "subscription-1",
      userId: "user-1",
      status: "ACTIVE",
      planCurrency: "USDT",
      amountDecimal: "10",
      planDailyYieldDecimal: "0.01",
      totalRewards: "0",
      totalRewardsDecimal: "0",
      lastRewardPaid: null,
    };
    jest.spyOn(gateway, "getMiningSubscription")
      .mockResolvedValueOnce(subscription)
      .mockResolvedValueOnce({ ...subscription, lastRewardPaid: today });
    jest.spyOn(gateway as any, "getAccountForUser").mockResolvedValue(account);
    jest.spyOn(gateway as any, "findAccount").mockResolvedValue(account);

    await gateway.accrueMiningReward("subscription-1");
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[0].params).toContain(`mining-reward:subscription-1:${today}`);
    expect(bridge.batch).toHaveBeenCalledTimes(1);
  });

  it("enforces F7 deposit amount limits with exact decimals", () => {
    const gateway = new D1FinancialCommandGateway(createBridge());
    expect(() => (gateway as any).validateDepositClaimAmount("10", "10", "100")).not.toThrow();
    expect(() => (gateway as any).validateDepositClaimAmount("9.999", "10", "100")).toThrow("outside configured limits");
    expect(() => (gateway as any).validateDepositClaimAmount("not-a-number", "10", "100")).toThrow("Deposit amount is invalid");
  });

  it("guards KYC resubmission atomically and only emits after the row changes", async () => {
    const bridge = createBridge({
      batch: jest.fn().mockResolvedValue({
        results: [{ meta: { changes: 0 } }, { meta: { changes: 0 } }],
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(gateway.submitKyc({
      userId: "user-1",
      firstName: "Ada",
      lastName: "Lovelace",
      dob: "1815-12-10",
      country: "GB",
      documentType: "PASSPORT",
      documentUrl: "",
      idFront: "kyc-evidence/user-1/front",
      idBack: null,
    })).rejects.toThrow("D1 KYC submission did not apply exactly once");

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements[0].sql).toContain(`WHERE "status" NOT IN ('APPROVED','PENDING')`);
    expect(statements[1].sql).toContain("SELECT");
    expect(statements[1].sql).toContain("changes()=1");
  });

  it("keeps private KYC object keys and legacy document URLs out of Admin list responses", async () => {
    const bridge = createBridge();
    const gateway = new D1FinancialCommandGateway(bridge);
    await gateway.listKycReviews();
    const [sql] = (bridge.select as jest.Mock).mock.calls.at(-1) as [string, unknown[]];
    expect(sql).toContain('k."id"');
    expect(sql).toContain('k."status"');
    expect(sql).not.toContain('"documentUrl"');
    expect(sql).not.toContain('"idFront"');
    expect(sql).not.toContain('"idBack"');
    expect(sql).not.toContain('"email"');
  });

});
