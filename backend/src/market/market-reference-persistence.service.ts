import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarketDepthSide, MarketTradeSide, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { ProviderDepthEvent, ProviderTradeEvent } from './market-provider.adapter';
import { MarketArchiveService } from './market-archive.service';

export type MarketReferencePersistenceResult = {
  accepted: boolean;
  reason?:
    | 'PERSISTED'
    | 'ARCHIVED'
    | 'DUPLICATE'
    | 'PAIR_UNAVAILABLE'
    | 'ARCHIVE_UNAVAILABLE';
};

@Injectable()
export class MarketReferencePersistenceService {
  private readonly logger = new Logger(MarketReferencePersistenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly d1: D1PrismaService,
    @Optional() private readonly archive?: MarketArchiveService,
  ) {}

  async persistTrade(event: ProviderTradeEvent): Promise<MarketReferencePersistenceResult> {
    if (this.d1.isEnabled()) return this.archiveD1(event);
    const archived = this.archive ? await this.archive.archive(event) : false;
    if (this.archive?.isRequired()) {
      return archived
        ? { accepted: true, reason: 'ARCHIVED' }
        : { accepted: false, reason: 'ARCHIVE_UNAVAILABLE' };
    }
    const pair = await this.resolvePair(event.symbol);
    if (!pair) return { accepted: false, reason: 'PAIR_UNAVAILABLE' };

    try {
      await this.prisma.marketTrade.create({
        data: {
          pairId: pair.id,
          symbol: pair.symbol,
          provider: event.provider,
          source: event.source,
          providerTradeId: String(event.tradeId),
          sequence: BigInt(event.tradeId),
          side: event.maker ? MarketTradeSide.SELL : MarketTradeSide.BUY,
          price: this.decimal(event.price, 'price'),
          quantity: this.decimal(event.quantity, 'quantity'),
          observedAt: new Date(event.eventTime),
          rawData: event as unknown as Prisma.InputJsonValue,
        },
      });
      return { accepted: true, reason: 'PERSISTED' };
    } catch (error) {
      if (this.isUniqueViolation(error)) return { accepted: false, reason: 'DUPLICATE' };
      throw error;
    }
  }

  async persistDepth(event: ProviderDepthEvent): Promise<MarketReferencePersistenceResult> {
    if (this.d1.isEnabled()) return this.archiveD1(event);
    const archived = this.archive ? await this.archive.archive(event) : false;
    if (this.archive?.isRequired()) {
      return archived
        ? { accepted: true, reason: 'ARCHIVED' }
        : { accepted: false, reason: 'ARCHIVE_UNAVAILABLE' };
    }
    const pair = await this.resolvePair(event.symbol);
    if (!pair) return { accepted: false, reason: 'PAIR_UNAVAILABLE' };

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.marketDepthSnapshot.create({
          data: {
            pairId: pair.id,
            symbol: pair.symbol,
            provider: event.provider,
            source: event.source,
            providerSnapshotId: String(event.updateId),
            sequence: BigInt(event.updateId),
            observedAt: new Date(event.eventTime),
            rawData: event as unknown as Prisma.InputJsonValue,
            levels: {
              create: [
                ...event.bids.map(([price, quantity], levelIndex) => ({
                  side: MarketDepthSide.BID,
                  levelIndex,
                  price: this.decimal(price, 'bid price'),
                  quantity: this.decimal(quantity, 'bid quantity'),
                })),
                ...event.asks.map(([price, quantity], levelIndex) => ({
                  side: MarketDepthSide.ASK,
                  levelIndex,
                  price: this.decimal(price, 'ask price'),
                  quantity: this.decimal(quantity, 'ask quantity'),
                })),
              ],
            },
          },
        });
      });
      return { accepted: true, reason: 'PERSISTED' };
    } catch (error) {
      if (this.isUniqueViolation(error)) return { accepted: false, reason: 'DUPLICATE' };
      throw error;
    }
  }

  private async archiveD1(event: ProviderTradeEvent | ProviderDepthEvent): Promise<MarketReferencePersistenceResult> {
    const archived = this.archive ? await this.archive.archive(event) : false;
    return archived ? { accepted: true, reason: 'ARCHIVED' } : { accepted: false, reason: 'ARCHIVE_UNAVAILABLE' };
  }

  private async resolvePair(symbol: string) {
    const normalized = symbol.trim().toUpperCase().replaceAll('/', '');
    return this.prisma.marketPair.findUnique({ where: { symbol: normalized }, select: { id: true, symbol: true } });
  }

  private decimal(value: string, field: string): Prisma.Decimal {
    const result = new Prisma.Decimal(value);
    if (!result.isFinite() || result.isNegative() || result.isZero()) {
      throw new Error(`Market ${field} must be a positive decimal`);
    }
    return result;
  }

  private isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  @Cron('*/5 * * * *')
  async enforceBoundedRetention(): Promise<void> {
    // Cleanup is only safe after archive delivery is a required, enforced path.
    // A configured endpoint alone is insufficient: retention also requires an
    // explicit operational enablement after archive checkpoints are verified.
    if (
      !this.archive?.isRequired() ||
      !this.archive.isConfigured() ||
      process.env.MARKET_ARCHIVE_RETENTION_ENABLED !== 'true' ||
      process.env.MARKET_ARCHIVE_CHECKPOINT_CONFIRMED !== 'true' ||
      !process.env.MARKET_ARCHIVE_CHECKPOINT_ID
    ) return;
    const retentionSeconds = Number(process.env.MARKET_REFERENCE_RETENTION_SECONDS ?? '3600');
    if (!Number.isFinite(retentionSeconds) || retentionSeconds <= 0) return;
    const cutoff = new Date(Date.now() - retentionSeconds * 1000);
    const db: any = this.d1.isEnabled() ? this.d1 : this.prisma;
    await db.marketTrade.deleteMany({ where: { observedAt: { lt: cutoff } } });
    await db.marketDepthSnapshot.deleteMany({ where: { observedAt: { lt: cutoff } } });
    await db.marketQuoteSnapshot.deleteMany({ where: { receivedAt: { lt: cutoff } } });
  }
}
