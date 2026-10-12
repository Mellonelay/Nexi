import { jest } from '@jest/globals';
import { MarketAssetMetadataService } from '../../src/market/market-asset-metadata.service';
import { CANONICAL_MARKET_CATALOG } from '../../src/market/market-catalog';
import { STOCK_ISSUER_PROFILES } from '../../src/market/market-asset-profile-catalog';

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

describe('MarketAssetMetadataService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('routes metadata by canonical category to the approved provider adapters', async () => {
    const requested: string[] = [];
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      requested.push(`${url.hostname}${url.pathname}`);
      if (url.hostname === 'api.coingecko.com') {
        return response({ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', description: { en: '' } });
      }
      if (url.hostname === 'api.gateio.ws') return response({ data: { list: [] } });
      return response({ description: 'reference metadata' });
    });
    const service = new MarketAssetMetadataService();

    await Promise.all([
      service.getProfile({ symbol: 'BTCUSDT', category: 'crypto' }),
      service.getProfile({ symbol: 'AAPLUSDT', category: 'stock' }),
      service.getProfile({ symbol: 'EURUSD', category: 'forex' }),
      service.getProfile({ symbol: 'XAUUSD', category: 'metal' }),
    ]);

    expect(requested).toEqual(expect.arrayContaining([
      'api.coingecko.com/api/v3/coins/bitcoin',
      'api.gateio.ws/api/v4/stock/symbols/detail',
      'biquote.io/api/EURUSD',
      'biquote.io/api/XAUUSD',
    ]));
  });

  it('combines a Gate stock identity with the issuer profile without exposing quote metrics', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(response({
      data: {
        list: [{
          symbol: 'AAPL',
          exchange: 'us',
          exchange_desc: 'US Stocks',
          quote_currency: 'USD',
          symbol_desc: 'Apple Inc.',
          category: 'CS',
          asset_type: 'STOCK',
        }],
      },
    }));
    const service = new MarketAssetMetadataService();

    const profile = await service.getProfile({ symbol: 'AAPLUSDT', category: 'stock', displayName: 'Apple' });
    await service.getProfile({ symbol: 'AAPLUSDT', category: 'stock', displayName: 'Apple' });

    expect(profile.companyName).toBe('Apple Inc.');
    expect(profile.companyOverview).toContain('smartphones');
    expect(profile.exchange).toBe('US Stocks');
    expect(profile.officialWebsite).toBe('https://www.apple.com/');
    expect(profile.provenance).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'Gate.io' }),
      expect.objectContaining({ provider: 'Issuer' }),
    ]));
    expect(profile.marketCap).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects metadata-provider base URLs outside the HTTPS host allowlist', async () => {
    const previous = process.env.COINGECKO_API_BASE_URL;
    process.env.COINGECKO_API_BASE_URL = 'https://metadata-attacker.example';
    const fetch = jest.spyOn(globalThis, 'fetch');
    try {
      const profile = await new MarketAssetMetadataService().getProfile({ symbol: 'BTCUSDT', category: 'crypto' });
      expect(profile.status).toBe('PARTIAL');
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.COINGECKO_API_BASE_URL;
      else process.env.COINGECKO_API_BASE_URL = previous;
    }
  });

  it('uses CoinGecko descriptive data and selected reference stats without its live price or image', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response({
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'btc',
      description: { en: '<p>A peer-to-peer digital currency.</p>' },
      categories: ['Cryptocurrency'],
      links: { homepage: ['https://bitcoin.org/'], blockchain_site: ['https://blockchain.com/explorer'] },
      genesis_date: '2009-01-03',
      image: { large: 'https://provider.example/bitcoin.png' },
      market_data: {
        current_price: { usd: 12345 },
        market_cap: { usd: 2000000000 },
        market_cap_rank: 1,
        circulating_supply: 19000000,
        max_supply: 21000000,
      },
    }));
    const service = new MarketAssetMetadataService();

    const profile = await service.getProfile({ symbol: 'BTCUSDT', category: 'crypto', displayName: 'Bitcoin' });

    expect(profile.projectName).toBe('Bitcoin');
    expect(profile.description).toBe('A peer-to-peer digital currency.');
    expect(profile.officialWebsite).toBe('https://bitcoin.org/');
    expect(profile.launchDate).toBe('2009-01-03');
    expect(profile.marketStats).toEqual({
      marketCapUsd: 2000000000,
      marketCapRank: 1,
      circulatingSupply: 19000000,
      maxSupply: 21000000,
    });
    expect(JSON.stringify(profile)).not.toContain('12345');
    expect(JSON.stringify(profile)).not.toContain('provider.example');
  });

  it('normalizes Biquote forex and metal profiles without returning quote values', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const symbol = new URL(String(input)).pathname.split('/').pop() ?? '';
      return response({
        symbol,
        description: symbol === 'XAUUSD' ? 'Gold vs US Dollar' : 'Euro / US Dollar',
        source: 'MetaTrader 5 (Broker 1)',
        timestamp: '2026-10-09T20:57:37Z',
        marketState: 'closed',
        contractSize: 100,
        unit: 'oz',
        digits: 2,
        bid: 1234.5,
        ask: 1235.5,
      });
    });
    const service = new MarketAssetMetadataService();

    const forex = await service.getProfile({ symbol: 'EURUSD', category: 'forex', displayName: 'EUR/USD' });
    const metal = await service.getProfile({ symbol: 'XAUUSD', category: 'metal', displayName: 'Gold' });

    expect(forex.baseCurrency).toBe('EUR');
    expect(forex.quoteCurrency).toBe('USD');
    expect(forex.marketSessionState).toBe('CLOSED');
    expect(metal.instrumentDescription).toBe('Gold vs US Dollar');
    expect(metal.marketSessionState).toBe('CLOSED');
    expect(metal.specification).toMatchObject({ unit: 'oz', pricePrecision: 2, contractSize: 100 });
    expect(JSON.stringify([forex, metal])).not.toContain('1234.5');
    expect(JSON.stringify([forex, metal])).not.toContain('1235.5');
  });

  it('keeps usable category-specific identities for all 53 assets when metadata providers are unavailable', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('provider unavailable'));
    const service = new MarketAssetMetadataService();
    const profiles = await Promise.all(CANONICAL_MARKET_CATALOG.map((asset) => service.getProfile({ ...asset })));

    expect(profiles).toHaveLength(53);
    expect(profiles.every((profile) => profile.status === 'PARTIAL')).toBe(true);
    expect(profiles.filter((profile) => profile.category === 'crypto').every((profile) => Boolean(profile.projectName))).toBe(true);
    expect(profiles.filter((profile) => profile.category === 'stock').every((profile) => Boolean(profile.companyOverview))).toBe(true);
    expect(profiles.filter((profile) => profile.category === 'forex').every((profile) => Boolean(profile.baseCurrency && profile.quoteCurrency))).toBe(true);
    expect(profiles.filter((profile) => profile.category === 'metal').every((profile) => Boolean(profile.metalCode && profile.quoteCurrency === 'USD'))).toBe(true);
    expect(Object.keys(STOCK_ISSUER_PROFILES)).toHaveLength(20);
  });
});
