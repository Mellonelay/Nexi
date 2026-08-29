import { FinnhubMarketAdapter } from '../../src/market/finnhub-market.adapter';
import { MassiveMarketAdapter } from '../../src/market/massive-market.adapter';
import { MetalsApiMarketAdapter } from '../../src/market/metals-api-market.adapter';
import { MetalpriceApiMarketAdapter } from '../../src/market/metalprice-api-market.adapter';
import { OandaMarketAdapter } from '../../src/market/oanda-market.adapter';
import { AlphaVantageMarketAdapter } from '../../src/market/alpha-vantage-market.adapter';
import { FawazCurrencyMarketAdapter } from '../../src/market/fawaz-currency-market.adapter';
import { RzzroIndustrialMetalsMarketAdapter } from '../../src/market/rzzro-industrial-metals-market.adapter';
import { resolveProviderInstrument } from '../../src/market/market-source-registry';
import { YahooMarketAdapter } from '../../src/market/yahoo-market.adapter';
import { OkxMarketAdapter, BitgetMarketAdapter, HtxMarketAdapter, BybitMarketAdapter, GateMarketAdapter } from '../../src/market/public-exchange-market.adapter';

describe('non-crypto market adapters', () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env.MARKET_PROVIDER_ENABLED = 'true';
    jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
    jest.restoreAllMocks();
  });

  it('uses documented provider-specific instrument forms without changing NEXI identities', () => {
    expect(resolveProviderInstrument('EURUSD', 'massive')).toBe('C:EURUSD');
    expect(resolveProviderInstrument('EURUSD', 'finnhub')).toBe('OANDA:EUR_USD');
    expect(resolveProviderInstrument('EURUSD', 'oanda')).toBe('EUR_USD');
    expect(resolveProviderInstrument('XAUUSD', 'metals-api')).toBe('XAU');
    expect(resolveProviderInstrument('EURUSD', 'fawaz-currency')).toBe('EUR');
    expect(resolveProviderInstrument('XAUUSD', 'fawaz-currency')).toBe('XAU');
    expect(resolveProviderInstrument('XALUSD', 'rzzro-industrial-metals')).toBe('aluminum');
    expect(resolveProviderInstrument('XCUUSD', 'rzzro-industrial-metals')).toBe('copper');
    expect(resolveProviderInstrument('XZNUSD', 'rzzro-industrial-metals')).toBe('zinc');
    expect(resolveProviderInstrument('XZNUSD', 'yahoo')).toBe('ZNC=F');
    expect(resolveProviderInstrument('USDCNH', 'yahoo')).toBe('CNH=X');
  });

  it('requires an explicit selected provider and limits CANONICAL_PRIMARY to that provider’s mapped primary assets', () => {
    process.env.MARKET_PROVIDER_NAME = 'massive';
    process.env.MARKET_PROVIDER_SYMBOLS = 'CANONICAL_PRIMARY';
    process.env.MASSIVE_API_KEY = 'test-key';
    const adapter = new MassiveMarketAdapter() as unknown as { isEnabled: () => boolean; configuredSymbols: () => string[] };
    expect(adapter.isEnabled()).toBe(true);
    expect(adapter.configuredSymbols()).toEqual(expect.arrayContaining(['AAPLUSDT', 'EURUSD']));
    expect(adapter.configuredSymbols()).toHaveLength(29);
    expect(adapter.configuredSymbols()).not.toContain('BTCUSDT');
  });

  it('supports provider-specific canonical selectors during concurrent provider startup', () => {
    process.env.MARKET_PROVIDER_NAMES = 'binance-spot,alpha-vantage';
    process.env.MARKET_PROVIDER_SYMBOLS = 'CANONICAL_CRYPTO';
    process.env.MARKET_PROVIDER_SYMBOLS_ALPHA_VANTAGE = 'CANONICAL_STOCKS,CANONICAL_FOREX,CANONICAL_METALS';
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    const adapter = new AlphaVantageMarketAdapter() as unknown as { configuredSymbols: () => string[] };
    expect(adapter.configuredSymbols()).toHaveLength(36);
    expect(adapter.configuredSymbols()).toEqual(expect.arrayContaining(['AAPLUSDT', 'EURUSD', 'XAUUSD', 'XZNUSD']));
    expect(adapter.configuredSymbols()).not.toContain('BTCUSDT');
  });

  it('normalizes a Massive stock snapshot into a canonical quote', async () => {
    process.env.MASSIVE_API_KEY = 'test-key';
    const adapter = new MassiveMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ticker: { lastTrade: { p: 190.25 }, day: { h: 191, l: 188, v: 123 } } }) });
    await expect(adapter.fetchQuote('AAPLUSDT')).resolves.toMatchObject({ provider: 'massive', symbol: 'AAPLUSDT', providerInstrument: 'AAPL', price: '190.25', priceType: 'LAST' });
  });

  it('normalizes Yahoo daily chart data as a non-settlement reference quote', async () => {
    const adapter = new YahooMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({
      chart: { result: [{ timestamp: [1_700_000_000], indicators: { quote: [{ close: [52.36], high: [53], low: [51], volume: [1000] }] } }] },
    }) });
    await expect(adapter.fetchQuote('XZNUSD')).resolves.toMatchObject({
      provider: 'yahoo', providerInstrument: 'ZNC=F', priceType: 'CANDLE_CLOSE', price: '52.36', source: 'rest:chart:1d',
    });
  });

  it('normalizes Finnhub stock and forex responses without treating candles as tick trades', async () => {
    process.env.FINNHUB_API_KEY = 'test-key';
    const adapter = new FinnhubMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ c: 190.25, dp: 1.2, h: 191, l: 188, t: 1_700_000_000 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ s: 'ok', c: [1.08765], h: [1.0877], l: [1.0876], t: [1_700_000_000] }) });
    await expect(adapter.fetchQuote('AAPLUSDT')).resolves.toMatchObject({ provider: 'finnhub', priceType: 'LAST', price: '190.25' });
    await expect(adapter.fetchQuote('EURUSD')).resolves.toMatchObject({ provider: 'finnhub', providerInstrument: 'OANDA:EUR_USD', priceType: 'CANDLE_CLOSE', price: '1.08765' });
  });

  it('uses OANDA bid/ask midpoint only when the provider response is coherent', async () => {
    process.env.OANDA_ACCESS_TOKEN = 'test-token';
    process.env.OANDA_ACCOUNT_ID = 'test-account';
    const adapter = new OandaMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ prices: [{ time: '2026-08-11T00:00:00.000000000Z', bids: [{ price: '1.1000' }], asks: [{ price: '1.1002' }] }] }) });
    await expect(adapter.fetchQuote('EURUSD')).resolves.toMatchObject({ provider: 'oanda', providerInstrument: 'EUR_USD', priceType: 'MID', price: '1.1001' });
  });

  it('requires an explicit rate direction before using Metals-API reference data', async () => {
    process.env.METALS_API_KEY = 'test-key';
    process.env.METALS_API_QUOTE_DIRECTION = 'UNITS_PER_USD';
    const adapter = new MetalsApiMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ timestamp: 1_700_000_000, rates: { XAU: 0.0005 } }) });
    await expect(adapter.fetchQuote('XAUUSD')).resolves.toMatchObject({ provider: 'metals-api', providerInstrument: 'XAU', priceType: 'REFERENCE', price: '2000' });
  });

  it('uses MetalpriceAPI conversion results as delayed reference prices only', async () => {
    process.env.METALPRICE_API_KEY = 'test-key';
    const adapter = new MetalpriceApiMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ success: true, info: { timestamp: 1_700_000_000 }, result: 2001.25 }) });
    await expect(adapter.fetchQuote('XCUUSD')).resolves.toMatchObject({ provider: 'metalprice-api', providerInstrument: 'XCU', priceType: 'REFERENCE', price: '2001.25' });
  });

  it('normalizes Alpha Vantage stock and FX daily responses', async () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    const adapter = new AlphaVantageMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ 'Global Quote': { '05. price': '190.25', '07. latest trading day': '2026-08-14' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ 'Time Series FX (Daily)': { '2026-08-14': { '2. high': '1.09', '3. low': '1.08', '4. close': '1.08765' } } }) });
    await expect(adapter.fetchQuote('AAPLUSDT')).resolves.toMatchObject({ provider: 'alpha-vantage', providerInstrument: 'AAPL', priceType: 'LAST', price: '190.25' });
    await expect(adapter.fetchQuote('EURUSD')).resolves.toMatchObject({ provider: 'alpha-vantage', providerInstrument: 'EUR/USD', priceType: 'CANDLE_CLOSE', price: '1.08765' });
  });

  it('keeps unsupported Alpha Vantage metals unavailable', async () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    const adapter = new AlphaVantageMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    await expect(adapter.fetchQuote('XZNUSD')).resolves.toBeNull();
  });

  it('normalizes keyless daily FX and precious-metal reference rates', async () => {
    process.env.MARKET_PROVIDER_NAME = 'fawaz-currency';
    const adapter = new FawazCurrencyMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ date: '2026-08-17', usd: { eur: 0.92, xau: 0.0005 } }) });
    const fx = await adapter.fetchQuote('EURUSD') as { provider: string; providerInstrument: string; priceType: string; price: string };
    expect(fx).toMatchObject({ provider: 'fawaz-currency', providerInstrument: 'EUR', priceType: 'REFERENCE' });
    expect(Number(fx.price)).toBeCloseTo(1 / 0.92, 8);
    const metal = await adapter.fetchQuote('XAUUSD') as { provider: string; providerInstrument: string; priceType: string; price: string };
    expect(metal).toMatchObject({ provider: 'fawaz-currency', providerInstrument: 'XAU', priceType: 'REFERENCE' });
    expect(Number(metal.price)).toBeCloseTo(2000, 8);
  });

  it('normalizes keyless industrial-metal reference snapshots with unit provenance', async () => {
    process.env.MARKET_PROVIDER_NAME = 'rzzro-industrial-metals';
    const adapter = new RzzroIndustrialMetalsMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({
      last_updated: '2026-08-17T10:00:00.000Z', unit: 'per metric ton',
      commodities: { copper: { price: 14200, change_pct: 0.47, exchange: 'LME', contract: '3M' } },
    }) });
    await expect(adapter.fetchQuote('XCUUSD')).resolves.toMatchObject({ provider: 'rzzro-industrial-metals', providerInstrument: 'LME:COPPER:3M', source: 'rest:daily-reference:per metric ton', priceType: 'REFERENCE', price: '14200' });
  });

  it.each([
    ['okx', OkxMarketAdapter, { data: [{ last: '190.25', volCcy24h: '1000', ts: '1700000000000' }] }, 'AAPL-USDT-SWAP', '190.25', 'LAST'],
    ['bitget', BitgetMarketAdapter, { data: [{ lastPr: '190.25', indexPrice: '190.20', markPrice: '190.22', ts: '1700000000000' }] }, 'AAPLUSDT', '190.20'],
    ['htx', HtxMarketAdapter, { tick: { close: 190.25, vol: 1000 }, ts: 1700000000000 }, 'AAPL-USDT', '190.25', 'LAST'],
    ['bybit', BybitMarketAdapter, { time: '1700000000000', result: { list: [{ lastPrice: '190.25', indexPrice: '190.20', markPrice: '190.22' }] } }, 'AAPLUSDT', '190.20'],
    ['gate', GateMarketAdapter, { data: { last_price: '190.25', price_change: '1.2', highest_price: '191', lowest_price: '188' } }, 'AAPL', '190.25', 'REFERENCE'],
  ])('normalizes %s public reference ticker without making it settlement truth', async (_provider, Adapter, body, instrument, price, priceType = 'REFERENCE') => {
    const adapter = new Adapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => body });
    await expect(adapter.fetchQuote('AAPLUSDT')).resolves.toMatchObject({ providerInstrument: instrument, priceType, price });
    if (_provider === 'gate') expect((global.fetch as jest.Mock).mock.calls[0][0].toString()).toContain('/api/v4/tradfi/symbols/AAPL/tickers');
  });
});
