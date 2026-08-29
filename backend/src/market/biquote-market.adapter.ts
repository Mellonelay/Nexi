import { Injectable, Logger } from '@nestjs/common';
import {
  MarketProviderAdapter,
  MarketProviderEvent,
  MarketProviderRuntimeSymbol,
  ProviderQuoteEvent,
} from './market-provider.adapter';

type BiquoteTick = {
  symbol?: string;
  bid?: number;
  ask?: number;
  mid?: number;
  last?: number;
  high?: number;
  low?: number;
  dayDiffPercent?: number;
  timestamp?: string;
  marketState?: string;
  stale?: boolean;
};

@Injectable()
export class BiquoteMarketAdapter implements MarketProviderAdapter {
  readonly provider = 'biquote';
  private readonly logger = new Logger(BiquoteMarketAdapter.name);
  private runtimeSymbols: MarketProviderRuntimeSymbol[] = [];
  private timer?: NodeJS.Timeout;

  configure(symbols: readonly MarketProviderRuntimeSymbol[]): void {
    this.runtimeSymbols = [...symbols]
      .filter((entry) => entry.symbol.trim() && entry.providerInstrument.trim());
  }

  isEnabled(): boolean {
    return process.env.MARKET_PROVIDER_ENABLED === 'true';
  }

  async start(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    if (!this.isEnabled() || this.runtimeSymbols.length === 0) return;
    await this.poll(onEvent);
    const interval = this.pollIntervalMs();
    this.timer = setInterval(() => { void this.poll(onEvent); }, interval);
    this.timer.unref?.();
    this.logger.log(`BiQuote batch polling started for ${this.runtimeSymbols.length} canonical symbol(s) every ${interval}ms.`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private pollIntervalMs(): number {
    const parsed = Number(process.env.BIQUOTE_POLL_INTERVAL_MS ?? process.env.MARKET_PROVIDER_POLL_INTERVAL_MS ?? '15000');
    return Number.isFinite(parsed) ? Math.max(5_000, Math.min(parsed, 300_000)) : 15_000;
  }

  private async poll(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    const byInstrument = new Map(this.runtimeSymbols.map((entry) => [entry.providerInstrument.toUpperCase(), entry]));
    const instruments = [...byInstrument.keys()];
    for (let offset = 0; offset < instruments.length; offset += 100) {
      const batch = instruments.slice(offset, offset + 100);
      try {
        const url = new URL('/api/latest', process.env.BIQUOTE_API_BASE_URL?.trim() || 'https://biquote.io');
        for (const instrument of batch) url.searchParams.append('symbols', instrument);
        url.searchParams.set('allowStale', 'true');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        let response: Response;
        try {
          response = await fetch(url, { signal: controller.signal });
        } finally {
          clearTimeout(timeout);
        }
        if (!response.ok) throw new Error(`BiQuote REST ${response.status}`);
        const ticks = await response.json() as Record<string, BiquoteTick>;
        for (const [instrument, tick] of Object.entries(ticks)) {
          const mapping = byInstrument.get(instrument.toUpperCase());
          if (!mapping) continue;
          const event = this.toEvent(mapping, tick);
          if (event) onEvent(event);
        }
      } catch (error) {
        this.logger.warn(`BiQuote batch quote request failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
  }

  private toEvent(mapping: MarketProviderRuntimeSymbol, tick: BiquoteTick): ProviderQuoteEvent | null {
    const mid = Number(tick.mid);
    const bid = Number(tick.bid);
    const ask = Number(tick.ask);
    const last = Number(tick.last);
    const price = Number.isFinite(mid) && mid > 0
      ? mid
      : Number.isFinite(bid) && bid > 0 && Number.isFinite(ask) && ask > 0
        ? (bid + ask) / 2
        : last;
    if (!Number.isFinite(price) || price <= 0) return null;
    const eventTime = tick.timestamp ? Date.parse(tick.timestamp) : Date.now();
    return {
      kind: 'ticker',
      symbol: mapping.symbol,
      provider: this.provider,
      source: tick.marketState === 'closed' ? 'biquote:rest:closed-market' : 'biquote:rest:batch',
      providerInstrument: mapping.providerInstrument,
      priceType: 'MID',
      eventTime: Number.isFinite(eventTime) ? eventTime : Date.now(),
      price: String(price),
      change24h: tick.dayDiffPercent == null ? undefined : String(tick.dayDiffPercent),
      high24h: tick.high == null ? undefined : String(tick.high),
      low24h: tick.low == null ? undefined : String(tick.low),
    };
  }
}
