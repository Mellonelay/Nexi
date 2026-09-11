import { Gate2SpotOrderType, LedgerAccountScope, OrderSide, Prisma } from '@prisma/client';
import { SpotService } from '../../src/spot/spot.service';

describe('Gate 2 Spot authority', () => {
  const pair = { id: 'pair-1', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' };

  function createService(existing: any = null) {
    const order = { id: 'order-1', userId: 'user-1', pair: 'BTCUSDT', status: 'OPEN', amount: '2', filled: '0', price: '100' };
    const d1: any = {
      getActiveMarketPair: jest.fn().mockResolvedValue(pair),
      getSystemConfigValue: jest.fn().mockResolvedValue(null),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ id: 'quote-1', state: 'LIVE', price: '100', receivedAt: new Date(), observedAt: new Date(), provider: 'deterministic-test', source: 'fixture', sequence: '1' }),
      reserveSpotOrder: jest.fn().mockResolvedValue(order),
      matchSpotOrder: jest.fn().mockResolvedValue(false),
      getSpotOrder: jest.fn().mockResolvedValue(existing ?? order),
      cancelSpotOrder: jest.fn().mockResolvedValue({ ...order, status: 'CANCELED' }),
      getSpotOrderBook: jest.fn().mockResolvedValue({}),
      listSpotTradesForPair: jest.fn().mockResolvedValue([]),
    };
    const spotGateway = { emitOrderBookUpdate: jest.fn() };
    return { service: new SpotService(d1, spotGateway as any), d1, spotGateway, order };
  }

  it('sends exact buy reserve terms to the D1 command boundary', async () => {
    const { service, d1 } = createService();
    await service.placeOrder('user-1', { pair: 'BTC/USDT', side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: '2', price: '100', idempotencyKey: 'order-key-1' });
    expect(d1.reserveSpotOrder).toHaveBeenCalledWith(expect.objectContaining({
      pair: 'BTCUSDT', side: OrderSide.BUY, amount: '2', price: '100', reserveAsset: 'USDT', reserveScope: LedgerAccountScope.MAIN, reservedAmount: '200.2', feeRate: '0.001',
    }));
  });

  it('reserves only base quantity for a sell because fee is charged from quote proceeds', async () => {
    const { service, d1 } = createService();
    await service.placeOrder('user-1', { pair: 'BTC/USDT', side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '2', price: '100', idempotencyKey: 'sell-order-1' });
    expect(d1.reserveSpotOrder).toHaveBeenCalledWith(expect.objectContaining({ side: OrderSide.SELL, reserveAsset: 'BTC', reservedAmount: '2', reserveScope: LedgerAccountScope.MAIN }));
  });

  it('returns the D1 idempotent order read-back', async () => {
    const existing = { id: 'existing-order', status: 'OPEN' };
    const { service, d1 } = createService(existing);
    await expect(service.placeOrder('user-1', { pair: 'BTCUSDT', side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: '2', price: '100', idempotencyKey: 'order-key-1' })).resolves.toBe(existing);
    expect(d1.reserveSpotOrder).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid idempotency before reaching D1', async () => {
    const { service, d1 } = createService();
    await expect(service.placeOrder('user-1', { pair: 'BTCUSDT', side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: '2', price: '100', idempotencyKey: 'short' })).rejects.toThrow('Idempotency key is invalid');
    expect(d1.reserveSpotOrder).not.toHaveBeenCalled();
  });

  it('uses backend market protection and the D1 matching command', async () => {
    const { service, d1 } = createService();
    d1.getSystemConfigValue.mockImplementation(async (key: string) => key === 'gate2.spot.marketProtectionRate' ? '0.01' : null);
    await service.placeOrder('user-1', { pair: 'BTC/USDT', side: OrderSide.BUY, type: Gate2SpotOrderType.MARKET, amount: '1', idempotencyKey: 'market-key-1' });
    expect(d1.reserveSpotOrder).toHaveBeenCalledWith(expect.objectContaining({ price: '101', reservedAmount: '101.101' }));
    expect(d1.matchSpotOrder).toHaveBeenCalledWith({ pair: 'BTCUSDT' });
  });

  it('returns market-wide recent trades from the D1 read surface', async () => {
    const { service, d1 } = createService();
    const createdAt = new Date('2026-08-10T00:00:00.000Z');
    d1.listSpotTradesForPair.mockResolvedValue([{ id: 'trade-1', pair: 'BTCUSDT', price: new Prisma.Decimal('30000'), amount: new Prisma.Decimal('0.25'), createdAt }]);
    await expect(service.getMarketTrades('BTC/USDT')).resolves.toEqual([{ id: 'trade-1', pair: 'BTCUSDT', price: '30000', amount: '0.25', executedAt: createdAt, side: 'MATCHED', source: 'nexi-internal-spot' }]);
    expect(d1.listSpotTradesForPair).toHaveBeenCalledWith('BTC/USDT');
  });
});
