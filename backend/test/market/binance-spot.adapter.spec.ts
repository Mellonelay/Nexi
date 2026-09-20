import { BinanceSpotAdapter } from '../../src/market/binance-spot.adapter';

describe('BinanceSpotAdapter', () => {
  const originalEnabled = process.env.MARKET_PROVIDER_ENABLED;
  const originalSymbols = process.env.MARKET_PROVIDER_SYMBOLS;
  const originalBinanceSymbols = process.env.MARKET_PROVIDER_SYMBOLS_BINANCE_SPOT;

  beforeEach(() => { process.env.MARKET_PROVIDER_ENABLED = 'true'; });
  afterEach(() => {
    if (originalEnabled === undefined) delete process.env.MARKET_PROVIDER_ENABLED;
    else process.env.MARKET_PROVIDER_ENABLED = originalEnabled;
    if (originalSymbols === undefined) delete process.env.MARKET_PROVIDER_SYMBOLS;
    else process.env.MARKET_PROVIDER_SYMBOLS = originalSymbols;
    if (originalBinanceSymbols === undefined) delete process.env.MARKET_PROVIDER_SYMBOLS_BINANCE_SPOT;
    else process.env.MARKET_PROVIDER_SYMBOLS_BINANCE_SPOT = originalBinanceSymbols;
    jest.restoreAllMocks();
  });

  it('uses the provider-specific Binance symbol list when the generic list is absent', () => {
    delete process.env.MARKET_PROVIDER_SYMBOLS;
    process.env.MARKET_PROVIDER_SYMBOLS_BINANCE_SPOT = 'BTCUSDT,ETHUSDT,LTCUSDT';
    const adapter = new BinanceSpotAdapter();
    expect(adapter.configuredSymbols()).toEqual(['BTCUSDT', 'ETHUSDT', 'LTCUSDT']);
  });

  it('normalizes combined ticker, kline, depth, and trade events', () => {
    const adapter = new BinanceSpotAdapter() as unknown as { normalize: (raw: string) => unknown };
    expect(adapter.normalize(JSON.stringify({ data: { e: '24hrTicker', E: 1000, s: 'BTCUSDT', c: '10', P: '1', v: '2', h: '11', l: '9' } }))).toMatchObject({ kind: 'ticker', symbol: 'BTCUSDT', price: '10' });
    expect(adapter.normalize(JSON.stringify({ data: { e: 'kline', E: 1000, s: 'BTCUSDT', k: { t: 0, T: 59999, i: '1m', o: '9', h: '11', l: '8', c: '10', v: '3', x: true } } }))).toMatchObject({ kind: 'kline', closed: true, interval: '1m' });
    expect(adapter.normalize(JSON.stringify({ data: { e: 'depthUpdate', E: 1000, s: 'BTCUSDT', u: 4, b: [['10', '2']], a: [['11', '1']] } }))).toMatchObject({ kind: 'depth', updateId: 4 });
    expect(adapter.normalize(JSON.stringify({ stream: 'btcusdt@depth20@1000ms', data: { lastUpdateId: 5, bids: [['10', '2']], asks: [['11', '1']] } }))).toMatchObject({ kind: 'depth', symbol: 'BTCUSDT', updateId: 5, bids: [['10', '2']] });
    expect(adapter.normalize(JSON.stringify({ data: { e: 'trade', E: 1000, s: 'BTCUSDT', t: 7, p: '10', q: '1', m: true } }))).toMatchObject({ kind: 'trade', tradeId: 7, maker: true });
  });

  it('maps public REST depth and trades without credentials', async () => {
    const adapter = new BinanceSpotAdapter();
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      const body = url.includes('/depth')
        ? { lastUpdateId: 8, bids: [['10', '2']], asks: [['11', '1']] }
        : [{ id: 9, price: '10', qty: '1', time: 1000, isBuyerMaker: false }];
      return { ok: true, json: async () => body } as Response;
    });
    await expect(adapter.fetchDepth('BTCUSDT')).resolves.toMatchObject({ state: 'LIVE', provider: 'binance-spot' });
    await expect(adapter.fetchTrades('BTCUSDT')).resolves.toMatchObject([{ id: 'binance:BTCUSDT:9', side: 'BUY' }]);
  });

  it('recovers a silent ticker stream through the bounded REST watchdog', async () => {
    const now = Date.parse('2026-09-20T04:45:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const adapter = new BinanceSpotAdapter() as unknown as {
      symbols: string[];
      request: jest.Mock;
      refreshStaleTickers: (handler: (event: unknown) => void) => Promise<void>;
    };
    adapter.symbols = ['adausdt'];
    adapter.request = jest.fn().mockResolvedValue([{
      symbol: 'ADAUSDT',
      lastPrice: '0.21',
      priceChangePercent: '2.5',
      volume: '100',
      highPrice: '0.22',
      lowPrice: '0.20',
      // Binance closeTime is last market activity, not the time this REST
      // response was observed. Quiet symbols can legitimately lag > freshness.
      closeTime: now - 120_000,
    }]);
    const handler = jest.fn();

    await adapter.refreshStaleTickers(handler);

    expect(adapter.request).toHaveBeenCalledWith('/api/v3/ticker/24hr', { symbols: '["ADAUSDT"]' });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'ticker',
      source: 'rest:watchdog',
      symbol: 'ADAUSDT',
      price: '0.21',
      eventTime: now,
    }));
  });

  it('schedules the watchdog with phase headroom before the public stale boundary', async () => {
    jest.useFakeTimers();
    const adapter = new BinanceSpotAdapter() as unknown as {
      symbols: string[];
      request: jest.Mock;
      startWatchdog: (handler: (event: unknown) => void) => void;
      stop: () => void;
    };
    adapter.symbols = ['sunusdt'];
    adapter.request = jest.fn().mockResolvedValue([]);
    adapter.startWatchdog(jest.fn());

    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(10_001);
    expect(adapter.request).toHaveBeenCalled();
    adapter.stop();
  });

  it('refreshes a quiet symbol before the public quote stale boundary', async () => {
    const now = Date.parse('2026-09-20T09:30:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const adapter = new BinanceSpotAdapter() as unknown as {
      symbols: string[];
      lastTickerAt: Map<string, number>;
      request: jest.Mock;
      refreshStaleTickers: (handler: (event: unknown) => void) => Promise<void>;
    };
    adapter.symbols = ['sunusdt'];
    adapter.lastTickerAt.set('sunusdt', now - 16_000);
    adapter.request = jest.fn().mockResolvedValue([{
      symbol: 'SUNUSDT', lastPrice: '0.017', priceChangePercent: '0', volume: '1', highPrice: '0.018', lowPrice: '0.016',
    }]);

    await adapter.refreshStaleTickers(jest.fn());

    expect(adapter.request).toHaveBeenCalledWith('/api/v3/ticker/24hr', { symbols: '[\"SUNUSDT\"]' });
  });

  it('terminates an open but globally silent stream so reconnect can resubscribe', () => {
    const adapter = new BinanceSpotAdapter() as unknown as {
      socket: { terminate: jest.Mock; close: jest.Mock };
      lastStreamEventAt: number;
      streamOpenedAt: number;
      recoverSilentStream: (now: number) => boolean;
      stop: () => void;
    };
    const now = Date.now();
    adapter.socket = { terminate: jest.fn(), close: jest.fn() };
    adapter.streamOpenedAt = now - 120_000;
    adapter.lastStreamEventAt = now - 120_000;

    expect(adapter.recoverSilentStream(now)).toBe(true);
    expect(adapter.socket.terminate).toHaveBeenCalledTimes(1);
    adapter.stop();
  });

  it('discovers only canonical Spot crypto symbols with TRADING Spot permissions', async () => {
    const adapter = new BinanceSpotAdapter();
    jest.spyOn(global, 'fetch').mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        symbols: [
          { symbol: 'BTCUSDT', status: 'TRADING', permissions: ['SPOT'] },
          { symbol: 'ETHUSDT', status: 'TRADING', permissions: [], permissionSets: [['SPOT', 'MARGIN']] },
          { symbol: 'AAPLUSDT', status: 'TRADING', permissions: ['SPOT'] },
          { symbol: 'LTCUSDT', status: 'BREAK', permissions: ['SPOT'] },
        ],
      }),
    } as Response));

    await expect(adapter.discoverCanonicalCryptoSymbols()).resolves.toEqual(['BTCUSDT', 'ETHUSDT']);
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toContain('permissions=SPOT');
  });

  it('schedules bounded reconnects after an unexpected stream close', () => {
    jest.useFakeTimers();
    const adapter = new BinanceSpotAdapter() as unknown as {
      eventHandler: (event: unknown) => void;
      scheduleReconnect: () => void;
      start: jest.Mock;
      stop: () => void;
    };
    const handler = jest.fn();
    adapter.eventHandler = handler;
    adapter.start = jest.fn().mockResolvedValue(undefined);

    adapter.scheduleReconnect();
    jest.advanceTimersByTime(999);
    expect(adapter.start).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(adapter.start).toHaveBeenCalledWith(handler);
    adapter.stop();
    jest.useRealTimers();
  });

  it('cancels reconnect work during an intentional stop', () => {
    jest.useFakeTimers();
    const adapter = new BinanceSpotAdapter() as unknown as {
      eventHandler: (event: unknown) => void;
      scheduleReconnect: () => void;
      start: jest.Mock;
      stop: () => void;
    };
    adapter.eventHandler = jest.fn();
    adapter.start = jest.fn().mockResolvedValue(undefined);

    adapter.scheduleReconnect();
    adapter.stop();
    jest.advanceTimersByTime(30_000);
    expect(adapter.start).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
