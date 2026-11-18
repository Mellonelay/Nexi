import { MarketIngestService } from '../../src/market/market-ingest.service';

describe('MarketIngestService Kline publication', () => {
  it('uses Binance native 1m klines instead of duplicating candle persistence from ticker quotes', async () => {
    const marketAuthority = { ingestQuote: jest.fn().mockResolvedValue({ accepted: true }) };
    const marketKlines = { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() };
    const service = new MarketIngestService(
      marketAuthority as never,
      marketKlines as never,
      { ensureReconciled: jest.fn().mockResolvedValue(undefined) } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn().mockReturnValue(false), publish: jest.fn() } as never,
    );

    await (service as any).handleProviderEvent({
      kind: 'ticker', symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket',
      providerInstrument: 'BTCUSDT', priceType: 'LAST', eventTime: 1_000, price: '10',
    });

    expect(marketAuthority.ingestQuote).toHaveBeenCalledTimes(1);
    expect(marketKlines.accumulateQuote).not.toHaveBeenCalled();
  });

  it('keeps quote-derived 1m candles for providers without the Binance native kline stream', async () => {
    const marketAuthority = { ingestQuote: jest.fn().mockResolvedValue({ accepted: true }) };
    const quoteCandle = {
      symbol: 'AAPLUSDT', interval: '1m', time: 0, closeTime: '1970-01-01T00:00:01.000Z',
      open: '10', high: '10', low: '10', close: '10', volume: null, provider: 'gate',
      source: 'rest:ticker:quote-aggregation', observedAt: '1970-01-01T00:00:01.000Z',
      receivedAt: '1970-01-01T00:00:01.001Z', isFinal: false,
    };
    const marketKlines = { persist: jest.fn(), accumulateQuote: jest.fn().mockResolvedValue(quoteCandle), aggregateFromOneMinute: jest.fn() };
    const service = new MarketIngestService(
      marketAuthority as never,
      marketKlines as never,
      { ensureReconciled: jest.fn().mockResolvedValue(undefined) } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn().mockReturnValue(true), publish: jest.fn().mockResolvedValue(undefined) } as never,
    );

    await (service as any).handleProviderEvent({
      kind: 'ticker', symbol: 'AAPLUSDT', provider: 'gate', source: 'rest:ticker',
      providerInstrument: 'AAPL', priceType: 'LAST', eventTime: 1_000, price: '10',
    });

    expect(marketKlines.accumulateQuote).toHaveBeenCalledTimes(1);
    expect((service as any).redis.publish).toHaveBeenCalledWith('market:klines:v1', expect.stringContaining('"source":"rest:ticker:quote-aggregation"'));
  });

  it('persists provider Kline updates before publishing the normalized realtime event', async () => {
    const candle = {
      symbol: 'BTCUSDT', interval: '1m', time: 1_000, closeTime: '1970-01-01T00:01:00.999Z',
      open: '10', high: '12', low: '9', close: '11', volume: '3', provider: 'fixture',
      source: 'websocket:kline', observedAt: '1970-01-01T00:01:01.000Z', receivedAt: '1970-01-01T00:01:01.001Z', sequence: 61_002, isFinal: true,
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
    expect(redis.publish).toHaveBeenCalledWith('market:klines:v1', expect.stringContaining('"isFinal":true'));
    expect(JSON.parse(redis.publish.mock.calls[0][1]).sequence).toBe(61_002);
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
      providerInstrument: 'BTCUSDT', eventTime: 120_000, tradeTime: 119_999, tradeId: 'trade-1',
      price: '10', quantity: '0.1', maker: false,
    });

    expect(redis.publish).toHaveBeenCalledTimes(1);
    expect(redis.publish).toHaveBeenCalledWith('market:reference:v1', expect.stringContaining('"event":"market.reference.trade"'));
    expect(JSON.parse(redis.publish.mock.calls[0][1])).toMatchObject({ eventTime: 120_000, tradeTime: 119_999 });
  });

  it('keeps reference traffic out of the durable SQLite work queue', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    const trade = { kind: 'trade', symbol: 'BTCUSDT', provider: 'binance-spot' };
    const ticker = { kind: 'ticker', symbol: 'SUNUSDT', provider: 'binance-spot' };
    (service as any).activeReferenceWorkers = 4;
    (service as any).activeWorkers = 8;
    (service as any).enqueue(trade);
    (service as any).enqueue(ticker);

    expect((service as any).eventQueue).toEqual([ticker]);
    expect((service as any).referenceQueue).toEqual([trade]);
  });

  it('does not drop reference events because the durable queue is saturated', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    (service as any).activeReferenceWorkers = 4;
    const queue = (service as any).eventQueue as unknown[];
    queue.push(...Array.from({ length: 256 }, (_, index) => ({
      kind: 'kline', symbol: `K${index}`, provider: 'fixture',
    })));
    (service as any).activeWorkers = 8;

    const trade = { kind: 'trade', symbol: 'BTCUSDT', provider: 'binance-spot' };
    (service as any).enqueue(trade);

    expect(queue).toHaveLength(256);
    expect((service as any).referenceQueue).toEqual([trade]);
  });

  it('preserves closed candles when the durable queue is saturated', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    (service as any).activeWorkers = 8;
    const queue = (service as any).eventQueue as Array<Record<string, unknown>>;
    queue.push(...Array.from({ length: 256 }, (_, index) => ({
      kind: 'kline', symbol: `K${index}`, provider: 'fixture', closed: true,
    })));
    const closed = { kind: 'kline', symbol: 'BTCUSDT', provider: 'fixture', closed: true };

    (service as any).enqueue(closed);

    expect(queue).toHaveLength(257);
    expect(queue).toContain(closed);
    expect((service as any).droppedDurableClosedKlines).toBe(0);
  });

  it('keeps the durable queue bounded and counts closed-candle drops at the hard cap', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    (service as any).activeWorkers = 8;
    const queue = (service as any).eventQueue as Array<Record<string, unknown>>;
    queue.push(...Array.from({ length: 1024 }, (_, index) => ({
      kind: 'kline', symbol: `K${index}`, provider: 'fixture', closed: true,
    })));
    const overflow = { kind: 'kline', symbol: 'BTCUSDT', provider: 'fixture', closed: true };

    (service as any).enqueue(overflow);

    expect(queue).toHaveLength(1024);
    expect(queue).not.toContain(overflow);
    expect((service as any).droppedDurableClosedKlines).toBe(1);
  });

  it('drops replaceable market state before a closed candle at the durable queue limit', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    (service as any).activeWorkers = 8;
    const queue = (service as any).eventQueue as Array<Record<string, unknown>>;
    const replaceable = { kind: 'ticker', symbol: 'BTCUSDT', provider: 'fixture' };
    queue.push(replaceable, ...Array.from({ length: 255 }, (_, index) => ({
      kind: 'kline', symbol: `K${index}`, provider: 'fixture', closed: true,
    })));
    const closed = { kind: 'kline', symbol: 'ETHUSDT', provider: 'fixture', closed: true };

    (service as any).enqueue(closed);

    expect(queue).toHaveLength(256);
    expect(queue).not.toContain(replaceable);
    expect(queue).toContain(closed);
    expect((service as any).droppedDurableTickers).toBe(1);
  });

  it('coalesces queued full depth snapshots by provider and symbol', () => {
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist: jest.fn(), accumulateQuote: jest.fn(), aggregateFromOneMinute: jest.fn() } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      { isAvailable: jest.fn(), publish: jest.fn() } as never,
    );
    (service as any).activeReferenceWorkers = 4;
    const older = { kind: 'depth', symbol: 'BTCUSDT', provider: 'binance-spot', updateId: 1 };
    const newer = { ...older, updateId: 2 };

    (service as any).enqueue(older);
    (service as any).enqueue(newer);

    expect((service as any).referenceQueue).toEqual([newer]);
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

  it('drains queued closed candles on provider shutdown instead of clearing them', async () => {
    const persisted = { symbol: 'BTCUSDT', interval: '1m', time: 1, closeTime: null, open: '1', high: '1', low: '1', close: '1', volume: null, provider: 'binance-spot', source: 'websocket:kline', observedAt: '1970-01-01T00:00:01.000Z', receivedAt: '1970-01-01T00:00:01.001Z', isFinal: true };
    const persist = jest.fn().mockResolvedValue(persisted);
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      { persist, aggregateFromOneMinute: jest.fn().mockResolvedValue([]) } as never,
      { ensureReconciled: jest.fn() } as never,
      { start: jest.fn(), stop: jest.fn().mockResolvedValue(undefined) } as never,
      { isAvailable: jest.fn().mockReturnValue(false) } as never,
    );
    (service as any).activeWorkers = 8;
    (service as any).enqueue({kind:'kline',symbol:'BTCUSDT',provider:'binance-spot',source:'websocket:kline',interval:'1m',openTime:1000,closeTime:59999,eventTime:59999,open:'1',high:'1',low:'1',close:'1',volume:null,closed:true});
    (service as any).activeWorkers = 0;
    await service.onModuleDestroy();
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
