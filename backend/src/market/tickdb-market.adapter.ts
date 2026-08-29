import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { WebSocket } from 'ws';
import { CANONICAL_MARKET_CATALOG } from './market-catalog';
import { getProviderMapping } from './market-source-registry';
import { MarketProviderAdapter, MarketProviderEvent, ProviderQuoteEvent } from './market-provider.adapter';

type TickDbMessage = Record<string, unknown>;

/**
 * TickDB's public contract is deliberately isolated here. The adapter only
 * emits normalized quotes; it does not invent candles, depth, or trades when
 * the upstream subscription has not supplied them.
 */
@Injectable()
export class TickDbMarketAdapter implements OnModuleDestroy, MarketProviderAdapter {
  readonly provider = 'tickdb';
  private readonly logger = new Logger(TickDbMarketAdapter.name);
  private socket?: WebSocket;
  private pollTimer?: NodeJS.Timeout;

  isEnabled(): boolean {
    return process.env.MARKET_PROVIDER_ENABLED === 'true'
      && this.selected()
      && Boolean(process.env.TICKDB_API_KEY?.trim());
  }

  async start(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    if (!this.isEnabled()) return;
    const symbols = this.symbols();
    if (!symbols.length) {
      this.logger.warn('TickDB selected but no mapped canonical non-crypto symbols are configured.');
      return;
    }

    const base = process.env.TICKDB_WS_URL?.trim() || 'wss://api.tickdb.ai/v1/realtime';
    const url = new URL(base);
    url.searchParams.set('api_key', process.env.TICKDB_API_KEY!.trim());
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.on('open', () => {
      socket.send(JSON.stringify({ cmd: 'subscribe', data: { channel: 'ticker', symbols } }));
      this.logger.log(`TickDB ticker subscription started for ${symbols.length} canonical symbol(s).`);
    });
    socket.on('message', (raw) => {
      const text = raw.toString();
      const payloads = this.expandPayloads(text);
      for (const payload of payloads) {
        const event = this.normalize(payload, 'websocket');
        if (event) onEvent(event);
      }
    });
    socket.on('error', (error) => this.logger.warn(`TickDB websocket error: ${error.message}`));
    socket.on('close', () => { this.socket = undefined; });
    await this.pollRest(onEvent);
    this.pollTimer = setInterval(() => { void this.pollRest(onEvent); }, 15_000);
    this.pollTimer.unref?.();
  }

  stop(): void {
    this.socket?.close();
    this.socket = undefined;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
  }

  onModuleDestroy(): void { this.stop(); }

  private selected(): boolean {
    const names = process.env.MARKET_PROVIDER_NAMES?.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean) ?? [];
    const legacy = process.env.MARKET_PROVIDER_NAME?.trim().toLowerCase();
    return (names.length ? names : legacy ? [legacy] : []).includes(this.provider);
  }

  private symbols(): string[] {
    const configured = process.env.MARKET_PROVIDER_SYMBOLS_TICKDB?.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean)
      ?? process.env.MARKET_PROVIDER_SYMBOLS?.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean)
      ?? ['CANONICAL_NONCRYPTO'];
    const source = configured.includes('CANONICAL_NONCRYPTO')
      ? CANONICAL_MARKET_CATALOG.filter((entry) => entry.category !== 'crypto').map((entry) => entry.symbol)
      : configured;
    return [...new Set(source)].flatMap((symbol) => {
      const mapping = getProviderMapping(symbol, this.provider);
      return mapping ? [mapping.instrument] : [];
    });
  }

  private async pollRest(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    try {
      const url = new URL('/v1/market/ticker', process.env.TICKDB_HTTP_URL?.trim() || 'https://api.tickdb.ai');
      url.searchParams.set('symbols', this.symbols().join(','));
      const response = await fetch(url, { headers: { 'X-API-Key': process.env.TICKDB_API_KEY!.trim() } });
      if (!response.ok) throw new Error(`TickDB REST ${response.status}`);
      const body = await response.text();
      for (const payload of this.expandPayloads(body)) {
        const event = this.normalize(payload, 'rest:ticker');
        if (event) onEvent(event);
      }
    } catch (error) {
      this.logger.warn(`TickDB REST ticker error: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private normalize(raw: string, source: 'websocket' | 'rest:ticker'): ProviderQuoteEvent | null {
    let body: TickDbMessage;
    try { body = JSON.parse(raw) as TickDbMessage; } catch { return null; }
    const data = (body.data && typeof body.data === 'object' ? body.data : body) as TickDbMessage;
    const instrument = String(data.symbol ?? data.s ?? data.ticker ?? data.code ?? '').toUpperCase();
    if (!instrument) return null;
    const entry = CANONICAL_MARKET_CATALOG.find((candidate) => getProviderMapping(candidate.symbol, this.provider)?.instrument.toUpperCase() === instrument);
    if (!entry) return null;
    const bid = this.number(data.bid ?? data.b);
    const ask = this.number(data.ask ?? data.a);
    const last = this.number(data.last ?? data.last_price ?? data.price ?? data.p ?? data.close ?? data.c);
    const price = last ?? (bid !== null && ask !== null ? (bid + ask) / 2 : bid);
    if (price === null || price <= 0) return null;
    const eventTime = this.number(data.timestamp ?? data.time ?? data.eventTime ?? data.ts) ?? Date.now();
    return {
      kind: 'ticker', provider: this.provider, source, symbol: entry.symbol,
      providerInstrument: instrument, priceType: last !== null ? 'LAST' : 'MID',
      eventTime, price: String(price),
      volume24h: this.stringNumber(data.volume ?? data.volume_24h ?? data.v),
      high24h: this.stringNumber(data.high ?? data.high_24h ?? data.h),
      low24h: this.stringNumber(data.low ?? data.low_24h ?? data.l),
      change24h: this.stringNumber(data.changePercent ?? data.price_change_percent_24h ?? data.change ?? data.pct),
    };
  }

  private expandPayloads(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw) as TickDbMessage;
      if (!Array.isArray(parsed.data)) return [raw];
      return parsed.data.map((data) => JSON.stringify({ ...parsed, data }));
    } catch {
      return [raw];
    }
  }

  private number(value: unknown): number | null {
    const parsed = Number(value);
    return value === undefined || value === null || !Number.isFinite(parsed) ? null : parsed;
  }

  private stringNumber(value: unknown): string | undefined {
    const parsed = this.number(value);
    return parsed === null ? undefined : String(parsed);
  }
}
