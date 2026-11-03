import { jest } from "@jest/globals";
jest.unstable_mockModule("../../src/d1/d1-prisma.service", () => ({
  D1PrismaService: class D1PrismaService {},
}));

const { MarketKlineService } =
  await import("../../src/market/market-kline.service");

describe("MarketKlineService quote aggregation", () => {
  const createService = (d1Enabled = false) => {
    const rows = new Map<string, any>();
    const keyFor = (where: any) => {
      const key = where.pairId_interval_openTime;
      return `${key.pairId}:${key.interval}:${key.openTime.toISOString()}`;
    };
    const prisma: any = {
      isEnabled: jest.fn().mockReturnValue(d1Enabled),
      marketPair: {
        findUnique: jest.fn(async () => ({
          id: "pair-btcusdt",
          symbol: "BTCUSDT",
        })),
      },
      marketKline: {
        findUnique: jest.fn(
          async ({ where }: any) => rows.get(keyFor(where)) ?? null,
        ),
        create: jest.fn(async ({ data }: any) => {
          const row = {
            id: "kline-1",
            ...data,
            receivedAt: new Date("2026-08-10T00:00:00.000Z"),
          };
          rows.set(
            `${data.pairId}:${data.interval}:${data.openTime.toISOString()}`,
            row,
          );
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = [...rows.values()].find((value) => value.id === where.id);
          const next = { ...row, ...data };
          rows.set(
            `${next.pairId}:${next.interval}:${next.openTime.toISOString()}`,
            next,
          );
          return next;
        }),
      },
    };
    return { service: new MarketKlineService(prisma), prisma };
  };

  it("reuses one indexed daily candle read across all six derived intervals", async () => {
    const candle = (minute: number, price: string) => ({
      openTime: new Date(
        `2026-10-10T12:${String(minute).padStart(2, "0")}:00.000Z`,
      ),
      closeTime: new Date(
        `2026-10-10T12:${String(minute).padStart(2, "0")}:59.999Z`,
      ),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: "1",
      provider: "binance-spot",
      source: "websocket:kline",
      observedAt: new Date(
        `2026-10-10T12:${String(minute).padStart(2, "0")}:59.999Z`,
      ),
    });
    const rows = [
      candle(34, "110"),
      candle(32, "105"),
      candle(30, "100"),
      candle(33, "108"),
      candle(31, "103"),
      candle(35, "120"),
    ];
    const d1: any = {
      marketPair: {
        findUnique: jest.fn(async () => ({
          id: "pair-btcusdt",
          symbol: "BTCUSDT",
        })),
      },
      marketKline: { findMany: jest.fn(async () => rows) },
    };
    const service = new MarketKlineService(d1);
    const persist = jest
      .spyOn(service, "persist")
      .mockImplementation(async (data: any) => data);
    const result = await service.aggregateFromOneMinute(
      "BTCUSDT",
      candle(34, "110").openTime,
    );
    expect(d1.marketKline.findMany).toHaveBeenCalledTimes(1);
    expect(d1.marketKline.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          pairId: "pair-btcusdt",
          interval: "1m",
          openTime: {
            gte: new Date("2026-10-10T00:00:00.000Z"),
            lt: new Date("2026-10-11T00:00:00.000Z"),
          },
        },
        orderBy: { openTime: "asc" },
      }),
    );
    expect(result.map((row: any) => row.interval)).toEqual([
      "5m",
      "15m",
      "30m",
    ]);
    const fiveMinute = persist.mock.calls.find(
      ([data]: any[]) => data.interval === "5m",
    )?.[0];
    expect(fiveMinute).toMatchObject({
      open: "100",
      high: "110",
      low: "100",
      close: "110",
      volume: "5",
    });
    expect(
      persist.mock.calls.some(([data]: any[]) => data.interval === "1d"),
    ).toBe(false);
  });

  it("rejects missing, duplicate and mixed-provider minutes", async () => {
    const make = (minute: number, provider = "binance-spot") => ({
      openTime: new Date(Date.UTC(2026, 9, 10, 12, minute)),
      closeTime: new Date(Date.UTC(2026, 9, 10, 12, minute, 59, 999)),
      open: "1",
      high: "1",
      low: "1",
      close: "1",
      volume: "1",
      provider,
      source: "websocket:kline",
      observedAt: new Date(Date.UTC(2026, 9, 10, 12, minute + 1)),
    });
    const rows = [make(30), make(32)];
    const db: any = {
      marketPair: { findUnique: jest.fn(async () => ({ id: "pair" })) },
      marketKline: { findMany: jest.fn(async () => rows) },
    };
    const service = new MarketKlineService(db);
    const persist = jest
      .spyOn(service, "persist")
      .mockImplementation(async (data: any) => data);
    await service.aggregateFromOneMinute("BTCUSDT", make(32).openTime);
    expect(persist).not.toHaveBeenCalled();
    rows.splice(1, 0, make(31), make(31));
    await service.aggregateFromOneMinute("BTCUSDT", make(32).openTime);
    expect(persist).not.toHaveBeenCalled();
    rows.splice(1, 2, make(31, "other"));
    await service.aggregateFromOneMinute("BTCUSDT", make(32).openTime);
    expect(persist).not.toHaveBeenCalled();
  });

  it("creates a 1m candle from a provider quote with explicit derived lineage and no fabricated volume", async () => {
    const { service, prisma } = createService();

    await (service as any).accumulateQuote({
      symbol: "BTC/USDT",
      price: "30000",
      provider: "provider-a",
      source: "websocket",
      observedAt: new Date("2026-08-10T12:34:56.789Z"),
    });

    const data = prisma.marketKline.create.mock.calls[0][0].data;
    expect(data.openTime.toISOString()).toBe("2026-08-10T12:34:00.000Z");
    expect(data.open.toString()).toBe("30000");
    expect(data.high.toString()).toBe("30000");
    expect(data.low.toString()).toBe("30000");
    expect(data.close.toString()).toBe("30000");
    expect(data.volume).toBeNull();
    expect(data.source).toBe("websocket:quote-aggregation");
  });

  it("updates the active candle high, low and close while preserving its first observed open", async () => {
    const { service, prisma } = createService();
    const observedAt = new Date("2026-08-10T12:34:00.000Z");

    await (service as any).accumulateQuote({
      symbol: "BTCUSDT",
      price: "30000",
      provider: "provider-a",
      source: "websocket",
      observedAt,
    });
    await (service as any).accumulateQuote({
      symbol: "BTCUSDT",
      price: "30120",
      provider: "provider-a",
      source: "websocket",
      observedAt: new Date("2026-08-10T12:34:30.000Z"),
    });
    const candle = await (service as any).accumulateQuote({
      symbol: "BTCUSDT",
      price: "29980",
      provider: "provider-a",
      source: "websocket",
      observedAt: new Date("2026-08-10T12:34:45.000Z"),
    });

    const data = prisma.marketKline.update.mock.calls.at(-1)[0].data;
    expect(candle.open.toString()).toBe("30000");
    expect(data.high.toString()).toBe("30120");
    expect(data.low.toString()).toBe("29980");
    expect(data.close.toString()).toBe("29980");
    expect(data.volume).toBeNull();
    expect(prisma.marketPair.findUnique).toHaveBeenCalledTimes(1);
  });

  it("writes string decimals through D1 and compares string-backed existing candles", async () => {
    const { service, prisma } = createService(true);
    const observedAt = new Date("2026-08-10T12:34:00.000Z");

    await (service as any).accumulateQuote({
      symbol: "BTCUSDT",
      price: "30000",
      provider: "provider-a",
      source: "websocket",
      observedAt,
    });
    await (service as any).accumulateQuote({
      symbol: "BTCUSDT",
      price: "30120",
      provider: "provider-a",
      source: "websocket",
      observedAt: new Date("2026-08-10T12:34:30.000Z"),
    });

    expect(prisma.marketKline.create.mock.calls[0][0].data.open).toBe("30000");
    expect(prisma.marketKline.update.mock.calls[0][0].data).toMatchObject({
      high: "30120",
      low: "30000",
      close: "30120",
    });
  });

  it("limits the newest candles and returns them in ascending chart order", async () => {
    const rows = [
      {
        openTime: new Date("2026-08-17T12:02:00.000Z"),
        closeTime: new Date("2026-08-17T12:02:59.999Z"),
        open: "3",
        high: "4",
        low: "2",
        close: "3",
        volume: null,
        symbol: "BTCUSDT",
        interval: "1m",
        provider: "binance-spot",
        source: "websocket:kline",
        observedAt: new Date("2026-08-17T12:03:00.000Z"),
        receivedAt: new Date("2026-08-17T12:03:00.000Z"),
      },
      {
        openTime: new Date("2026-08-17T12:03:00.000Z"),
        closeTime: new Date("2026-08-17T12:03:59.999Z"),
        open: "4",
        high: "5",
        low: "3",
        close: "4",
        volume: null,
        symbol: "BTCUSDT",
        interval: "1m",
        provider: "binance-spot",
        source: "websocket:kline",
        observedAt: new Date("2026-08-17T12:04:00.000Z"),
        receivedAt: new Date("2026-08-17T12:04:00.000Z"),
      },
    ];
    const prisma: any = {
      isEnabled: jest.fn().mockReturnValue(false),
      marketPair: {
        findUnique: jest.fn(async () => ({
          id: "pair-btcusdt",
          symbol: "BTCUSDT",
        })),
      },
      marketKline: { findMany: jest.fn(async () => [...rows].reverse()) },
    };
    const service = new MarketKlineService(prisma);

    const candles = await service.list("BTCUSDT", "1m", 2);

    expect(prisma.marketKline.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { openTime: "desc" }, take: 2 }),
    );
    expect(candles.map((c) => c.close)).toEqual(["3", "4"]);
  });

  it("keeps provider candles authoritative over newer quote and derived revisions", async () => {
    const openTime = new Date("2026-10-10T12:30:00.000Z");
    const existing = {
      id: "native",
      pairId: "pair",
      symbol: "BTCUSDT",
      interval: "1m",
      openTime,
      closeTime: new Date("2026-10-10T12:30:59.999Z"),
      open: "1",
      high: "2",
      low: "1",
      close: "2",
      volume: null,
      provider: "binance-spot",
      source: "websocket:kline",
      observedAt: new Date("2026-10-10T12:31:00.000Z"),
      receivedAt: new Date("2026-10-10T12:31:00.001Z"),
    };
    const db: any = {
      isEnabled: () => false,
      marketPair: { findUnique: jest.fn(async () => ({ id: "pair" })) },
      marketKline: {
        findUnique: jest.fn(async () => existing),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = new MarketKlineService(db);
    const quote = await service.accumulateQuote({
      symbol: "BTCUSDT",
      price: "3",
      provider: "binance-spot",
      source: "websocket",
      observedAt: new Date("2026-10-10T12:30:59.500Z"),
    });
    const derived = await service.persist({
      symbol: "BTCUSDT",
      interval: "1m",
      openTime,
      closeTime: existing.closeTime,
      open: "1",
      high: "3",
      low: "1",
      close: "3",
      volume: null,
      provider: "binance-spot",
      source: "derived:1m-aggregation",
      observedAt: new Date("2026-10-10T12:31:30.000Z"),
    });
    expect(quote.source).toBe("websocket:kline");
    expect(derived.source).toBe("websocket:kline");
    expect(db.marketKline.update).not.toHaveBeenCalled();
    expect(db.marketKline.upsert).not.toHaveBeenCalled();
  });

  it("serializes concurrent revisions for the same candle so a slower stale upsert cannot win", async () => {
    const rows = new Map<string, any>();
    const openTime = new Date("2026-10-10T12:30:00.000Z");
    const key = "pair:1m:" + openTime.toISOString();
    const db: any = {
      isEnabled: () => false,
      marketPair: { findUnique: jest.fn(async () => ({ id: "pair" })) },
      marketKline: {
        findUnique: jest.fn(async () => rows.get(key) ?? null),
        upsert: jest.fn(async ({ create, update }: any) => {
          const delay =
            Number(
              create.observedAt?.getTime?.() ?? update.observedAt?.getTime?.(),
            ) === 1_000
              ? 20
              : 0;
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          const next = {
            ...(rows.get(key) ?? create),
            ...(rows.has(key) ? update : {}),
            id: "row",
            receivedAt: new Date(2_000),
          };
          rows.set(key, next);
          return next;
        }),
      },
    };
    const service = new MarketKlineService(db);
    const candle = (close: string, observedAt: number) => ({
      symbol: "BTCUSDT",
      interval: "1m",
      openTime,
      closeTime: new Date(60_999),
      open: "1",
      high: close,
      low: "1",
      close,
      volume: null,
      provider: "p",
      source: "websocket:kline",
      observedAt: new Date(observedAt),
    });
    await Promise.all([
      service.persist(candle("1", 1_000)),
      service.persist(candle("2", 2_000)),
    ]);
    expect(rows.get(key).close.toString()).toBe("2");
  });

  it("classifies derived higher candles as provisional until the interval close boundary", () => {
    const { service } = createService();
    const open = new Date("2026-09-14T12:30:00.000Z");
    expect(
      (service as any).isFinal(
        "5m",
        open,
        new Date("2026-09-14T12:32:59.999Z"),
      ),
    ).toBe(false);
    expect(
      (service as any).isFinal(
        "5m",
        open,
        new Date("2026-09-14T12:34:59.999Z"),
      ),
    ).toBe(true);
    expect(
      (service as any).isFinal(
        "1M",
        new Date("2026-09-01T00:00:00.000Z"),
        new Date("2026-09-30T23:59:59.999Z"),
      ),
    ).toBe(true);
  });

  it("aggregates finalized 1m candles into all canonical higher intervals from D1 authority", async () => {
    const oneMinuteRows = [
      {
        openTime: new Date("2026-09-14T12:30:00.000Z"),
        closeTime: new Date("2026-09-14T12:30:59.999Z"),
        open: "100",
        high: "105",
        low: "99",
        close: "104",
        volume: "1",
        symbol: "BTCUSDT",
        interval: "1m",
        provider: "binance-spot",
        source: "websocket:kline",
        observedAt: new Date("2026-09-14T12:31:00.010Z"),
        receivedAt: new Date("2026-09-14T12:31:00.020Z"),
      },
      {
        openTime: new Date("2026-09-14T12:31:00.000Z"),
        closeTime: new Date("2026-09-14T12:31:59.999Z"),
        open: "104",
        high: "110",
        low: "101",
        close: "102",
        volume: "2",
        symbol: "BTCUSDT",
        interval: "1m",
        provider: "binance-spot",
        source: "websocket:kline",
        observedAt: new Date("2026-09-14T12:32:00.010Z"),
        receivedAt: new Date("2026-09-14T12:32:00.020Z"),
      },
      {
        openTime: new Date("2026-09-14T12:32:00.000Z"),
        closeTime: new Date("2026-09-14T12:32:59.999Z"),
        open: "102",
        high: "108",
        low: "98",
        close: "107",
        volume: "3",
        symbol: "BTCUSDT",
        interval: "1m",
        provider: "binance-spot",
        source: "websocket:kline",
        observedAt: new Date("2026-09-14T12:33:00.010Z"),
        receivedAt: new Date("2026-09-14T12:33:00.020Z"),
      },
    ];
    const prisma: any = {
      isEnabled: jest.fn().mockReturnValue(false),
      marketPair: {
        findUnique: jest.fn(async () => ({
          id: "pair-btcusdt",
          symbol: "BTCUSDT",
        })),
      },
      marketKline: {
        findMany: jest.fn(async () => oneMinuteRows),
        findUnique: jest.fn(async () => null),
        upsert: jest.fn(async ({ create }: any) => ({
          id: `derived-${create.interval}`,
          ...create,
          receivedAt: new Date("2026-09-14T12:33:00.030Z"),
        })),
      },
    };
    const service = new MarketKlineService(prisma);

    const derived = await service.aggregateFromOneMinute(
      "BTCUSDT",
      new Date("2026-09-14T12:32:00.000Z"),
    );

    expect(derived.map((c) => c.interval)).toEqual(["5m", "15m", "30m"]);
    const fiveMinute = derived[0];
    expect(fiveMinute).toMatchObject({
      symbol: "BTCUSDT",
      interval: "5m",
      time: Date.parse("2026-09-14T12:30:00.000Z") / 1000,
      open: "100",
      high: "110",
      low: "98",
      close: "107",
      volume: "6",
      provider: "binance-spot",
      source: "derived:1m-aggregation",
      observedAt: "2026-09-14T12:33:00.010Z",
      isFinal: false,
    });
  });

  it("marks a higher interval final only after its complete contiguous minute bucket closes", async () => {
    const oneMinuteRows = Array.from({ length: 5 }, (_, index) => {
      const openTime = new Date(Date.parse("2026-09-14T12:30:00.000Z") + index * 60_000);
      const closeTime = new Date(openTime.getTime() + 59_999);
      return {
        openTime,
        closeTime,
        open: String(100 + index),
        high: String(101 + index),
        low: String(99 + index),
        close: String(100 + index),
        volume: "1",
        provider: "binance-spot",
        source: "websocket:kline",
        observedAt: new Date(closeTime.getTime() + 10),
      };
    });
    const prisma: any = {
      isEnabled: jest.fn().mockReturnValue(false),
      marketPair: { findUnique: jest.fn(async () => ({ id: "pair-btcusdt", symbol: "BTCUSDT" })) },
      marketKline: {
        findMany: jest.fn(async () => oneMinuteRows),
        findUnique: jest.fn(async () => null),
        upsert: jest.fn(async ({ create }: any) => ({
          id: `derived-${create.interval}`,
          ...create,
          receivedAt: new Date("2026-09-14T12:35:00.020Z"),
        })),
      },
    };
    const service = new MarketKlineService(prisma);

    const derived = await service.aggregateFromOneMinute(
      "BTCUSDT",
      new Date("2026-09-14T12:34:00.000Z"),
    );

    expect(derived.find((candle) => candle.interval === "5m")?.isFinal).toBe(true);
    expect(derived.find((candle) => candle.interval === "15m")?.isFinal).toBe(false);
  });
});
