jest.mock('../../src/d1/d1-prisma.service', () => ({ D1PrismaService: class D1PrismaService {} }));

import { MarketKlineService } from '../../src/market/market-kline.service';

describe('MarketKlineService quote aggregation', () => {
  const disabledD1 = () => ({ isEnabled: jest.fn().mockReturnValue(false) });

  const createService = () => {
    const rows = new Map<string, any>();
    const keyFor = (where: any) => {
      const key = where.pairId_interval_openTime;
      return `${key.pairId}:${key.interval}:${key.openTime.toISOString()}`;
    };
    const prisma: any = {
      marketPair: { findUnique: jest.fn(async () => ({ id: 'pair-btcusdt', symbol: 'BTCUSDT' })) },
      marketKline: {
        findUnique: jest.fn(async ({ where }: any) => rows.get(keyFor(where)) ?? null),
        create: jest.fn(async ({ data }: any) => {
          const row = { id: 'kline-1', ...data, receivedAt: new Date('2026-08-10T00:00:00.000Z') };
          rows.set(`${data.pairId}:${data.interval}:${data.openTime.toISOString()}`, row);
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = [...rows.values()].find((value) => value.id === where.id);
          const next = { ...row, ...data };
          rows.set(`${next.pairId}:${next.interval}:${next.openTime.toISOString()}`, next);
          return next;
        }),
      },
    };
    return { service: new MarketKlineService(prisma, disabledD1() as never), prisma };
  };

  it('creates a 1m candle from a provider quote with explicit derived lineage and no fabricated volume', async () => {
    const { service, prisma } = createService();

    await (service as any).accumulateQuote({
      symbol: 'BTC/USDT',
      price: '30000',
      provider: 'provider-a',
      source: 'websocket',
      observedAt: new Date('2026-08-10T12:34:56.789Z'),
    });

    const data = prisma.marketKline.create.mock.calls[0][0].data;
    expect(data.openTime.toISOString()).toBe('2026-08-10T12:34:00.000Z');
    expect(data.open.toString()).toBe('30000');
    expect(data.high.toString()).toBe('30000');
    expect(data.low.toString()).toBe('30000');
    expect(data.close.toString()).toBe('30000');
    expect(data.volume).toBeNull();
    expect(data.source).toBe('websocket:quote-aggregation');
  });

  it('updates the active candle high, low and close while preserving its first observed open', async () => {
    const { service, prisma } = createService();
    const observedAt = new Date('2026-08-10T12:34:00.000Z');

    await (service as any).accumulateQuote({ symbol: 'BTCUSDT', price: '30000', provider: 'provider-a', source: 'websocket', observedAt });
    await (service as any).accumulateQuote({ symbol: 'BTCUSDT', price: '30120', provider: 'provider-a', source: 'websocket', observedAt: new Date('2026-08-10T12:34:30.000Z') });
    const candle = await (service as any).accumulateQuote({ symbol: 'BTCUSDT', price: '29980', provider: 'provider-a', source: 'websocket', observedAt: new Date('2026-08-10T12:34:45.000Z') });

    const data = prisma.marketKline.update.mock.calls.at(-1)[0].data;
    expect(candle.open.toString()).toBe('30000');
    expect(data.high.toString()).toBe('30120');
    expect(data.low.toString()).toBe('29980');
    expect(data.close.toString()).toBe('29980');
    expect(data.volume).toBeNull();
  });

  it('limits the newest candles and returns them in ascending chart order', async () => {
    const rows = [
      { openTime: new Date('2026-08-17T12:02:00.000Z'), closeTime: new Date('2026-08-17T12:02:59.999Z'), open: '3', high: '4', low: '2', close: '3', volume: null, symbol: 'BTCUSDT', interval: '1m', provider: 'binance-spot', source: 'websocket:kline', observedAt: new Date('2026-08-17T12:03:00.000Z'), receivedAt: new Date('2026-08-17T12:03:00.000Z') },
      { openTime: new Date('2026-08-17T12:03:00.000Z'), closeTime: new Date('2026-08-17T12:03:59.999Z'), open: '4', high: '5', low: '3', close: '4', volume: null, symbol: 'BTCUSDT', interval: '1m', provider: 'binance-spot', source: 'websocket:kline', observedAt: new Date('2026-08-17T12:04:00.000Z'), receivedAt: new Date('2026-08-17T12:04:00.000Z') },
    ];
    const prisma: any = {
      marketPair: { findUnique: jest.fn(async () => ({ id: 'pair-btcusdt', symbol: 'BTCUSDT' })) },
      marketKline: { findMany: jest.fn(async () => [...rows].reverse()) },
    };
    const service = new MarketKlineService(prisma, disabledD1() as never);

    const candles = await service.list('BTCUSDT', '1m', 2);

    expect(prisma.marketKline.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { openTime: 'desc' }, take: 2 }));
    expect(candles.map((c) => c.close)).toEqual(['3', '4']);
  });
});
