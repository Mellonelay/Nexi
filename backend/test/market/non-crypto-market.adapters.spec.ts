import { MetalsApiMarketAdapter } from '../../src/market/metals-api-market.adapter';
import { MetalpriceApiMarketAdapter } from '../../src/market/metalprice-api-market.adapter';
import { OandaMarketAdapter } from '../../src/market/oanda-market.adapter';
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

  it('normalizes Yahoo daily chart data as a non-settlement reference quote', async () => {
    const adapter = new YahooMarketAdapter() as unknown as { fetchQuote: (symbol: string) => Promise<unknown> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({
      chart: { result: [{ timestamp: [1_700_000_000], indicators: { quote: [{ close: [52.36], high: [53], low: [51], volume: [1000] }] } }] },
    }) });
    await expect(adapter.fetchQuote('XZNUSD')).resolves.toMatchObject({
      provider: 'yahoo', providerInstrument: 'ZNC=F', priceType: 'CANDLE_CLOSE', price: '52.36', source: 'rest:chart:1d',
    });
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

  it('normalizes Gate stock candlesticks for the shared Kline contract', async () => {
    const adapter = new GateMarketAdapter() as unknown as { fetchHistory: (symbol: string, interval: string, limit: number) => Promise<any[]> };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [
      ['1700000000', '100', '110', '95', '105', '42'],
    ] });
    await expect(adapter.fetchHistory('AXPUSDT', '1h', 40)).resolves.toMatchObject([
      { symbol: 'AXPUSDT', interval: '1h', provider: 'gate', source: 'gate:rest:stock-candlesticks', open: '100', high: '110', low: '95', close: '105', volume: '42' },
    ]);
    expect((global.fetch as jest.Mock).mock.calls[0][0].toString()).toContain('/api/v4/stock/candlesticks');
  });

  it('normalizes Yahoo chart history and aggregates 4h candles', async () => {
    const adapter = new YahooMarketAdapter() as unknown as { fetchHistory: (symbol: string, interval: string, limit: number) => Promise<any[]> };
    const timestamps = [1700006400, 1700010000, 1700013600, 1700017200];
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({
      chart: { result: [{ timestamp: timestamps, indicators: { quote: [{
        open: [10, 11, 12, 13], high: [11, 12, 13, 14], low: [9, 10, 11, 12], close: [10.5, 11.5, 12.5, 13.5], volume: [1, 2, 3, 4],
      }] } }] },
    }) });
    await expect(adapter.fetchHistory('XZNUSD', '4h', 40)).resolves.toMatchObject([
      { symbol: 'XZNUSD', interval: '4h', provider: 'yahoo', open: '10', high: '14', low: '9', close: '13.5', volume: '10' },
    ]);
    expect((global.fetch as jest.Mock).mock.calls[0][0].toString()).toContain('/v8/finance/chart/ZNC%3DF');
  });
});
