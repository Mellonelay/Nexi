import { Gate2SpotOrderType, OrderSide, Prisma } from '@prisma/client';
import { SpotService } from '../../src/spot/spot.service';

describe('Gate 2 Spot authority', () => {
  const pair = {
    id: 'pair-1', symbol: 'BTCUSDT', baseAssetId: 'asset-btc', quoteAssetId: 'asset-usdt', status: 'ACTIVE',
    baseAsset: { id: 'asset-btc', symbol: 'BTC', status: 'ACTIVE' },
    quoteAsset: { id: 'asset-usdt', symbol: 'USDT', status: 'ACTIVE' },
  };

  function createService(existing: unknown = null) {
    const order = {
      id: 'order-1', userId: 'user-1', pair: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT',
      side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, status: 'OPEN', amount: '2', filled: '0',
      remaining: '2', price: '100', stopPrice: null, reserveAsset: 'USDT', reservedAmount: '200.2',
      feeRate: '0.001', idempotencyKey: 'order-key-1', correlationId: 'order-key-1',
    };
    const tx = { gate2SpotOrder: { create: jest.fn().mockResolvedValue(order), findUnique: jest.fn().mockResolvedValue(null) } };
    const prisma = {
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) },
      marketAssetCapability: { findMany: jest.fn().mockResolvedValue([{ id: 'cap-1' }, { id: 'cap-2' }]) },
      systemConfig: { findUnique: jest.fn().mockResolvedValue(null) },
      gate2SpotOrder: { findUnique: jest.fn().mockResolvedValue(existing), findMany: jest.fn().mockResolvedValue([]) },
      gate2SpotTrade: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
      marketQuoteLatest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'quote-1',
          state: 'LIVE',
          price: new Prisma.Decimal('100'),
          receivedAt: new Date(),
        }),
      },
    };
    const ledger = {
      getAccountForUser: jest.fn().mockResolvedValue({ id: 'ledger-1', asset: 'USDT' }),
      reserve: jest.fn().mockResolvedValue({ postingId: 'posting-1' }),
    };
    const gateway = { emitOrderBookUpdate: jest.fn() };
    const market = {};
    const service = new SpotService(prisma as any, ledger as any, market as any, gateway as any);
    (service as any).matchOrders = jest.fn();
    (service as any).broadcastOrderBook = jest.fn();
    return { service, prisma, ledger, tx, order };
  }

  it('reserves quote value plus exact fee before accepting a buy order', async () => {
    const { service, ledger, tx } = createService();
    await service.placeOrder('user-1', {
      pair: 'BTC/USDT', side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT,
      amount: '2', price: '100', idempotencyKey: 'order-key-1',
    });
    expect(ledger.reserve).toHaveBeenCalledWith(expect.objectContaining({ asset: 'USDT', amount: '200.2' }), tx);
    const created = tx.gate2SpotOrder.create.mock.calls[0][0].data;
    expect(created.amount.toString()).toBe('2');
    expect(created.remaining.toString()).toBe('2');
    expect(created.reservedAmount.toString()).toBe('200.2');
  });

  it('reserves only base quantity for a sell because fee is charged from quote proceeds', async () => {
    const { service, ledger, tx } = createService();
    await service.placeOrder('user-1', {
      pair: 'BTC/USDT', side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT,
      amount: '2', price: '100', idempotencyKey: 'sell-order-1',
    });
    expect(ledger.reserve).toHaveBeenCalledWith(expect.objectContaining({ asset: 'BTC', amount: '2' }), tx);
  });

  it('replays a duplicate order command without a second reservation', async () => {
    const existing = { id: 'existing-order', status: 'OPEN' };
    const { service, ledger } = createService(existing);
    const result = await service.placeOrder('user-1', {
      pair: 'BTCUSDT', side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT,
      amount: '2', price: '100', idempotencyKey: 'order-key-1',
    });
    expect(result).toEqual({ ...existing, replayed: true });
    expect(ledger.reserve).not.toHaveBeenCalled();
  });

  it('rejects missing idempotency keys before any value mutation', async () => {
    const { service, ledger } = createService();
    await expect(service.placeOrder('user-1', {
      pair: 'BTCUSDT', side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT,
      amount: '2', price: '100', idempotencyKey: 'short',
    })).rejects.toThrow('Idempotency key is invalid');
    expect(ledger.reserve).not.toHaveBeenCalled();
  });

  it('returns market-wide recent trades for the canonical pair', async () => {
    const { service, prisma } = createService();
    const createdAt = new Date('2026-08-10T00:00:00.000Z');
    prisma.gate2SpotTrade.findMany.mockResolvedValue([{
      id: 'trade-1',
      pair: 'BTCUSDT',
      price: { toString: () => '30000' },
      amount: { toString: () => '0.25' },
      createdAt,
    }]);

    await expect(service.getMarketTrades('BTC/USDT')).resolves.toEqual([{
      id: 'trade-1',
      pair: 'BTCUSDT',
      price: '30000',
      amount: '0.25',
      executedAt: createdAt,
      side: 'MATCHED',
      source: 'nexi-internal-spot',
    }]);
    expect(prisma.gate2SpotTrade.findMany).toHaveBeenCalledWith({
      where: { pair: 'BTCUSDT' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
});
