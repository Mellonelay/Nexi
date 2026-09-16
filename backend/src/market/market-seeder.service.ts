import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MarketAuthorityService } from './market-authority.service';
import { MarketKlineService } from './market-kline.service';
import { BinanceSpotAdapter } from './binance-spot.adapter';

/**
 * Compatibility boundary for the historical seeder name.
 * Provider credentials and endpoints are configuration-only; no external
 * source is contacted when the provider is not explicitly enabled.
 */
@Injectable()
export class MarketSeederService implements OnModuleInit {
  private readonly logger = new Logger(MarketSeederService.name);

  constructor(
    private readonly marketAuthority: MarketAuthorityService,
    private readonly marketKlines: MarketKlineService,
    private readonly binanceSpot: BinanceSpotAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    // Keep HTTP/Socket.IO startup independent from D1 catalog reconciliation.
    // The catalog remains backend-authoritative and failures remain explicit.
    void this.marketAuthority.ensureCatalog()
      .then(() => {
        this.logger.log('Market catalog authority initialized; external seeding remains configuration-gated.');
        if (this.binanceSpot.isEnabled() && process.env.MARKET_BACKFILL_ON_STARTUP === 'true') {
          void this.syncMarketData().catch((error) => this.logger.warn(`Binance Spot REST backfill failed: ${error instanceof Error ? error.message : 'unknown error'}`));
        } else {
          this.logger.log('Market REST backfill skipped; run the bounded market sync job explicitly.');
        }
      })
      .catch((error: unknown) => {
        this.logger.warn(`Market catalog seeding failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      });
  }

  async syncMarketData(): Promise<{ state: 'DISABLED' | 'COMPLETE' }> {
    if (!this.binanceSpot.isEnabled()) {
      return { state: 'DISABLED' };
    }
    // Streaming discovery and REST backfill share the adapter's idempotent
    // exchangeInfo resolution; never backfill the selector placeholder.
    const symbols = this.binanceSpot.configuredSymbols().includes('CANONICAL_CRYPTO')
      ? await this.binanceSpot.discoverCanonicalCryptoSymbols()
      : this.binanceSpot.configuredSymbols();
    for (const symbol of symbols) {
      const rows = await this.binanceSpot.fetchKlines(symbol, '1m', 240);
      for (const row of rows) {
        if (!Array.isArray(row) || row.length < 11) continue;
        await this.marketKlines.persist({
          symbol, interval: '1m', openTime: new Date(Number(row[0])), closeTime: new Date(Number(row[6])),
          open: String(row[1]), high: String(row[2]), low: String(row[3]), close: String(row[4]), volume: String(row[5]),
          provider: 'binance-spot', source: 'rest:klines', observedAt: new Date(Number(row[6])),
        });
      }
    }
    return { state: 'COMPLETE' };
  }

  async syncBinaryConfigs(): Promise<{ state: 'OUT_OF_SCOPE' }> {
    return { state: 'OUT_OF_SCOPE' };
  }
}
