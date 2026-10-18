import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { D1PrismaService } from '../d1/d1-prisma.service';

/**
 * Non-financial, raw quote history retention. Preserves the snapshot matching
 * each pair's current MarketQuoteLatest sequence (used by getSnapshot lineage).
 *
 * The explicit feature flag prevents an existing deployment from beginning
 * destructive cleanup until the retention policy has been accepted for launch.
 */
@Injectable()
export class MarketQuoteRetentionScheduler {
  private readonly logger = new Logger(MarketQuoteRetentionScheduler.name);
  private static readonly RETENTION_MS = 72 * 60 * 60 * 1000;
  private static readonly BATCH_LIMIT = 1000;
  private inFlight = false;

  constructor(
    private readonly d1: D1PrismaService,
    @Optional() private readonly config: ConfigService = new ConfigService(),
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async removeExpiredQuoteSnapshots(): Promise<number> {
    if (this.config.get<string>('NEXI_SCHEDULER_ENABLED') !== 'true') return 0;
    if (this.config.get<string>('NEXI_MARKET_QUOTE_RETENTION_ENABLED') !== 'true') return 0;
    if (!this.d1.isEnabled()) return 0;
    if (this.inFlight) return 0;

    this.inFlight = true;
    try {
      const cutoff = new Date(Date.now() - MarketQuoteRetentionScheduler.RETENTION_MS).toISOString();
      // receivedAt has an existing index. Deleting by bounded ID selection
      // avoids a single large D1 transaction and doesn't touch MarketKline,
      // Ledger, settlement, or Activity records.
      const removed = await this.d1.$executeRaw`
        DELETE FROM "MarketQuoteSnapshot"
        WHERE "id" IN (
          SELECT snapshot."id"
          FROM "MarketQuoteSnapshot" AS snapshot
          LEFT JOIN "MarketQuoteLatest" AS latest
            ON latest."pairId" = snapshot."pairId"
            AND latest."sequence" = snapshot."sequence"
          WHERE snapshot."receivedAt" < ${cutoff}
            AND latest."id" IS NULL
          ORDER BY snapshot."receivedAt" ASC
          LIMIT ${MarketQuoteRetentionScheduler.BATCH_LIMIT}
        )
      `;
      if (removed > 0) this.logger.log(`Expired market quote snapshots removed: ${removed}`);
      return removed;
    } catch (error) {
      this.logger.error('Market quote snapshot retention failed', error);
      throw error;
    } finally {
      this.inFlight = false;
    }
  }
}
