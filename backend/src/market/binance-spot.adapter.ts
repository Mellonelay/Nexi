import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { RawData, WebSocket } from 'ws';
import { CANONICAL_MARKET_CATALOG } from './market-catalog';
import { MarketProviderAdapter, MarketProviderEvent, MarketProviderRuntimeSymbol } from './market-provider.adapter';
import type { MarketKlineInput, MarketKlineInterval } from './market-kline.contract';

export type BinanceSpotMarketEvent =
  | { kind: 'ticker'; symbol: string; provider: 'binance-spot'; source: 'websocket' | 'rest:watchdog'; providerInstrument: string; priceType: 'LAST'; eventTime: number; price: string; change24h: string; volume24h: string; high24h: string; low24h: string }
  | { kind: 'kline'; symbol: string; provider: 'binance-spot'; source: 'websocket:kline'; providerInstrument: string; eventTime: number; openTime: number; closeTime: number; interval: '1m'; open: string; high: string; low: string; close: string; volume: string; closed: boolean }
  | { kind: 'depth'; symbol: string; provider: 'binance-spot'; source: 'websocket'; providerInstrument: string; eventTime: number; updateId: number; bids: Array<[string, string]>; asks: Array<[string, string]> }
  | { kind: 'trade'; symbol: string; provider: 'binance-spot'; source: 'websocket'; providerInstrument: string; eventTime: number; tradeId: number; price: string; quantity: string; maker: boolean };

export interface BinanceOrderBook {
  pair: string;
  bids: Array<{ orderId: string; price: string; amount: string }>;
  asks: Array<{ orderId: string; price: string; amount: string }>;
  state: 'LIVE' | 'UNAVAILABLE';
  provider: 'binance-spot';
  source: 'rest';
  observedAt: string | null;
}

export interface BinanceMarketTrade {
  id: string;
  pair: string;
  price: string;
  amount: string;
  executedAt: string;
  side: 'BUY' | 'SELL';
  provider: 'binance-spot';
  source: 'rest';
}

@Injectable()
export class BinanceSpotAdapter implements OnModuleDestroy, MarketProviderAdapter {
  readonly provider = 'binance-spot';
  private readonly logger = new Logger(BinanceSpotAdapter.name);
  private socket?: WebSocket;
  private reconnectTimer?: NodeJS.Timeout;
  private watchdogTimer?: NodeJS.Timeout;
  private reconnectAttempt = 0;
  private eventHandler?: (event: MarketProviderEvent) => void;
  private stopping = false;
  private watchdogInFlight = false;
  private streamRecoveryInFlight = false;
  private streamOpenedAt = 0;
  private lastStreamEventAt = 0;
  private readonly lastTickerAt = new Map<string, number>();
  private readonly quoteStaleAfterMs = this.readQuoteStaleAfterMs();
  private readonly enabled = process.env.MARKET_PROVIDER_ENABLED === 'true';
  private readonly httpUrl = process.env.MARKET_PROVIDER_HTTP_URL?.trim() || 'https://data-api.binance.vision';
  private symbols = ((process.env.MARKET_PROVIDER_SYMBOLS_BINANCE_SPOT ?? process.env.MARKET_PROVIDER_SYMBOLS)?.split(',') ?? ['BTCUSDT'])
    .map((symbol) => symbol.trim().replaceAll('/', '').toLowerCase())
    .filter(Boolean);

  configure(symbols: readonly MarketProviderRuntimeSymbol[]): void {
    this.symbols = [...new Set(symbols.map((entry) => entry.symbol.trim().replaceAll('/', '').toLowerCase()).filter(Boolean))];
  }

  isEnabled(): boolean { return this.enabled; }

  configuredSymbols(): string[] { return [...this.symbols].map((symbol) => symbol.toUpperCase()); }

  supports(pair: string): boolean {
    return this.symbols.includes(pair.replaceAll('/', '').toLowerCase());
  }

  async start(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    if (!this.enabled || this.socket || this.symbols.length === 0) return;
    this.stopping = false;
    this.eventHandler = onEvent;
    if (this.symbols.includes('canonical_crypto')) {
      try {
        this.symbols = (await this.discoverCanonicalCryptoSymbols()).map((symbol) => symbol.toLowerCase());
      } catch (error) {
        this.logger.warn(`Binance Spot exchangeInfo discovery failed: ${error instanceof Error ? error.message : 'unknown error'}`);
        this.symbols = [];
        return;
      }
    }
    if (this.symbols.length === 0) return;
    const streams = this.symbols.flatMap((symbol) => [
      `${symbol}@ticker`, `${symbol}@kline_1m`, `${symbol}@depth20@1000ms`, `${symbol}@trade`,
    ]).join('/');
    const url = process.env.MARKET_PROVIDER_WS_URL?.trim()
      || `wss://stream.binance.com:9443/stream?streams=${streams}`;
    this.streamOpenedAt = Date.now();
    this.lastStreamEventAt = this.streamOpenedAt;
    this.streamRecoveryInFlight = false;
    this.socket = new WebSocket(url);
    const socket = this.socket;
    socket.on('open', () => {
      this.reconnectAttempt = 0;
      this.logger.log(`Connected to Binance Spot public streams for ${this.symbols.length} symbol(s).`);
    });
    socket.on('message', (data: RawData) => {
      this.lastStreamEventAt = Date.now();
      const event = this.normalize(data.toString());
      if (event) {
        if (event.kind === 'ticker') this.lastTickerAt.set(event.symbol.toLowerCase(), Date.now());
        onEvent(event);
      }
    });
    socket.on('error', (error) => this.logger.warn(`Binance Spot stream error: ${error.message}`));
    socket.on('close', () => {
      if (this.socket !== socket) return;
      this.socket = undefined;
      this.streamRecoveryInFlight = false;
      if (!this.stopping) this.scheduleReconnect();
    });
    this.startWatchdog(onEvent);
  }

  onModuleDestroy(): void {
    this.stop();
  }

  stop(): void {
    this.stopping = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.reconnectTimer = undefined;
    this.watchdogTimer = undefined;
    this.watchdogInFlight = false;
    this.streamRecoveryInFlight = false;
    this.streamOpenedAt = 0;
    this.lastStreamEventAt = 0;
    this.socket?.close();
    this.socket = undefined;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.stopping || !this.eventHandler) return;
    const delay = Math.min(1_000 * (2 ** this.reconnectAttempt), 30_000);
    this.reconnectAttempt += 1;
    this.logger.warn(`Binance Spot stream disconnected; reconnecting in ${delay}ms.`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (!this.stopping && !this.socket && this.eventHandler) void this.start(this.eventHandler);
    }, delay);
    this.reconnectTimer.unref?.();
  }

  private startWatchdog(onEvent: (event: MarketProviderEvent) => void): void {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    const interval = Math.max(5_000, Math.floor(this.quoteStaleAfterMs / 2));
    this.watchdogTimer = setInterval(() => { void this.refreshStaleTickers(onEvent); }, interval);
    this.watchdogTimer.unref?.();
    void this.refreshStaleTickers(onEvent);
  }

  private async refreshStaleTickers(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    if (this.stopping || this.watchdogInFlight || this.symbols.length === 0) return;
    const now = Date.now();
    this.recoverSilentStream(now);
    // Refresh quiet symbols with headroom before the public freshness boundary.
    // Waiting until quoteStaleAfterMs means the next watchdog tick can leave a
    // healthy provider row classified STALE for up to half a watchdog period.
    const refreshAfterMs = Math.max(5_000, Math.floor(this.quoteStaleAfterMs / 2));
    const stale = this.symbols.filter((symbol) => now - (this.lastTickerAt.get(symbol) ?? 0) >= refreshAfterMs);
    if (stale.length === 0) return;
    this.watchdogInFlight = true;
    try {
      const quotes = await this.request<Array<Record<string, unknown>>>('/api/v3/ticker/24hr', {
        symbols: JSON.stringify(stale.map((symbol) => symbol.toUpperCase())),
      });
      for (const quote of quotes) {
        const symbol = String(quote.symbol ?? '').toUpperCase();
        const price = String(quote.lastPrice ?? '');
        if (!symbol || !Number.isFinite(Number(price)) || Number(price) <= 0) continue;
        // A successful watchdog fetch is a current observation of Binance's
        // latest quote. ticker/24hr closeTime is market-activity time and can
        // legitimately lag for quiet symbols; using it as observedAt makes a
        // successfully re-observed quote immediately stale.
        const eventTime = Date.now();
        const event: BinanceSpotMarketEvent = {
          kind: 'ticker',
          symbol,
          provider: 'binance-spot',
          source: 'rest:watchdog',
          providerInstrument: symbol,
          priceType: 'LAST',
          eventTime: Number.isFinite(eventTime) && eventTime > 0 ? eventTime : Date.now(),
          price,
          change24h: String(quote.priceChangePercent ?? ''),
          volume24h: String(quote.volume ?? ''),
          high24h: String(quote.highPrice ?? ''),
          low24h: String(quote.lowPrice ?? ''),
        };
        this.lastTickerAt.set(symbol.toLowerCase(), Date.now());
        onEvent(event);
      }
    } catch (error) {
      this.logger.warn(`Binance Spot REST watchdog failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      this.watchdogInFlight = false;
    }
  }

  private recoverSilentStream(now: number): boolean {
    if (!this.socket || this.stopping || this.streamRecoveryInFlight) return false;
    const lastActivity = Math.max(this.streamOpenedAt, this.lastStreamEventAt);
    if (lastActivity <= 0 || now - lastActivity < this.quoteStaleAfterMs * 2) return false;
    this.streamRecoveryInFlight = true;
    this.logger.warn(`Binance Spot stream silent for ${now - lastActivity}ms; terminating it for bounded reconnect/resubscribe.`);
    this.socket.terminate();
    return true;
  }

  private readQuoteStaleAfterMs(): number {
    const value = Number.parseInt(process.env.MARKET_QUOTE_STALE_AFTER_MS ?? '30000', 10);
    return Number.isFinite(value) && value > 0 ? value : 30000;
  }

  async fetchKlines(pair: string, interval = '1m', limit = 240): Promise<unknown[][]> {
    const symbol = this.assertSupported(pair);
    return this.request<unknown[][]>('/api/v3/klines', { symbol, interval, limit: String(limit) });
  }

  async fetchHistory(pair: string, interval: MarketKlineInterval, limit: number): Promise<MarketKlineInput[]> {
    const rows = await this.fetchKlines(pair, interval, Math.min(500, Math.max(40, limit)));
    const symbol = pair.replaceAll('/', '').toUpperCase();
    return rows.flatMap((row) => {
      const openTimeMs = Number(row[0]);
      const closeTimeMs = Number(row[6]);
      const values = [row[1], row[2], row[3], row[4]].map(Number);
      if (!Number.isFinite(openTimeMs) || !Number.isFinite(closeTimeMs) || values.some((value) => !Number.isFinite(value) || value <= 0)) return [];
      const volume = Number(row[5]);
      return [{
        symbol, interval, openTime: new Date(openTimeMs), closeTime: new Date(closeTimeMs),
        open: String(row[1]), high: String(row[2]), low: String(row[3]), close: String(row[4]),
        volume: Number.isFinite(volume) && volume >= 0 ? String(row[5]) : null,
        provider: this.provider, source: 'binance:rest:kline', observedAt: new Date(Math.min(Date.now(), closeTimeMs)),
      } satisfies MarketKlineInput];
    });
  }

  async discoverCanonicalCryptoSymbols(): Promise<string[]> {
    if (!this.enabled) throw new Error('Binance Spot is disabled');
    const exchangeInfo = await this.request<{ symbols?: Array<{ symbol: string; status: string; permissions?: string[]; permissionSets?: string[][] }> }>('/api/v3/exchangeInfo', {
      permissions: 'SPOT',
      symbolStatus: 'TRADING',
    });
    const available = new Set((exchangeInfo.symbols ?? [])
      .filter((entry) => entry.status === 'TRADING' && this.isSpotTradable(entry))
      .map((entry) => entry.symbol.toUpperCase()));
    return CANONICAL_MARKET_CATALOG
      .filter((entry) => entry.category === 'crypto')
      .map((entry) => entry.symbol)
      .filter((symbol) => available.has(symbol));
  }

  private isSpotTradable(entry: { permissions?: string[]; permissionSets?: string[][] }): boolean {
    if (entry.permissions?.includes('SPOT')) return true;
    if (entry.permissionSets?.some((set) => set.includes('SPOT'))) return true;
    // Older exchangeInfo payloads may omit both fields. The caller already
    // requested permissions=SPOT, so absence is not evidence of exclusion.
    return entry.permissions === undefined && entry.permissionSets === undefined;
  }

  async fetchDepth(pair: string, limit = 20): Promise<BinanceOrderBook> {
    const symbol = this.assertSupported(pair);
    const data = await this.request<{ lastUpdateId: number; bids: Array<[string, string]>; asks: Array<[string, string]> }>('/api/v3/depth', { symbol, limit: String(limit) });
    const observedAt = new Date().toISOString();
    return {
      pair: symbol,
      bids: data.bids.map(([price, amount], index) => ({ orderId: `binance:${data.lastUpdateId}:bid:${index}`, price, amount })),
      asks: data.asks.map(([price, amount], index) => ({ orderId: `binance:${data.lastUpdateId}:ask:${index}`, price, amount })),
      state: 'LIVE', provider: 'binance-spot', source: 'rest', observedAt,
    };
  }

  async fetchTrades(pair: string, limit = 50): Promise<BinanceMarketTrade[]> {
    const symbol = this.assertSupported(pair);
    const data = await this.request<Array<{ id: number; price: string; qty: string; time: number; isBuyerMaker: boolean }>>('/api/v3/trades', { symbol, limit: String(limit) });
    return data.map((trade) => ({
      id: `binance:${symbol}:${trade.id}`, pair: symbol, price: trade.price, amount: trade.qty,
      executedAt: new Date(trade.time).toISOString(), side: trade.isBuyerMaker ? 'SELL' : 'BUY', provider: 'binance-spot', source: 'rest',
    }));
  }

  private assertSupported(pair: string): string {
    const symbol = pair.replaceAll('/', '').toUpperCase();
    if (!this.enabled || !this.supports(symbol)) throw new Error(`Binance Spot is unavailable for ${symbol}`);
    return symbol;
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams(params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${this.httpUrl}${path}?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Binance REST ${response.status}`);
      return await response.json() as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private normalize(raw: string): BinanceSpotMarketEvent | null {
    try {
      const envelope = JSON.parse(raw) as { data?: Record<string, unknown>; stream?: string };
      const data = envelope.data ?? envelope as Record<string, unknown>;
      const event = String(data.e ?? '');
      const streamSymbol = envelope.stream?.split('@', 1)[0];
      const symbol = String(data.s ?? streamSymbol ?? '').toUpperCase();
      const eventTime = Number(data.E ?? Date.now());
      if (!symbol || !Number.isFinite(eventTime)) return null;
      if (event === '24hrTicker') return { kind: 'ticker', symbol, provider: 'binance-spot', source: 'websocket', providerInstrument: symbol, priceType: 'LAST', eventTime, price: String(data.c), change24h: String(data.P), volume24h: String(data.v), high24h: String(data.h), low24h: String(data.l) };
      if (event === 'kline') {
        const kline = data.k as Record<string, unknown>;
        if (String(kline.i) !== '1m') return null;
        return { kind: 'kline', symbol, provider: 'binance-spot', source: 'websocket:kline', providerInstrument: symbol, eventTime, openTime: Number(kline.t), closeTime: Number(kline.T), interval: '1m', open: String(kline.o), high: String(kline.h), low: String(kline.l), close: String(kline.c), volume: String(kline.v), closed: kline.x === true };
      }
      if (event === 'depthUpdate' || Number.isFinite(Number(data.lastUpdateId))) {
        return {
          kind: 'depth', symbol, provider: 'binance-spot', source: 'websocket', providerInstrument: symbol,
          eventTime, updateId: Number(data.u ?? data.lastUpdateId),
          bids: (data.b ?? data.bids as Array<[string, string]>) as Array<[string, string]> ?? [],
          asks: (data.a ?? data.asks as Array<[string, string]>) as Array<[string, string]> ?? [],
        };
      }
      if (event === 'trade') return { kind: 'trade', symbol, provider: 'binance-spot', source: 'websocket', providerInstrument: symbol, eventTime, tradeId: Number(data.t), price: String(data.p), quantity: String(data.q), maker: data.m === true };
      return null;
    } catch { return null; }
  }
}
