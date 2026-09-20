import { Injectable, Logger } from '@nestjs/common';
import * as signalR from '@microsoft/signalr';
import { getProviderMapping } from './market-source-registry';
import type { MarketKlineInput, MarketKlineInterval } from './market-kline.contract';
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

type BiquoteBar = {
  openTime?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  tickVolume?: number;
  isOpen?: boolean;
};

const BIQUOTE_INTERVALS = new Set<MarketKlineInterval>(['1m', '5m', '15m', '30m', '1h', '4h', '1d']);

@Injectable()
export class BiquoteMarketAdapter implements MarketProviderAdapter {
  readonly provider = 'biquote';
  private readonly logger = new Logger(BiquoteMarketAdapter.name);
  private runtimeSymbols: MarketProviderRuntimeSymbol[] = [];
  private fallbackTimer?: NodeJS.Timeout;
  private statusTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private connection?: signalR.HubConnection;
  private stopping = false;

  configure(symbols: readonly MarketProviderRuntimeSymbol[]): void {
    this.runtimeSymbols = [...symbols]
      .filter((entry) => entry.symbol.trim() && entry.providerInstrument.trim());
  }

  isEnabled(): boolean {
    return process.env.MARKET_PROVIDER_ENABLED === 'true';
  }

  async start(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    if (!this.isEnabled() || this.runtimeSymbols.length === 0) return;
    this.stopping = false;
    await this.poll(onEvent);
    try {
      await this.startSignalR(onEvent);
      this.startStatusPolling(onEvent);
    } catch (error) {
      this.logger.warn(`BiQuote SignalR unavailable; using bounded REST fallback: ${error instanceof Error ? error.message : 'unknown error'}`);
      this.startFallbackPolling(onEvent);
      this.scheduleSignalRRestart(onEvent);
    }
  }

  async stop(): Promise<void> {
    this.stopping = true;
    if (this.fallbackTimer) clearInterval(this.fallbackTimer);
    if (this.statusTimer) clearInterval(this.statusTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.fallbackTimer = undefined;
    this.statusTimer = undefined;
    this.reconnectTimer = undefined;
    const connection = this.connection;
    this.connection = undefined;
    if (!connection) return;
    await Promise.race([
      connection.stop().catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
    ]);
  }

  async fetchHistory(symbol: string, interval: MarketKlineInterval, limit: number): Promise<MarketKlineInput[]> {
    if (!BIQUOTE_INTERVALS.has(interval)) return [];
    const mapping = getProviderMapping(symbol, this.provider);
    if (!mapping?.klineSupported) return [];
    const url = new URL(`/api/${encodeURIComponent(mapping.instrument)}/ohlc`, this.baseUrl());
    url.searchParams.set('interval', interval);
    url.searchParams.set('limit', String(Math.min(500, Math.max(40, limit))));
    const response = await this.fetchWithTimeout(url);
    if (!response.ok) throw new Error(`BiQuote OHLC ${response.status}`);
    const payload = await response.json() as { bars?: BiquoteBar[] };
    const now = new Date();
    return (payload.bars ?? []).flatMap((bar) => {
      const openTime = bar.openTime ? new Date(bar.openTime) : null;
      if (!openTime || Number.isNaN(openTime.getTime())) return [];
      const values = [bar.open, bar.high, bar.low, bar.close].map(Number);
      if (values.some((value) => !Number.isFinite(value) || value <= 0)) return [];
      return [{
        symbol,
        interval,
        openTime,
        closeTime: new Date(openTime.getTime() + this.intervalMs(interval) - 1),
        open: String(values[0]), high: String(values[1]), low: String(values[2]), close: String(values[3]),
        volume: Number.isFinite(Number(bar.volume)) ? String(bar.volume) : null,
        provider: this.provider,
        source: 'biquote:rest:ohlc',
        observedAt: bar.isOpen ? now : new Date(openTime.getTime() + this.intervalMs(interval) - 1),
      } satisfies MarketKlineInput];
    });
  }

  private async startSignalR(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    const byInstrument = new Map(this.runtimeSymbols.map((entry) => [entry.providerInstrument.toUpperCase(), entry]));
    const instruments = [...byInstrument.keys()];
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl().replace(/\/$/, '')}/hubs/tick`)
      .withAutomaticReconnect([0, 1_000, 5_000, 15_000, 30_000])
      .build();
    connection.on('ReceiveTick', (tick: BiquoteTick) => {
      const instrument = String(tick.symbol ?? '').toUpperCase();
      const mapping = byInstrument.get(instrument);
      if (!mapping) return;
      const event = this.toEvent(mapping, tick, 'biquote:signalr');
      if (event) onEvent(event);
    });
    connection.onreconnected(() => {
      void connection.invoke('Subscribe', instruments).catch((error) => this.logger.warn(`BiQuote resubscribe failed: ${String(error)}`));
    });
    connection.onclose((error) => {
      if (this.connection === connection) this.connection = undefined;
      if (this.stopping) return;
      this.logger.warn(`BiQuote SignalR closed; continuing with REST fallback: ${error instanceof Error ? error.message : 'connection closed'}`);
      this.startFallbackPolling(onEvent);
      this.scheduleSignalRRestart(onEvent);
    });
    await connection.start();
    await connection.invoke('Subscribe', instruments);
    this.connection = connection;
    this.stopFallbackPolling();
    this.startStatusPolling(onEvent);
    this.logger.log(`BiQuote SignalR subscribed to ${instruments.length} canonical symbol(s).`);
  }

  private startFallbackPolling(onEvent: (event: MarketProviderEvent) => void): void {
    if (this.fallbackTimer) return;
    const interval = this.pollIntervalMs();
    this.fallbackTimer = setInterval(() => { void this.poll(onEvent); }, interval);
    this.fallbackTimer.unref?.();
  }

  private stopFallbackPolling(): void {
    if (this.fallbackTimer) clearInterval(this.fallbackTimer);
    this.fallbackTimer = undefined;
  }

  private startStatusPolling(onEvent: (event: MarketProviderEvent) => void): void {
    if (this.statusTimer) return;
    const interval = this.pollIntervalMs();
    this.statusTimer = setInterval(() => { void this.poll(onEvent); }, interval);
    this.statusTimer.unref?.();
  }

  private scheduleSignalRRestart(onEvent: (event: MarketProviderEvent) => void): void {
    if (this.stopping || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.startSignalR(onEvent).catch((error) => {
        if (this.stopping) return;
        this.logger.warn(`BiQuote SignalR restart failed; REST fallback remains active: ${error instanceof Error ? error.message : 'unknown error'}`);
        this.scheduleSignalRRestart(onEvent);
      });
    }, 30_000);
    this.reconnectTimer.unref?.();
  }

  private pollIntervalMs(): number {
    const parsed = Number(process.env.BIQUOTE_POLL_INTERVAL_MS ?? '60000');
    return Number.isFinite(parsed) ? Math.max(15_000, Math.min(parsed, 300_000)) : 60_000;
  }

  private baseUrl(): string {
    return process.env.BIQUOTE_API_BASE_URL?.trim() || 'https://biquote.io';
  }

  private async poll(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    const byInstrument = new Map(this.runtimeSymbols.map((entry) => [entry.providerInstrument.toUpperCase(), entry]));
    const instruments = [...byInstrument.keys()];
    for (let offset = 0; offset < instruments.length; offset += 100) {
      const batch = instruments.slice(offset, offset + 100);
      try {
        const url = new URL('/api/latest', this.baseUrl());
        for (const instrument of batch) url.searchParams.append('symbols', instrument);
        url.searchParams.set('allowStale', 'true');
        const response = await this.fetchWithTimeout(url);
        if (!response.ok) throw new Error(`BiQuote REST ${response.status}`);
        const ticks = await response.json() as Record<string, BiquoteTick>;
        for (const [instrument, tick] of Object.entries(ticks)) {
          const mapping = byInstrument.get(instrument.toUpperCase());
          if (!mapping) continue;
          const event = this.toEvent(mapping, tick, tick.marketState === 'closed' ? 'biquote:rest:closed-market' : 'biquote:rest:batch');
          if (event) onEvent(event);
        }
      } catch (error) {
        this.logger.warn(`BiQuote batch quote request failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
  }

  private toEvent(mapping: MarketProviderRuntimeSymbol, tick: BiquoteTick, source: string): ProviderQuoteEvent | null {
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
    const spread = Number.isFinite(bid) && Number.isFinite(ask) && ask >= bid ? ask - bid : undefined;
    const closed = tick.marketState?.trim().toLowerCase() === 'closed';
    return {
      kind: 'ticker', symbol: mapping.symbol, provider: this.provider,
      source: closed && !source.includes('closed-market') ? `${source}:closed-market` : source,
      providerInstrument: mapping.providerInstrument, priceType: 'MID',
      eventTime: Number.isFinite(eventTime) ? eventTime : Date.now(), price: String(price),
      change24h: tick.dayDiffPercent == null ? undefined : String(tick.dayDiffPercent),
      high24h: tick.high == null ? undefined : String(tick.high), low24h: tick.low == null ? undefined : String(tick.low),
      bid: Number.isFinite(bid) && bid > 0 ? String(bid) : undefined,
      ask: Number.isFinite(ask) && ask > 0 ? String(ask) : undefined,
      spread: spread === undefined ? undefined : String(spread),
      sessionState: closed ? 'CLOSED' : 'OPEN',
    };
  }

  private async fetchWithTimeout(url: URL): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try { return await fetch(url, { signal: controller.signal }); }
    finally { clearTimeout(timeout); }
  }

  private intervalMs(interval: MarketKlineInterval): number {
    const units: Record<MarketKlineInterval, number> = {
      '1m': 60_000, '3m': 180_000, '5m': 300_000, '15m': 900_000, '30m': 1_800_000,
      '1h': 3_600_000, '2h': 7_200_000, '4h': 14_400_000, '6h': 21_600_000, '8h': 28_800_000,
      '12h': 43_200_000, '1d': 86_400_000, '3d': 259_200_000, '1w': 604_800_000, '1M': 2_592_000_000,
    };
    return units[interval];
  }
}
