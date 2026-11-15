import { Injectable, Logger, Optional } from '@nestjs/common';
import { statSync } from 'node:fs';
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
  private static readonly BATCH_LIMIT = 2_500;
  private static readonly CATCHUP_BATCHES = 4;
  private static readonly CATCHUP_BUDGET_MS = 8_000;
  private inFlight = false;
  private lastDisabledWarningAt = 0;
  private static readonly MAX_SQLITE_BYTES = 20_000_000_000;

  constructor(
    private readonly d1: D1PrismaService,
    @Optional() private readonly config: ConfigService = new ConfigService(),
  ) {}

  // Monitor the combined persistent main database and WAL without ever
  // refusing financial writes. Alerts are advisory and do not scan tables.
  @Cron(CronExpression.EVERY_HOUR)
  checkSqliteCapacity(): void {
    const path = this.config.get<string>('NEXI_LOCAL_SQLITE_PATH');
    if (!path) return;
    try {
      const mainBytes = statSync(path).size;
      let walBytes = 0;
      try {
        walBytes = statSync(path + '-wal').size;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      const totalBytes = mainBytes + walBytes;
      const usedPercent = Math.round(totalBytes * 100 / MarketQuoteRetentionScheduler.MAX_SQLITE_BYTES);
      if (totalBytes >= 18_000_000_000) {
        this.logger.error('SQLite main+WAL critical: ' + usedPercent + '% of 20 GB. Preserve financial writes; reduce only eligible market history.');
      } else if (totalBytes >= 15_000_000_000) {
        this.logger.warn('SQLite main+WAL maintenance threshold: ' + usedPercent + '% of 20 GB.');
      } else if (totalBytes >= 12_000_000_000) {
        this.logger.warn('SQLite main+WAL warning: ' + usedPercent + '% of 20 GB.');
      }
    } catch (error) {
      this.logger.error('SQLite storage monitoring unavailable: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async removeExpiredQuoteSnapshots(): Promise<number> {
    if (this.config.get<string>('NEXI_SCHEDULER_ENABLED') !== 'true') return 0;
    if (this.config.get<string>('NEXI_MARKET_QUOTE_RETENTION_ENABLED') !== 'true') {
      if (Date.now() - this.lastDisabledWarningAt >= 60 * 60_000) {
        this.lastDisabledWarningAt = Date.now();
        this.logger.warn('72-hour market quote retention disabled; historical snapshots will accumulate.');
      }
      return 0;
    }
    if (!this.d1.isEnabled()) return 0;
    if (this.inFlight) return 0;

    this.inFlight = true;
    let removedTotal = 0;
    try {
      const cutoff = new Date(Date.now() - MarketQuoteRetentionScheduler.RETENTION_MS).toISOString();
      const catchup = this.config.get<string>('NEXI_MARKET_QUOTE_RETENTION_CATCHUP_ENABLED') === 'true';
      const maxBatches = catchup ? MarketQuoteRetentionScheduler.CATCHUP_BATCHES : 1;
      const deadline = Date.now() + MarketQuoteRetentionScheduler.CATCHUP_BUDGET_MS;
      for (let batch = 0; batch < maxBatches; batch++) {
        if (batch > 0 && Date.now() >= deadline) break;
        // One bounded statement/commit at a time via the existing Prisma writer.
        // Latest quote lineage remains excluded on every pass.
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
        removedTotal += removed;
        if (removed < MarketQuoteRetentionScheduler.BATCH_LIMIT) break;
      }
      if (removedTotal > 0) {
        this.logger.log(`Expired market quote snapshots removed: ${removedTotal}${catchup ? ' (catch-up)' : ''}`);
        // The promoted SQLite file has auto_vacuum=INCREMENTAL. Reclaim at most
        // 256 freed pages per tick; SQLite serializes this with financial writes.
        // Failed reclamation must not reverse an already committed DELETE.
        try {
          await this.d1.$queryRawUnsafe('PRAGMA incremental_vacuum(256)');
        } catch (error) {
          this.logger.warn(`SQLite incremental vacuum deferred: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      return removedTotal;
    } catch (error) {
      this.logger.error(`Market quote snapshot retention failed after removing ${removedTotal} rows`, error);
      throw error;
    } finally {
      this.inFlight = false;
    }
  }
}
