import { MarketAuthorityService } from '../../src/market/market-authority.service';
import { CANONICAL_MARKET_CATALOG, CANONICAL_MARKET_CATALOG_COUNT } from '../../src/market/market-catalog';

describe('MarketAuthorityService', () => {
  const createService = () => {
    const latest = new Map<string, any>();
    const pairs = [
      ...CANONICAL_MARKET_CATALOG.map(({ symbol }) => ({ symbol, latest: latest.get(`pair-${symbol}`) ?? null, status: 'ACTIVE' })),
      { symbol: 'G2MSHOK9CJ0H0BG2MSHOK9CJ0H0U', latest: null, status: 'ACTIVE' },
    ];
    const prisma: any = {
      $transaction: async (callback: any) => callback(prisma),
      marketAsset: {
        upsert: jest.fn(async ({ where }: any) => ({ id: `asset-${where.symbol}`, symbol: where.symbol })),
      },
      marketAssetCapability: {
        upsert: jest.fn(async ({ create }: any) => create),
      },
      marketPair: {
        upsert: jest.fn(async ({ where }: any) => ({ id: `pair-${where.symbol}`, symbol: where.symbol })),
        findMany: jest.fn(async ({ where }: any) => pairs.filter((pair) => where.symbol.in.includes(pair.symbol))),
      },
      marketQuoteLatest: {
        findUnique: jest.fn(async ({ where }: any) => latest.get(where.pairId) ?? null),
        findFirst: jest.fn(async () => latest.get('pair-BTCUSDT') ?? null),
        upsert: jest.fn(async ({ where, create, update }: any) => {
          const value = { ...create, ...update };
          latest.set(where.pairId, value);
          return value;
        }),
      },
      marketQuoteSnapshot: { create: jest.fn(async ({ data }: any) => data) },
    };
    const redis = { isAvailable: jest.fn().mockReturnValue(true), publish: jest.fn().mockResolvedValue(1) };
    return { service: new MarketAuthorityService(prisma, redis as any), prisma, redis };
  };

  it('persists exact normalized quote data and publishes one ordered event', async () => {
    const { service, prisma, redis } = createService();
    const result = await service.ingestQuote({
      symbol: 'BTC/USDT',
      provider: 'deterministic-test',
      source: 'fixture',
      price: '12345.670000000000000001',
      change24h: '-1.25',
      volume24h: '10.5',
      sequence: 7,
      observedAt: new Date('2026-08-02T00:00:00.000Z'),
    });
    expect(result.accepted).toBe(true);
    const snapshotData = prisma.marketQuoteSnapshot.create.mock.calls[0][0].data;
    expect(snapshotData.sequence).toBe(7n);
    expect(snapshotData.price.toString()).toBe('12345.670000000000000001');
    expect(snapshotData.rawData._nexi).toMatchObject({ providerInstrument: 'BTCUSDT', priceType: 'LAST', canonicalAssetId: 'crypto:btc' });
    expect(redis.publish).toHaveBeenCalledTimes(1);
    expect(JSON.parse(redis.publish.mock.calls[0][1]).sequence).toBe('7');
    expect(JSON.parse(redis.publish.mock.calls[0][1]).quote).toMatchObject({ providerInstrument: 'BTCUSDT', priceType: 'LAST', canonicalAssetId: 'crypto:btc' });
  });

  it('rejects duplicate or out-of-order provider sequences without a second snapshot', async () => {
    const { service, prisma } = createService();
    await service.ingestQuote({ symbol: 'BTCUSDT', provider: 'test', source: 'fixture', price: '10', sequence: 2, observedAt: new Date() });
    const duplicate = await service.ingestQuote({ symbol: 'BTCUSDT', provider: 'test', source: 'fixture', price: '11', sequence: 2, observedAt: new Date() });
    expect(duplicate).toEqual({ accepted: false, reason: 'DUPLICATE_OR_STALE' });
    expect(prisma.marketQuoteSnapshot.create).toHaveBeenCalledTimes(1);
  });

  it('splits catalog forex pairs using their canonical provider symbol', async () => {
    const { service, prisma } = createService();
    await expect(service.ensureCatalog(['USDCNH'])).resolves.toBeUndefined();
    expect(prisma.marketPair.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { symbol: 'USDCNH' },
      create: expect.objectContaining({ baseAssetId: 'asset-USD', quoteAssetId: 'asset-CNH' }),
    }));
  });

  it('keeps GET prices read-only, canonical-only, and limited to 53 pairs', async () => {
    const { service, prisma } = createService();

    const result = await service.getPrices();

    expect(CANONICAL_MARKET_CATALOG_COUNT).toBe(53);
    expect(result).toHaveLength(53);
    expect(result.some((row) => String(row.symbol).startsWith('G2MSHO'))).toBe(false);
    expect(prisma.marketAsset.upsert).not.toHaveBeenCalled();
    expect(prisma.marketAssetCapability.upsert).not.toHaveBeenCalled();
    expect(prisma.marketPair.upsert).not.toHaveBeenCalled();
    expect(prisma.marketPair.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: 'ACTIVE',
        symbol: { in: CANONICAL_MARKET_CATALOG.map(({ symbol }) => symbol) },
      },
    }));
  });

  it('stores asset-level provider symbols without pair-specific USD overwrites', async () => {
    const { service, prisma } = createService();

    await service.ensureCatalog(['EURUSD', 'USDCNH', 'USDRUB']);

    const usdUpserts = prisma.marketAsset.upsert.mock.calls
      .filter(([args]: any[]) => args.where.symbol === 'USD')
      .map(([args]: any[]) => args);
    expect(usdUpserts.length).toBeGreaterThan(0);
    expect(usdUpserts.every((args: any) => args.update.providerSymbol === 'USD')).toBe(true);
    expect(usdUpserts.some((args: any) => String(args.update.providerSymbol).includes('/'))).toBe(false);
  });

  it('normalizes stock display symbols to the canonical backend pair', async () => {
    const { service, prisma } = createService();
    await service.ingestQuote({ symbol: 'AAPL.US/USDT', provider: 'massive', source: 'websocket', price: '100', observedAt: new Date() });
    expect(prisma.marketPair.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { symbol: 'AAPLUSDT' } }));
  });
});
