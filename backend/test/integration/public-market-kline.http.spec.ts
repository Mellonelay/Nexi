import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { D1PrismaService } from '../../src/d1/d1-prisma.service';
import { MarketKlineController } from '../../src/market/market-kline.controller';
import { MarketKlineQueryService } from '../../src/market/market-kline-query.service';
import { MarketKlineService } from '../../src/market/market-kline.service';
import { MarketProviderRouterService } from '../../src/market/market-provider-router.service';
import { MarketKlineQueryDto } from '../../src/market/market-kline.dto';

type CandleRow = { id: string; pairId: string; symbol: string; interval: string; openTime: Date; closeTime: Date; open: string; high: string; low: string; close: string; volume: string; provider: string; source: string; observedAt: Date; receivedAt: Date };

class D1MarketHarness {
  readonly pair = { id: 'pair-btc-usdt', symbol: 'BTCUSDT' };
  readonly rows: CandleRow[] = [];
  isEnabled() { return true; }
  marketPair = { findUnique: async ({ where }: any) => where.symbol === this.pair.symbol ? this.pair : null };
  marketKline = {
    findMany: async ({ where }: any) => this.rows.filter((row) => row.pairId === where.pairId && row.interval === where.interval).sort((a, b) => b.openTime.getTime() - a.openTime.getTime()),
    findUnique: async ({ where }: any) => this.rows.find((row) => row.pairId === where.pairId_interval_openTime.pairId && row.interval === where.pairId_interval_openTime.interval && row.openTime.getTime() === where.pairId_interval_openTime.openTime.getTime()) ?? null,
    upsert: async ({ create, update }: any) => { const existing = this.rows.find((row) => row.pairId === create.pairId && row.interval === create.interval && row.openTime.getTime() === create.openTime.getTime()); if (existing) { Object.assign(existing, update); return existing; } const row = { ...create, id: `kline-${this.rows.length + 1}`, receivedAt: new Date() }; this.rows.push(row); return row; },
  };
}

describe('Public market C2 contract path', () => {
  let app: INestApplication;
  let d1: D1MarketHarness;
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } });

  beforeAll(async () => {
    d1 = new D1MarketHarness();
    const providers = { fetchHistory: async () => [{ symbol: 'BTCUSDT', interval: '1h' as const, openTime: new Date('2026-09-01T00:00:00.000Z'), closeTime: new Date('2026-09-01T00:59:59.999Z'), open: '100', high: '110', low: '95', close: '105', volume: '42', provider: 'deterministic-c2', source: 'c2:history', observedAt: new Date(), receivedAt: new Date() }] };
    const module = await Test.createTestingModule({ controllers: [MarketKlineController], providers: [MarketKlineService, MarketKlineQueryService, { provide: D1PrismaService, useValue: d1 }, { provide: MarketProviderRouterService, useValue: providers }] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => { if (app) await app.close(); });

  it('proves Public-shaped query through controller, DTO validation, D1 write/read-back', async () => {
    const query = await pipe.transform({ symbol: 'BTC/USDT', interval: '1h', limit: 40 }, { type: 'query', metatype: MarketKlineQueryDto } as any) as MarketKlineQueryDto;
    const response = await app.get(MarketKlineController).list(query);
    expect(response).toMatchObject({ dataState: 'LIVE', symbol: 'BTCUSDT', interval: '1h' });
    expect(response.candles).toHaveLength(1);
    expect(response.candles[0]).toMatchObject({ symbol: 'BTCUSDT', close: '105', provider: 'deterministic-c2' });
    expect(d1.rows).toHaveLength(1);
  });

  it('rejects invalid Public query input at the DTO boundary', async () => {
    await expect(pipe.transform({ symbol: 'BTC/USDT', interval: 'invalid', limit: 1 }, { type: 'query', metatype: MarketKlineQueryDto } as any)).rejects.toBeDefined();
    expect(d1.rows).toHaveLength(1);
  });
});
