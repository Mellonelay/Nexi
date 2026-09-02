import axios from "axios";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { D1PrismaService } from "../../src/d1/d1-prisma.service";
import { MarketKlineController } from "../../src/market/market-kline.controller";
import { MarketKlineService } from "../../src/market/market-kline.service";
import { MarketProviderRouterService } from "../../src/market/market-provider-router.service";
import { PrismaService } from "../../src/prisma/prisma.service";

type CandleRow = {
  id: string;
  pairId: string;
  symbol: string;
  interval: string;
  openTime: Date;
  closeTime: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  provider: string;
  source: string;
  observedAt: Date;
  receivedAt: Date;
};

/**
 * C2 proof harness: this is intentionally a small D1-shaped adapter, not a
 * service mock. The request crosses the real HTTP server, Nest route,
 * ValidationPipe, controller and MarketKlineService before reading back the
 * row persisted in the authoritative adapter.
 */
class D1MarketHarness {
  readonly pair = { id: "pair-btc-usdt", symbol: "BTCUSDT" };
  readonly rows: CandleRow[] = [];

  isEnabled() {
    return true;
  }

  marketPair = {
    findUnique: async ({ where }: { where: { symbol: string } }) =>
      where.symbol === this.pair.symbol ? this.pair : null,
  };

  marketKline = {
    findMany: async ({
      where,
    }: {
      where: { pairId: string; interval: string };
    }) =>
      this.rows
        .filter(
          (row) =>
            row.pairId === where.pairId && row.interval === where.interval,
        )
        .sort((a, b) => b.openTime.getTime() - a.openTime.getTime()),
    findUnique: async ({
      where,
    }: {
      where: {
        pairId_interval_openTime: {
          pairId: string;
          interval: string;
          openTime: Date;
        };
      };
    }) =>
      this.rows.find(
        (row) =>
          row.pairId === where.pairId_interval_openTime.pairId &&
          row.interval === where.pairId_interval_openTime.interval &&
          row.openTime.getTime() ===
            where.pairId_interval_openTime.openTime.getTime(),
      ) ?? null,
    upsert: async ({
      create,
      update,
    }: {
      create: Omit<CandleRow, "id" | "receivedAt">;
      update: Partial<CandleRow>;
    }) => {
      const existing = this.rows.find(
        (row) =>
          row.pairId === create.pairId &&
          row.interval === create.interval &&
          row.openTime.getTime() === create.openTime.getTime(),
      );
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const row = {
        ...create,
        id: `kline-${this.rows.length + 1}`,
        receivedAt: new Date(),
      } as CandleRow;
      this.rows.push(row);
      return row;
    },
  };
}

describe("Public market C2 HTTP path", () => {
  let app: INestApplication;
  let d1: D1MarketHarness;

  beforeAll(async () => {
    d1 = new D1MarketHarness();
    const providers = {
      fetchHistory: async () => [
        {
          symbol: "BTCUSDT",
          interval: "1h" as const,
          openTime: new Date("2026-09-01T00:00:00.000Z"),
          closeTime: new Date("2026-09-01T00:59:59.999Z"),
          open: "100",
          high: "110",
          low: "95",
          close: "105",
          volume: "42",
          provider: "deterministic-c2",
          source: "c2:history",
          observedAt: new Date(),
          receivedAt: new Date(),
        },
      ],
    };

    const module = await Test.createTestingModule({
      controllers: [MarketKlineController],
      providers: [
        MarketKlineService,
        { provide: PrismaService, useValue: {} },
        { provide: D1PrismaService, useValue: d1 },
        { provide: MarketProviderRouterService, useValue: providers },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    await app.listen(0, "127.0.0.1");
  });

  afterAll(async () => {
    await app.close();
  });

  it("proves Public-shaped HTTP → Nest → D1 write/read-back", async () => {
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string")
      throw new Error("Test server did not expose a TCP address");

    const response = await axios.get(
      `http://127.0.0.1:${address.port}/market/klines`,
      {
        params: { symbol: "BTC/USDT", interval: "1h", limit: 40 },
        validateStatus: () => true,
      },
    );

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      dataState: "LIVE",
      symbol: "BTCUSDT",
      interval: "1h",
    });
    expect(response.data.candles).toHaveLength(1);
    expect(response.data.candles[0]).toMatchObject({
      symbol: "BTCUSDT",
      close: "105",
      provider: "deterministic-c2",
    });
    expect(d1.rows).toHaveLength(1);
    expect(d1.rows[0].symbol).toBe("BTCUSDT");
    expect(d1.rows[0].close.toString()).toBe("105");
  });

  it("rejects invalid Public query input at the real HTTP boundary", async () => {
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string")
      throw new Error("Test server did not expose a TCP address");

    const response = await axios.get(
      `http://127.0.0.1:${address.port}/market/klines`,
      {
        params: { symbol: "BTC/USDT", interval: "invalid", limit: 1 },
        validateStatus: () => true,
      },
    );

    expect(response.status).toBe(400);
    expect(d1.rows).toHaveLength(1);
  });
});
