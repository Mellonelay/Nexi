import { MarketIngestService } from '../../src/market/market-ingest.service';

describe('MarketIngestService Kline publication', () => {
  it('persists provider Kline updates before publishing the normalized realtime event', async () => {
    const candle = {
      symbol: 'BTCUSDT', interval: '1m', time: 1_000, closeTime: '1970-01-01T00:01:00.999Z',
      open: '10', high: '12', low: '9', close: '11', volume: '3', provider: 'fixture',
      source: 'websocket:kline', observedAt: '1970-01-01T00:01:01.000Z', receivedAt: '1970-01-01T00:01:01.001Z',
    };
    const redis = { isAvailable: jest.fn().mockReturnValue(true), publish: jest.fn().mockResolvedValue(undefined) };
    const marketKlines = { persist: jest.fn().mockResolvedValue(candle), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn().mockResolvedValue([]) };
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      marketKlines as never,
      { ensureReconciled: jest.fn().mockResolvedValue(undefined) } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      redis as never,
    );

    await (service as any).handleProviderEvent({
      kind: 'kline', symbol: 'BTCUSDT', provider: 'fixture', source: 'websocket:kline', providerInstrument: 'BTCUSDT',
      eventTime: 61_000, openTime: 1_000, closeTime: 60_999, interval: '1m',
      open: '10', high: '12', low: '9', close: '11', volume: '3', closed: false,
    });

    expect(marketKlines.persist).toHaveBeenCalledTimes(1);
    expect(redis.publish).toHaveBeenCalledWith('market:klines:v1', expect.stringContaining('"event":"market_kline"'));
    expect(redis.publish.mock.invocationCallOrder[0]).toBeGreaterThan(marketKlines.persist.mock.invocationCallOrder[0]);
  });

  it('publishes D1-derived higher intervals after a finalized 1m provider candle', async () => {
    const oneMinute = {
      symbol: 'BTCUSDT', interval: '1m', time: 60, closeTime: '1970-01-01T00:01:59.999Z',
      open: '10', high: '12', low: '9', close: '11', volume: '3', provider: 'binance-spot',
      source: 'websocket:kline', observedAt: '1970-01-01T00:02:00.000Z', receivedAt: '1970-01-01T00:02:00.001Z',
    };
    const fiveMinute = { ...oneMinute, interval: '5m', time: 0, source: 'derived:1m-aggregation' };
    const redis = { isAvailable: jest.fn().mockReturnValue(true), publish: jest.fn().mockResolvedValue(undefined) };
    const marketKlines = {
      persist: jest.fn().mockResolvedValue(oneMinute), accumulateQuote: jest.fn(),
      aggregateFromOneMinute: jest.fn().mockResolvedValue([fiveMinute]),
    };
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      marketKlines as never,
      { ensureReconciled: jest.fn().mockResolvedValue(undefined) } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      redis as never,
    );

    await (service as any).handleProviderEvent({
      kind: 'kline', symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket:kline', providerInstrument: 'BTCUSDT',
      eventTime: 120_000, openTime: 60_000, closeTime: 119_999, interval: '1m',
      open: '10', high: '12', low: '9', close: '11', volume: '3', closed: true,
    });

    expect(marketKlines.aggregateFromOneMinute).toHaveBeenCalledWith('BTCUSDT', new Date(60_000));
    expect(redis.publish).toHaveBeenCalledTimes(2);
    expect(redis.publish.mock.calls[1][1]).toContain('"interval":"5m"');
  });

  it('publishes provider depth/trade reference events without archive persistence', async () => {
    const redis = { isAvailable: jest.fn().mockReturnValue(true), publish: jest.fn().mockResolvedValue(undefined) };
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn().mockResolvedValue(undefined) } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      redis as never,
    );

    await (service as any).handleProviderEvent({
      kind: 'trade', symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket:trade',
      providerInstrument: 'BTCUSDT', eventTime: 120_000, tradeId: 'trade-1',
      price: '10', quantity: '0.1', maker: false,
    });

    expect(redis.publish).toHaveBeenCalledTimes(1);
    expect(redis.publish).toHaveBeenCalledWith('market:reference:v1', expect.stringContaining('"event":"market.reference.trade"'));
  });

  it('dequeues durable quote events ahead of bursty reference traffic', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    const trade = { kind: 'trade', symbol: 'BTCUSDT', provider: 'binance-spot' };
    const ticker = { kind: 'ticker', symbol: 'SUNUSDT', provider: 'binance-spot' };
    (service as any).eventQueue.push(trade, ticker);

    expect((service as any).dequeueNextEvent()).toBe(ticker);
  });

  it('drops queued reference traffic before a durable ticker when the ingest queue saturates', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    const depth = { kind: 'depth', symbol: 'BTCUSDT', provider: 'binance-spot' };
    const ticker = { kind: 'ticker', symbol: 'SUNUSDT', provider: 'binance-spot' };
    const queue = (service as any).eventQueue as unknown[];
    queue.push(depth, ticker, ...Array.from({ length: 254 }, (_, index) => ({
      kind: 'kline', symbol: `K${index}`, provider: 'fixture',
    })));
    (service as any).activeWorkers = 8;

    (service as any).enqueue({ kind: 'kline', symbol: 'ETHUSDT', provider: 'binance-spot' });

    expect(queue).not.toContain(depth);
    expect(queue).toContain(ticker);
    expect(queue).toHaveLength(256);
  });

  it('waits for catalog reconciliation before starting providers', async () => {
    let releaseReconciliation!: () => void;
    const reconciliation = new Promise<void>((resolve) => { releaseReconciliation = resolve; });
    const providers = { start: jest.fn().mockResolvedValue(true), stop: jest.fn() };
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn().mockReturnValue(reconciliation) } as never,
      providers as never,
      { isAvailable: jest.fn().mockReturnValue(false), publish: jest.fn() } as never,
    );

    service.onModuleInit();
    await Promise.resolve();
    expect(providers.start).not.toHaveBeenCalled();

    releaseReconciliation();
    await new Promise((resolve) => setImmediate(resolve));
    expect(providers.start).toHaveBeenCalledTimes(1);

    service.onModuleDestroy();
    expect(providers.stop).toHaveBeenCalledTimes(1);
  });
});
