import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../prisma/d1-client';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { MarketKlineInput, MarketKlineInterval, normalizeMarketKline } from './market-kline.contract';

const DERIVED_KLINE_INTERVALS = [
  ['5m', 5 * 60_000],
  ['15m', 15 * 60_000],
  ['30m', 30 * 60_000],
  ['1h', 60 * 60_000],
  ['4h', 4 * 60 * 60_000],
  ['1d', 24 * 60 * 60_000],
] as const satisfies ReadonlyArray<readonly [MarketKlineInterval, number]>;

export interface MarketQuoteCandleInput {
  symbol: string;
  price: string | number;
  provider: string;
  source: string;
  observedAt: Date;
}

@Injectable()
export class MarketKlineService {
  private get db(): any { return this.d1; }

  constructor(private readonly d1: D1PrismaService) {}

  async list(symbol: string, interval: string, limit: number, from?: Date, to?: Date) {
    const normalizedSymbol = symbol.trim().toUpperCase().replaceAll('/', '');
    const pair = await this.db.marketPair.findUnique({ where: { symbol: normalizedSymbol } });
    if (!pair) return [];
    const rows = await this.db.marketKline.findMany({
      where: {
        pairId: pair.id,
        interval,
        ...(from || to ? { openTime: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      // Select the newest candles before applying the limit. Ordering ascending
      // here would return the oldest window and make a healthy live stream look
      // stale whenever historical rows outnumber the requested limit.
      orderBy: { openTime: 'desc' },
      take: limit,
    });
    return rows.reverse().map((row) => this.toContract(row));
  }

  async persist(input: MarketKlineInput) {
    const normalized = normalizeMarketKline(input);
    const pair = await this.db.marketPair.findUnique({ where: { symbol: normalized.symbol } });
    if (!pair) throw new NotFoundException(`Market pair ${normalized.symbol} is not configured`);
    const existing = await this.db.marketKline.findUnique({
      where: { pairId_interval_openTime: { pairId: pair.id, interval: normalized.interval, openTime: normalized.openTime } },
    });
    if (existing && existing.observedAt.getTime() > normalized.observedAt.getTime()) return this.toContract(existing);
    const row = await this.db.marketKline.upsert({
      where: { pairId_interval_openTime: { pairId: pair.id, interval: normalized.interval, openTime: normalized.openTime } },
      update: {
        closeTime: normalized.closeTime,
        open: this.storageDecimal(normalized.open),
        high: this.storageDecimal(normalized.high),
        low: this.storageDecimal(normalized.low),
        close: this.storageDecimal(normalized.close),
        volume: this.storageDecimal(normalized.volume),
        provider: normalized.provider,
        source: normalized.source,
        observedAt: normalized.observedAt,
      },
      create: {
        pairId: pair.id,
        symbol: normalized.symbol,
        interval: normalized.interval,
        openTime: normalized.openTime,
        closeTime: normalized.closeTime,
        open: this.storageDecimal(normalized.open),
        high: this.storageDecimal(normalized.high),
        low: this.storageDecimal(normalized.low),
        close: this.storageDecimal(normalized.close),
        volume: this.storageDecimal(normalized.volume),
        provider: normalized.provider,
        source: normalized.source,
        observedAt: normalized.observedAt,
      },
    });
    return this.toContract(row);
  }

  async aggregateFromOneMinute(symbol: string, oneMinuteOpenTime: Date) {
    const normalizedSymbol = symbol.trim().toUpperCase().replaceAll('/', '');
    const pair = await this.db.marketPair.findUnique({ where: { symbol: normalizedSymbol } });
    if (!pair) throw new NotFoundException(`Market pair ${normalizedSymbol} is not configured`);
    const eventTime = oneMinuteOpenTime.getTime();
    if (Number.isNaN(eventTime)) throw new Error('Market kline openTime is invalid');

    const derived = [];
    for (const [interval, widthMs] of DERIVED_KLINE_INTERVALS) {
      const bucketStartMs = Math.floor(eventTime / widthMs) * widthMs;
      const bucketStart = new Date(bucketStartMs);
      const bucketEnd = new Date(bucketStartMs + widthMs);
      const rows = await this.db.marketKline.findMany({
        where: { pairId: pair.id, interval: '1m', openTime: { gte: bucketStart, lt: bucketEnd } },
        orderBy: { openTime: 'asc' },
      });
      if (rows.length === 0) continue;

      const first = rows[0];
      const last = rows.at(-1)!;
      let high = new Prisma.Decimal(first.high);
      let low = new Prisma.Decimal(first.low);
      let volume: Prisma.Decimal | null = new Prisma.Decimal(0);
      for (const row of rows) {
        const rowHigh = new Prisma.Decimal(row.high);
        const rowLow = new Prisma.Decimal(row.low);
        if (rowHigh.gt(high)) high = rowHigh;
        if (rowLow.lt(low)) low = rowLow;
        if (row.volume === null || row.volume === undefined) volume = null;
        else if (volume !== null) volume = volume.plus(new Prisma.Decimal(row.volume));
      }

      derived.push(await this.persist({
        symbol: normalizedSymbol,
        interval,
        openTime: bucketStart,
        closeTime: last.closeTime ?? undefined,
        open: first.open.toString(),
        high: high.toString(),
        low: low.toString(),
        close: last.close.toString(),
        volume: volume?.toString() ?? null,
        provider: last.provider,
        source: 'derived:1m-aggregation',
        observedAt: last.observedAt,
      }));
    }
    return derived;
  }

  /**
   * Builds the active one-minute OHLC candle from already-authoritative
   * provider quotes. Volume remains null because a ticker's 24h volume is not
   * a candle volume and must not be presented as one.
   */
  async accumulateQuote(input: MarketQuoteCandleInput) {
    const source = input.source.trim();
    if (!source) throw new Error('Market quote candle source is required');
    const openTime = new Date(Math.floor(input.observedAt.getTime() / 60_000) * 60_000);
    const candidate = normalizeMarketKline({
      symbol: input.symbol,
      interval: '1m',
      openTime,
      closeTime: input.observedAt,
      open: input.price,
      high: input.price,
      low: input.price,
      close: input.price,
      volume: null,
      provider: input.provider,
      source: `${source}:quote-aggregation`,
      observedAt: input.observedAt,
    });
    const pair = await this.db.marketPair.findUnique({ where: { symbol: candidate.symbol } });
    if (!pair) throw new NotFoundException(`Market pair ${candidate.symbol} is not configured`);

    const existing = await this.db.marketKline.findUnique({
      where: { pairId_interval_openTime: { pairId: pair.id, interval: candidate.interval, openTime } },
    });
    if (!existing) {
      return this.db.marketKline.create({
        data: {
          pairId: pair.id,
          symbol: candidate.symbol,
          interval: candidate.interval,
          openTime,
          closeTime: candidate.closeTime,
          open: this.storageDecimal(candidate.open),
          high: this.storageDecimal(candidate.high),
          low: this.storageDecimal(candidate.low),
          close: this.storageDecimal(candidate.close),
          volume: null,
          provider: candidate.provider,
          source: candidate.source,
          observedAt: candidate.observedAt,
        },
      });
    }

    // A late provider message must not regress the current close or freshness.
    if (existing.observedAt.getTime() > candidate.observedAt.getTime()) return existing;
    return this.db.marketKline.update({
      where: { id: existing.id },
      data: {
        closeTime: candidate.closeTime,
        high: this.storageDecimal(new Prisma.Decimal(existing.high).gt(candidate.high) ? new Prisma.Decimal(existing.high) : candidate.high),
        low: this.storageDecimal(new Prisma.Decimal(existing.low).lt(candidate.low) ? new Prisma.Decimal(existing.low) : candidate.low),
        close: this.storageDecimal(candidate.close),
        // Provider ticker volume is 24h aggregate data, not per-candle volume.
        volume: null,
        provider: candidate.provider,
        source: candidate.source,
        observedAt: candidate.observedAt,
      },
    });
  }

  private storageDecimal(value: Prisma.Decimal | null): Prisma.Decimal | string | null {
    return this.d1.isEnabled() ? value?.toString() ?? null : value;
  }

  private toContract(row: {
    symbol: string; interval: string; openTime: Date; closeTime: Date | null;
    open: Prisma.Decimal | string; high: Prisma.Decimal | string; low: Prisma.Decimal | string; close: Prisma.Decimal | string;
    volume: Prisma.Decimal | string | null; provider: string; source: string; observedAt: Date; receivedAt: Date;
  }) {
    return {
      time: Math.floor(row.openTime.getTime() / 1000),
      open: row.open.toString(),
      high: row.high.toString(),
      low: row.low.toString(),
      close: row.close.toString(),
      volume: row.volume?.toString() ?? null,
      symbol: row.symbol,
      interval: row.interval,
      closeTime: row.closeTime?.toISOString() ?? null,
      provider: row.provider,
      source: row.source,
      observedAt: row.observedAt.toISOString(),
      receivedAt: row.receivedAt.toISOString(),
    };
  }
}
