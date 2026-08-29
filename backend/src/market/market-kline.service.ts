import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { MarketKlineInput, normalizeMarketKline } from './market-kline.contract';

export interface MarketQuoteCandleInput {
  symbol: string;
  price: string | number;
  provider: string;
  source: string;
  observedAt: Date;
}

@Injectable()
export class MarketKlineService {
  private get db(): any { return this.d1.isEnabled() ? this.d1 : this.prisma; }

  constructor(private readonly prisma: PrismaService, private readonly d1: D1PrismaService) {}

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
        open: normalized.open,
        high: normalized.high,
        low: normalized.low,
        close: normalized.close,
        volume: normalized.volume,
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
        open: normalized.open,
        high: normalized.high,
        low: normalized.low,
        close: normalized.close,
        volume: normalized.volume,
        provider: normalized.provider,
        source: normalized.source,
        observedAt: normalized.observedAt,
      },
    });
    return this.toContract(row);
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
          open: candidate.open,
          high: candidate.high,
          low: candidate.low,
          close: candidate.close,
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
        high: existing.high.gt(candidate.high) ? existing.high : candidate.high,
        low: existing.low.lt(candidate.low) ? existing.low : candidate.low,
        close: candidate.close,
        // Provider ticker volume is 24h aggregate data, not per-candle volume.
        volume: null,
        provider: candidate.provider,
        source: candidate.source,
        observedAt: candidate.observedAt,
      },
    });
  }

  private toContract(row: {
    symbol: string; interval: string; openTime: Date; closeTime: Date | null;
    open: Prisma.Decimal; high: Prisma.Decimal; low: Prisma.Decimal; close: Prisma.Decimal;
    volume: Prisma.Decimal | null; provider: string; source: string; observedAt: Date; receivedAt: Date;
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
