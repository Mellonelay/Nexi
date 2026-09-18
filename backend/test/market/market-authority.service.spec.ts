import { jest } from "@jest/globals";
// The D1 service imports the remote adapter, which is outside this unit's
// boundary and ships as ESM. Its behavior is represented by the local fixture
// below instead.
jest.unstable_mockModule("../../src/d1/d1-prisma.service", () => ({
  D1PrismaService: class D1PrismaService {},
}));

const { MarketAuthorityService } = await import("../../src/market/market-authority.service");
import {
  CANONICAL_MARKET_CATALOG,
  CANONICAL_MARKET_CATALOG_COUNT,
} from "../../src/market/market-catalog";

describe("MarketAuthorityService", () => {
  const createService = () => {
    const latest = new Map<string, any>();
    const pairs = [
      ...CANONICAL_MARKET_CATALOG.map(({ symbol }) => ({
        symbol,
        latest: latest.get(`pair-${symbol}`) ?? null,
        status: "ACTIVE",
      })),
      {
        symbol: "G2MSHOK9CJ0H0BG2MSHOK9CJ0H0U",
        latest: null,
        status: "ACTIVE",
      },
    ];
    const prisma: any = {
      $transaction: async (callback: any) => callback(prisma),
      marketAsset: {
        upsert: jest.fn(async ({ where }: any) => ({
          id: `asset-${where.symbol}`,
          symbol: where.symbol,
        })),
      },
      marketAssetCapability: {
        upsert: jest.fn(async ({ create }: any) => create),
      },
      marketPair: {
        upsert: jest.fn(async ({ where }: any) => ({
          id: `pair-${where.symbol}`,
          symbol: where.symbol,
        })),
        findMany: jest.fn(async ({ where }: any) =>
          pairs.filter((pair) => where.symbol.in.includes(pair.symbol)),
        ),
      },
      marketQuoteLatest: {
        findUnique: jest.fn(
          async ({ where }: any) => latest.get(where.pairId) ?? null,
        ),
        findFirst: jest.fn(async () => latest.get("pair-BTCUSDT") ?? null),
        upsert: jest.fn(async ({ where, create, update }: any) => {
          const value = { ...create, ...update };
          latest.set(where.pairId, value);
          return value;
        }),
      },
      marketQuoteSnapshot: { create: jest.fn(async ({ data }: any) => data) },
      marketProviderConfig: {
        upsert: jest.fn(async ({ create, update }: any) => ({
          ...create,
          ...update,
        })),
      },
      marketProviderSymbol: {
        upsert: jest.fn(async ({ create, update }: any) => ({
          ...create,
          ...update,
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    // The production authority chooses D1 before the legacy Prisma adapter.
    // Keep this fixture on that path so its persistence assertions exercise the
    // D1 serialization boundary (decimal/sequence strings and JSON raw data).
    const d1: any = {
      ...prisma,
      isEnabled: jest.fn().mockReturnValue(true),
      marketKline: { findMany: jest.fn().mockResolvedValue([]) },
    };
    d1.atomicBatch = jest.fn(async (statements: any[]) => {
      const latestParams = statements[0]?.params ?? [];
      const pairId = latestParams[1];
      const observedAt = new Date(latestParams[10]);
      const current = latest.get(pairId);
      if (current?.observedAt && observedAt.getTime() < new Date(current.observedAt).getTime()) {
        return [
          { success: true, results: [], meta: { changes: 0 } },
          { success: true, results: [], meta: { changes: 0 } },
        ];
      }
      const sequence = (BigInt(current?.sequence ?? 0) + 1n).toString();
      const value = {
        id: latestParams[0],
        pairId,
        symbol: latestParams[2],
        provider: latestParams[3],
        source: latestParams[4],
        sequence,
        price: latestParams[5],
        change24h: latestParams[6],
        volume24h: latestParams[7],
        high24h: latestParams[8],
        low24h: latestParams[9],
        observedAt,
        receivedAt: new Date(latestParams[11]),
        bid: latestParams[12],
        ask: latestParams[13],
        spread: latestParams[14],
        state: "LIVE",
      };
      // Update the canonical latest row before the awaited snapshot mock so a
      // concurrent test invocation observes the serialized D1 sequence.
      latest.set(pairId, value);
      const snapshotParams = statements[1]?.params ?? [];
      await prisma.marketQuoteSnapshot.create({
        data: {
          id: snapshotParams[0],
          ...value,
          rawData: snapshotParams[1],
        },
      });
      return [
        { success: true, results: [{ sequence }], meta: { changes: 1 } },
        { success: true, results: [], meta: { changes: 1 } },
      ];
    });
    const providerRouter = {
      isProviderEnabled: jest.fn().mockReturnValue(true),
    };
    const redis = {
      isAvailable: jest.fn().mockReturnValue(true),
      publish: jest.fn().mockResolvedValue(1),
    };
    return {
      service: new MarketAuthorityService(
        redis as any,
        d1,
        providerRouter as any,
      ),
      prisma,
      d1,
      providerRouter,
      redis,
    };
  };

  it("persists exact normalized quote data and publishes one ordered event", async () => {
    const { service, d1, redis } = createService();
    const result = await service.ingestQuote({
      symbol: "BTC/USDT",
      provider: "deterministic-test",
      source: "fixture",
      price: "12345.670000000000000001",
      change24h: "-1.25",
      volume24h: "10.5",
      bid: "12345.5",
      ask: "12345.8",
      spread: "0.3",
      sequence: 7,
      observedAt: new Date("2026-08-02T00:00:00.000Z"),
    });
    expect(result.accepted).toBe(true);
    const snapshotData = d1.marketQuoteSnapshot.create.mock.calls[0][0].data;
    expect(snapshotData.sequence).toBe("7");
    expect(snapshotData.price).toBe("12345.670000000000000001");
    expect(snapshotData.bid.toString()).toBe("12345.5");
    expect(snapshotData.ask.toString()).toBe("12345.8");
    expect(snapshotData.spread.toString()).toBe("0.3");
    expect(JSON.parse(snapshotData.rawData)._nexi).toMatchObject({
      providerInstrument: "BTCUSDT",
      priceType: "LAST",
      canonicalAssetId: "crypto:btc",
    });
    expect(redis.publish).toHaveBeenCalledTimes(1);
    expect(JSON.parse(redis.publish.mock.calls[0][1]).sequence).toBe("7");
    expect(JSON.parse(redis.publish.mock.calls[0][1]).quote).toMatchObject({
      providerInstrument: "BTCUSDT",
      priceType: "LAST",
      canonicalAssetId: "crypto:btc",
      bid: "12345.5",
      ask: "12345.8",
      spread: "0.3",
    });
  });

  it("serializes concurrent production quote writes per canonical symbol", async () => {
    const { service, d1 } = createService();
    const seen = new Set<string>();
    d1.marketQuoteSnapshot.create.mockImplementation(async ({ data }: any) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const key = `${data.pairId}:${data.sequence}`;
      if (seen.has(key)) throw new Error("UNIQUE constraint failed: MarketQuoteSnapshot.pairId, MarketQuoteSnapshot.sequence");
      seen.add(key);
      return data;
    });

    const observedAt = new Date("2026-09-13T01:33:29.000Z");
    const [first, second] = await Promise.all([
      service.ingestQuote({ symbol: "BTCUSDT", provider: "binance-spot", source: "websocket", price: "100", observedAt }),
      service.ingestQuote({ symbol: "BTCUSDT", provider: "binance-spot", source: "websocket", price: "101", observedAt }),
    ]);

    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    expect(d1.marketQuoteSnapshot.create.mock.calls.map(([args]: any[]) => args.data.sequence)).toEqual(["1", "2"]);
  });

  it("rejects duplicate or out-of-order provider sequences without a second snapshot", async () => {
    const { service, d1 } = createService();
    await service.ingestQuote({
      symbol: "BTCUSDT",
      provider: "test",
      source: "fixture",
      price: "10",
      sequence: 2,
      observedAt: new Date(),
    });
    const duplicate = await service.ingestQuote({
      symbol: "BTCUSDT",
      provider: "test",
      source: "fixture",
      price: "11",
      sequence: 2,
      observedAt: new Date(),
    });
    expect(duplicate).toEqual({
      accepted: false,
      reason: "DUPLICATE_OR_STALE",
    });
    expect(d1.marketQuoteSnapshot.create).toHaveBeenCalledTimes(1);
  });

  it("splits catalog forex pairs using their canonical provider symbol", async () => {
    const { service, d1 } = createService();
    await expect(service.ensureCatalog(["USDCNH"])).resolves.toBeUndefined();
    expect(d1.marketPair.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { symbol: "USDCNH" },
        create: expect.objectContaining({
          baseAssetId: "asset-USD",
          quoteAssetId: "asset-CNH",
        }),
      }),
    );
  });

  it("keeps GET prices read-only, canonical-only, and limited to 53 pairs", async () => {
    const { service, d1 } = createService();

    const result = await service.getPrices();

    expect(CANONICAL_MARKET_CATALOG_COUNT).toBe(53);
    expect(result).toHaveLength(53);
    expect(result.some((row) => String(row.symbol).startsWith("G2MSHO"))).toBe(
      false,
    );
    expect(d1.marketAsset.upsert).not.toHaveBeenCalled();
    expect(d1.marketAssetCapability.upsert).not.toHaveBeenCalled();
    expect(d1.marketPair.upsert).not.toHaveBeenCalled();
    expect(d1.marketPair.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "ACTIVE",
          symbol: { in: CANONICAL_MARKET_CATALOG.map(({ symbol }) => symbol) },
        },
      }),
    );
  });

  it("reconciles D1 provider mappings for every canonical pair", async () => {
    const { service, d1 } = createService();

    await service.ensureCatalog();

    expect(d1.marketProviderConfig.upsert).toHaveBeenCalledTimes(5);
    const mappingCalls = d1.marketProviderSymbol.upsert.mock.calls.map(
      ([args]: any[]) => args,
    );
    const mappingKeys = new Set(
      mappingCalls.map(
        (args: any) => `${args.create.providerId}:${args.create.pairId}`,
      ),
    );
    expect(mappingKeys.size).toBe(mappingCalls.length);
    expect(
      mappingCalls.filter(
        (args: any) => args.create.providerId === "provider-binance-spot",
      ),
    ).toHaveLength(17);
    expect(
      mappingCalls.some(
        (args: any) =>
          args.create.providerId === "provider-gate" &&
          args.create.pairId === "pair-AXPUSDT" &&
          JSON.parse(args.create.capabilityPolicy).kline === true,
      ),
    ).toBe(true);
    expect(
      mappingCalls.some(
        (args: any) =>
          args.create.providerId === "provider-yahoo" &&
          args.create.pairId === "pair-DISUSDT" &&
          JSON.parse(args.create.capabilityPolicy).kline === true,
      ),
    ).toBe(true);
    expect(
      mappingCalls.some(
        (args: any) =>
          args.create.providerId === "provider-yahoo" &&
          args.create.pairId === "pair-UBERUSDT" &&
          JSON.parse(args.create.capabilityPolicy).kline === true,
      ),
    ).toBe(true);
    expect(
      mappingCalls.some(
        (args: any) =>
          args.create.providerId === "provider-yahoo" &&
          args.create.pairId === "pair-SONYUSDT" &&
          JSON.parse(args.create.capabilityPolicy).kline === true,
      ),
    ).toBe(true);
    expect(
      mappingCalls.some(
        (args: any) =>
          args.create.providerId === "provider-moex" &&
          args.create.pairId === "pair-USDRUB" &&
          JSON.parse(args.create.capabilityPolicy).kline === true,
      ),
    ).toBe(true);
    expect(d1.marketProviderSymbol.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { providerId: "provider-biquote", pairId: "pair-USDRUB" },
        data: expect.objectContaining({ enabled: false }),
      }),
    );
  });

  it("stores asset-level provider symbols without pair-specific USD overwrites", async () => {
    const { service, d1 } = createService();

    await service.ensureCatalog(["EURUSD", "USDCNH", "USDRUB"]);

    const usdUpserts = d1.marketAsset.upsert.mock.calls
      .filter(([args]: any[]) => args.where.symbol === "USD")
      .map(([args]: any[]) => args);
    expect(usdUpserts.length).toBeGreaterThan(0);
    expect(
      usdUpserts.every((args: any) => args.update.providerSymbol === "USD"),
    ).toBe(true);
    expect(
      usdUpserts.some((args: any) =>
        String(args.update.providerSymbol).includes("/"),
      ),
    ).toBe(false);
  });

  it("normalizes stock display symbols to the canonical backend pair", async () => {
    const { service, d1 } = createService();
    await service.ingestQuote({
      symbol: "AAPL.US/USDT",
      provider: "biquote",
      source: "websocket",
      price: "100",
      observedAt: new Date(),
    });
    expect(d1.marketPair.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { symbol: "AAPLUSDT" } }),
    );
  });
});
