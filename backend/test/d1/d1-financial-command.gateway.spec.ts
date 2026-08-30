import { BadRequestException } from '@nestjs/common';
import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';
import { D1BridgeBatchStatement, D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';

describe('D1FinancialCommandGateway', () => {
  const account = {
    id: 'account-1',
    userId: 'user-1',
    asset: 'USDT',
    scope: 'MAIN',
    status: 'ACTIVE',
    available: '10.00',
    locked: '0.00',
  };

  const createBridge = (overrides: Partial<Record<string, jest.Mock>> = {}) => {
    const bridge = {
      isEnabled: jest.fn().mockReturnValue(true),
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('LedgerIdempotency')) return { results: [] };
        if (sql.includes('LedgerAccount')) return { results: [account] };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map((_, index) => ({ success: true, meta: { changes: index === 1 || index === 3 || index === 5 || index === 6 ? 1 : 0 } })),
      })),
      ...overrides,
    } as unknown as D1WorkerBridgeService;
    return bridge;
  };

  beforeEach(() => {
    process.env.D1_RUNTIME_ENABLED = 'true';
  });

  afterEach(() => {
    delete process.env.D1_RUNTIME_ENABLED;
  });

  it('uses exact decimal strings and an atomic D1 batch for credit', async () => {
    const bridge = createBridge();
    const gateway = new D1FinancialCommandGateway(bridge);

    const result = await gateway.credit({
      accountId: 'account-1',
      asset: 'usdt',
      amount: '0.10',
      referenceType: 'TEST',
      referenceId: 'credit-1',
      idempotencyKey: 'credit-key-1',
    });

    expect(result).toMatchObject({ accountId: 'account-1', available: '10', locked: '0', replayed: false });
    expect(bridge.batch).toHaveBeenCalledTimes(1);
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(7);
    expect(statements.some((statement) => statement.sql.includes('FOR UPDATE'))).toBe(false);
    expect(statements[3].params).toContain('0.1');
  });

  it('rejects insufficient funds before emitting a financial batch', async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('LedgerIdempotency')) return { results: [] };
        return { results: [{ ...account, available: '0.01' }] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(gateway.debit({
      accountId: 'account-1',
      asset: 'USDT',
      amount: '1',
      referenceType: 'TEST',
      referenceId: 'debit-1',
      idempotencyKey: 'debit-key-1',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(bridge.batch).not.toHaveBeenCalled();
  });

  it('returns a completed idempotent posting without issuing another batch', async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('LedgerIdempotency')) return { results: [{ operation: 'CREDIT', accountId: 'account-1', debitPostingId: 'posting-1', creditPostingId: null, id: 'idem-1' }] };
        return { results: [account] };
      }),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await expect(gateway.credit({
      accountId: 'account-1',
      asset: 'USDT',
      amount: '1',
      referenceType: 'TEST',
      referenceId: 'credit-1',
      idempotencyKey: 'credit-key-1',
    })).resolves.toMatchObject({ postingId: 'posting-1', replayed: true });
    expect(bridge.batch).not.toHaveBeenCalled();
  });

  it('keeps the internal transfer record and audit in the same D1 batch', async () => {
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('LedgerIdempotency')) return { results: [] };
        if (sql.includes('LedgerAccount')) return { results: [account, { ...account, id: 'account-2', userId: 'user-2' }] };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map((_, index) => ({ success: true, meta: { changes: [1, 3, 5, 6, 11].includes(index) ? 1 : 0 } })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    await gateway.pairedTransfer({
      debitAccountId: 'account-1',
      creditAccountId: 'account-2',
      asset: 'USDT',
      amount: '1.25',
      referenceType: 'TRANSFER',
      referenceId: 'transfer-1',
      idempotencyKey: 'transfer-key-1',
      internalTransfer: { transferId: 'transfer-1', fromUserId: 'user-1', toUserId: 'user-2' },
    });

    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(15);
    expect(statements[11].sql).toContain('Gate2InternalTransfer');
    expect(statements[12].sql).toContain('TRANSFER_PAIRED');
    expect(statements[13].sql).toContain('TRANSFER_RECEIVED');
    expect(statements[14].sql).toContain('EventOutbox');
  });

  it('reserves funds and creates a Spot order in the same D1 batch', async () => {
    let orderLookup = 0;
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('Gate2SpotOrder')) {
          orderLookup += 1;
          return { results: orderLookup > 1 ? [{ id: 'order-1', userId: 'user-1', status: 'OPEN' }] : [] };
        }
        if (sql.includes('LedgerIdempotency')) return { results: [] };
        if (sql.includes('LedgerAccount')) return { results: [account] };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map((_, index) => ({ success: true, meta: { changes: [1, 3, 7].includes(index) ? 1 : 0 } })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    const result = await gateway.reserveSpotOrder({
      userId: 'user-1', pair: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT',
      side: 'BUY', type: 'LIMIT', amount: '0.1', price: '100', stopPrice: null,
      reserveAsset: 'USDT', reserveScope: 'MAIN', reservedAmount: '9.01', feeRate: '0.001',
      idempotencyKey: 'spot-order-key-1', correlationId: 'spot-order-key-1',
    });

    expect(result).toEqual(expect.objectContaining({ id: 'order-1', status: 'OPEN' }));
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(9);
    expect(statements[1].sql).toContain('LedgerAccount');
    expect(statements[7].sql).toContain('Gate2SpotOrder');
    expect(statements[7].params).toContain('BTCUSDT');
    expect(statements[8].sql).toContain('EventOutbox');
  });

  it('matches crossing Spot orders with one atomic D1 batch and no PostgreSQL locking syntax', async () => {
    const buy = {
      id: 'buy-1', userId: 'buyer-1', pair: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT',
      side: 'BUY', status: 'OPEN', type: 'LIMIT', amount: '1', filled: '0', remaining: '1',
      price: '100', reservedAmount: '100.1', feeRate: '0.001', reserveAsset: 'USDT', reserveScope: 'MAIN',
      createdAt: '2026-08-27T00:00:00.000Z',
    };
    const sell = {
      id: 'sell-1', userId: 'seller-1', pair: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT',
      side: 'SELL', status: 'OPEN', type: 'LIMIT', amount: '1', filled: '0', remaining: '1',
      price: '99', reservedAmount: '1', feeRate: '0.001', reserveAsset: 'BTC', reserveScope: 'MAIN',
      createdAt: '2026-08-27T00:00:01.000Z',
    };
    const accounts = [
      { ...account, id: 'buyer-usdt', userId: 'buyer-1', asset: 'USDT', locked: '100.1' },
      { ...account, id: 'seller-btc', userId: 'seller-1', asset: 'BTC', available: '0', locked: '1' },
      { ...account, id: 'buyer-btc', userId: 'buyer-1', asset: 'BTC', available: '0' },
      { ...account, id: 'seller-usdt', userId: 'seller-1', asset: 'USDT', available: '0' },
    ];
    let tradeLookup = 0;
    const bridge = createBridge({
      select: jest.fn().mockImplementation(async (sql: string, params: unknown[] = []) => {
        if (sql.includes('Gate2SpotTrade')) {
          tradeLookup += 1;
          return tradeLookup === 1
            ? { results: [] }
            : { results: [{ id: 'trade-1', pair: 'BTCUSDT', amount: '1' }] };
        }
        if (sql.includes('FROM "Gate2SpotOrder"')) return { results: [buy, sell] };
        if (sql.includes('WHERE "userId" = ?')) {
          const user = String(params[0]);
          const asset = String(params[1]);
          return { results: accounts.filter((row) => row.userId === user && row.asset === asset).slice(0, 1) };
        }
        if (sql.includes('FROM "LedgerAccount"')) return { results: accounts };
        return { results: [] };
      }),
      batch: jest.fn().mockImplementation(async (statements: D1BridgeBatchStatement[]) => ({
        results: statements.map((_, index) => ({
          success: true,
          meta: { changes: ({ 2: 1, 4: 1, 6: 1, 8: 1, 10: 5, 11: 1, 12: 5, 13: 1, 14: 2, 15: 2 } as Record<number, number>)[index] ?? 0 },
        })),
      })),
    });
    const gateway = new D1FinancialCommandGateway(bridge);

    const result = await gateway.matchSpotOrder({ pair: 'BTCUSDT' });

    expect(result).toEqual(expect.objectContaining({ id: 'trade-1', pair: 'BTCUSDT', amount: '1' }));
    const statements = (bridge.batch as jest.Mock).mock.calls[0][0] as D1BridgeBatchStatement[];
    expect(statements).toHaveLength(16);
    expect(statements.every((statement) => !statement.sql.includes('FOR UPDATE'))).toBe(true);
    expect(statements[15].sql).toContain('Gate2SpotOrder');
  });
});
