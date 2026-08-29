import { BinarySide, Gate2BinaryState, Gate2SpotOrderStatus, Gate2SpotOrderType, MarketQuoteState, OrderSide, Prisma } from '@prisma/client';
import { BinaryService } from '../../src/binary/binary.service';
import { SpotService } from '../../src/spot/spot.service';

describe('Gate 2 correction semantics', () => {
  const pair = {
    id: 'pair-1', symbol: 'BTCUSDT', baseAssetId: 'btc', quoteAssetId: 'usdt', status: 'ACTIVE',
    baseAsset: { id: 'btc', symbol: 'BTC', status: 'ACTIVE' },
    quoteAsset: { id: 'usdt', symbol: 'USDT', status: 'ACTIVE' },
  };

  function createSpot() {
    const tx = {
      gate2SpotOrder: {
        create: jest.fn().mockResolvedValue({ id: 'market-1', userId: 'user-1', pair: 'BTCUSDT', type: Gate2SpotOrderType.MARKET, status: Gate2SpotOrderStatus.OPEN }),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const prisma = {
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) },
      marketAssetCapability: { findMany: jest.fn().mockResolvedValue([{ id: 'cap-btc' }, { id: 'cap-usdt' }]) },
      marketQuoteLatest: { findUnique: jest.fn().mockResolvedValue({ id: 'quote-1', price: new Prisma.Decimal('100'), state: MarketQuoteState.LIVE, receivedAt: new Date(), observedAt: new Date(), sequence: 10n, provider: 'b2', source: 'quote-feed' }) },
      systemConfig: { findUnique: jest.fn().mockImplementation(({ where }: any) => where.key === 'gate2.spot.marketProtectionRate' ? { value: '0.01' } : { value: '0.001' }) },
      gate2SpotOrder: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback: (client: any) => unknown) => callback(tx)),
    };
    const ledger: any = { getAccountForUser: jest.fn().mockResolvedValue({ id: 'ledger-1' }), reserve: jest.fn().mockResolvedValue({ postingId: 'reserve-1' }), release: jest.fn().mockResolvedValue({ postingId: 'release-1' }) };
    const service = new SpotService(prisma as any, ledger as any, {} as never, { emitOrderBookUpdate: jest.fn() } as never);
    return { service, prisma, ledger, tx };
  }

  it.each([
    ['below', '99', false],
    ['exact boundary', '100', true],
    ['above', '101', true],
  ])('STOP trigger is deterministic at the %s boundary', async (_label, price, shouldTrigger) => {
    const { service } = createSpot();
    const update = jest.fn();
    const stop = { id: 'stop-1', side: OrderSide.BUY, stopPrice: new Prisma.Decimal('100') };
    const tx = { gate2SpotOrder: { findMany: jest.fn().mockResolvedValue([stop]), update } };
    await (service as any).triggerStops(tx, 'BTCUSDT', {
      id: 'quote-2', price: new Prisma.Decimal(price), state: MarketQuoteState.LIVE,
      provider: 'b2', source: 'quote-feed', observedAt: new Date(), receivedAt: new Date(), sequence: 11n,
    });
    expect(update).toHaveBeenCalledTimes(shouldTrigger ? 1 : 0);
    if (shouldTrigger) expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'stop-1' }, data: expect.objectContaining({ triggerQuoteId: 'quote-2', triggerSequence: 11n }) }));
  });

  it('uses a backend protection cap for MARKET and always invokes atomic remainder cleanup', async () => {
    const { service, ledger, tx } = createSpot();
    jest.spyOn(service as any, 'matchOrders').mockResolvedValue(undefined);
    const cleanup = jest.spyOn(service as any, 'cancelMarketRemainder').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'broadcastOrderBook').mockResolvedValue(undefined);
    await service.placeOrder('user-1', { pair: 'BTC/USDT', side: OrderSide.BUY, type: Gate2SpotOrderType.MARKET, amount: '1', idempotencyKey: 'market-key-1' });
    const created = tx.gate2SpotOrder.create.mock.calls[0][0].data;
    expect(created.price.toString()).toBe('101');
    expect(ledger.reserve).toHaveBeenCalledWith(expect.objectContaining({ amount: '101.101' }), tx);
    expect(cleanup).toHaveBeenCalledWith('market-1');
  });

  it('atomically releases an unfilled MARKET reserve and closes the remainder', async () => {
    const { service, ledger } = createSpot();
    const order = { id: 'market-1', userId: 'user-1', type: Gate2SpotOrderType.MARKET, status: Gate2SpotOrderStatus.PARTIALLY_FILLED, reserveAsset: 'USDT', reservedAmount: new Prisma.Decimal('5'), correlationId: 'market-key-1' };
    const update = jest.fn().mockResolvedValue({ ...order, status: Gate2SpotOrderStatus.CANCELED, reservedAmount: new Prisma.Decimal(0) });
    const tx = { gate2SpotOrder: { findUnique: jest.fn().mockResolvedValue(order), update } };
    (service as any).prisma.$transaction = jest.fn(async (callback: (client: any) => unknown) => callback(tx));
    await (service as any).cancelMarketRemainder('market-1');
    expect(ledger.release).toHaveBeenCalledWith(expect.objectContaining({ amount: '5', idempotencyKey: 'gate2:spot:market-remainder:market-1' }), tx);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: Gate2SpotOrderStatus.CANCELED, reservedAmount: new Prisma.Decimal(0) } }));
  });

  function createBinarySettlement(positionState: Gate2BinaryState = Gate2BinaryState.ACTIVE, config: any = { payoutRate: new Prisma.Decimal('0.8'), lossRate: new Prisma.Decimal('0'), enabled: false }) {
    const expiresAt = new Date(Date.now() - 1000);
    const position: any = {
      id: 'position-1', userId: 'user-1', pair: 'BTCUSDT', side: BinarySide.CALL, stake: new Prisma.Decimal('10'), entryPrice: new Prisma.Decimal('100'),
      durationSeconds: 30, expiresAt, state: positionState, entrySequence: 4n, configurationVersion: 7,
    };
    const quote = { id: 'quote-expiry', price: new Prisma.Decimal('101'), state: MarketQuoteState.LIVE, provider: 'b2', source: 'quote-feed', observedAt: expiresAt, receivedAt: new Date(), sequence: 5n };
    const tx: any = {
      gate2BinaryPosition: { findUnique: jest.fn().mockResolvedValue(position), update: jest.fn().mockImplementation(({ data }: any) => ({ ...position, ...data })) },
      marketPair: { findUnique: jest.fn().mockResolvedValue({ quoteAsset: { symbol: 'USDT' } }) },
      marketQuoteLatest: { findUnique: jest.fn().mockResolvedValue(quote) },
      gate2BinaryConfiguration: { findFirst: jest.fn().mockResolvedValue(config) },
      gate2OperationAudit: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const prisma: any = { $transaction: jest.fn(async (callback: (client: any) => unknown) => callback(tx)) };
    const ledger: any = {
      getAccountForUser: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
      settle: jest.fn().mockResolvedValue({ postingId: 'settle-1' }),
      credit: jest.fn().mockResolvedValue({ postingId: 'credit-1' }),
      release: jest.fn().mockResolvedValue({ postingId: 'release-1' }),
    };
    return { service: new BinaryService(prisma, ledger, { emitPositionUpdate: jest.fn() } as never, { findBinaryDirective: jest.fn().mockResolvedValue(null) } as never), tx, ledger, position, quote };
  }

  it('pins the exact configuration version and accepts the exact expiry boundary', async () => {
    const { service, tx } = createBinarySettlement();
    const result = await service.settlePosition('position-1');
    expect(result.position.state).toBe(Gate2BinaryState.WIN);
    expect(tx.gate2BinaryConfiguration.findFirst).toHaveBeenCalledWith({ where: { pair: 'BTCUSDT', durationSeconds: 30, version: 7 } });
  });

  it('delays when the latest quote is pre-expiry or not later than entry evidence', async () => {
    const { service, tx, quote, position } = createBinarySettlement();
    quote.observedAt = new Date(position.expiresAt.getTime() - 1);
    quote.sequence = 4n;
    const result = await service.settlePosition('position-1');
    expect(result.delayed).toBe(true);
    expect(result.position.state).toBe(Gate2BinaryState.SETTLEMENT_DELAYED);
    expect(tx.gate2BinaryConfiguration.findFirst).not.toHaveBeenCalled();
  });

  it('compensates a terminal settlement ERROR by releasing stake and recording an audit receipt', async () => {
    const { service, tx, ledger } = createBinarySettlement(Gate2BinaryState.ACTIVE, null);
    const result = await service.settlePosition('position-1');
    expect(result.error).toBe(true);
    expect(result.position.state).toBe(Gate2BinaryState.ERROR);
    expect(result.position.settlementReceiptId).toBe('gate2:binary:error-compensation:position-1');
    expect(ledger.release).toHaveBeenCalledWith(expect.objectContaining({ amount: '10', idempotencyKey: 'gate2:binary:error-compensation:position-1:release' }), tx);
    expect(tx.gate2OperationAudit.create).toHaveBeenCalledTimes(1);
  });

  it('replays a terminal ERROR without a second compensation mutation', async () => {
    const { service, tx, ledger } = createBinarySettlement(Gate2BinaryState.ERROR, null);
    const result = await service.settlePosition('position-1');
    expect(result.replayed).toBe(true);
    expect(ledger.release).not.toHaveBeenCalled();
    expect(tx.gate2OperationAudit.create).not.toHaveBeenCalled();
  });
});
