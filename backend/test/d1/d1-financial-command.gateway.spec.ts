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
    expect(statements).toHaveLength(15);
    expect(statements[11].sql).toContain("Gate2InternalTransfer");
    expect(statements[12].sql).toContain("TRANSFER_PAIRED");
    expect(statements[13].sql).toContain("TRANSFER_RECEIVED");
    expect(statements[14].sql).toContain("EventOutbox");
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
    expect(statements).toHaveLength(10);
    expect(statements[1].sql).toContain('"available"=?');
    expect(statements[6].sql).toContain("SET \"state\"='CREDITED'");
    expect(statements[8].sql).toContain("Gate2OperationAudit");
    expect(statements[9].sql).toContain("EventOutbox");
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

});
