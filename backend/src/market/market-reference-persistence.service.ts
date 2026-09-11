import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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
    private readonly d1: D1PrismaService,
    @Optional() private readonly archive?: MarketArchiveService,
  ) {}

  async persistTrade(event: ProviderTradeEvent): Promise<MarketReferencePersistenceResult> {
    return this.archiveD1(event);
  }

  async persistDepth(event: ProviderDepthEvent): Promise<MarketReferencePersistenceResult> {
    return this.archiveD1(event);
  }

  private async archiveD1(event: ProviderTradeEvent | ProviderDepthEvent): Promise<MarketReferencePersistenceResult> {
    const archived = this.archive ? await this.archive.archive(event) : false;
    return archived ? { accepted: true, reason: 'ARCHIVED' } : { accepted: false, reason: 'ARCHIVE_UNAVAILABLE' };
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
    await this.d1.marketTrade.deleteMany({ where: { observedAt: { lt: cutoff } } });
    await this.d1.marketDepthSnapshot.deleteMany({ where: { observedAt: { lt: cutoff } } });
    await this.d1.marketQuoteSnapshot.deleteMany({ where: { receivedAt: { lt: cutoff } } });
  }
}
