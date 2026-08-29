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
