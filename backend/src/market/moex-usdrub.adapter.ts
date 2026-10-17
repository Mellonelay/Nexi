import { Injectable, Logger } from '@nestjs/common';
import type { MarketKlineInput, MarketKlineInterval } from './market-kline.contract';
import type { MarketProviderAdapter, MarketProviderEvent, MarketProviderRuntimeSymbol, ProviderQuoteEvent } from './market-provider.adapter';

const MOEX_SYMBOL = 'USD000UTSTOM';
const MOEX_BASE = 'https://iss.moex.com';
const CORE_INTERVALS = new Set<MarketKlineInterval>(['1m', '5m', '15m', '30m', '1h', '4h', '1d']);
const MOEX_TRADING_STATUSES = new Set(['N', 'O', 'C', 'F', 'B', 'T', 'I', 'S', 'A', 'a', 'b', 'p', 'P']);
const MOEX_CLOSED_STATUSES = new Set(['N', 'C', 'B']);

type MoexTable = { columns?: string[]; data?: unknown[][] };
type MoexPayload = { marketdata?: MoexTable; candles?: MoexTable };

@Injectable()
export class MoexUsdRubAdapter implements MarketProviderAdapter {
  readonly provider = 'moex';
  private readonly logger = new Logger(MoexUsdRubAdapter.name);
  private enabled = false;
  private timer?: NodeJS.Timeout;

  configure(symbols: readonly MarketProviderRuntimeSymbol[]): void {
    this.enabled = symbols.some((entry) => entry.symbol === 'USDRUB');
  }

  isEnabled(): boolean {
    return process.env.MARKET_PROVIDER_ENABLED === 'true' && this.enabled;
  }

  async start(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    if (!this.isEnabled()) return;
    await this.poll(onEvent);
    const interval = Math.max(15_000, Number(process.env.MOEX_POLL_INTERVAL_MS ?? 30_000));
    this.timer = setInterval(() => { void this.poll(onEvent); }, interval);
    this.timer.unref?.();
    this.logger.log(`MOEX ISS delayed USD/RUB polling started every ${interval}ms.`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async fetchHistory(symbol: string, interval: MarketKlineInterval, limit: number): Promise<MarketKlineInput[]> {
    if (symbol !== 'USDRUB' || !CORE_INTERVALS.has(interval)) return [];
    const { sourceMinutes, targetMinutes, lookbackDays } = this.intervalPlan(interval);
    const today = new Date();
    const from = new Date(today.getTime() - lookbackDays * 86_400_000).toISOString().slice(0, 10);
    const till = today.toISOString().slice(0, 10);
    const url = new URL(`/iss/engines/currency/markets/selt/boards/CETS/securities/${MOEX_SYMBOL}/candles.json`, MOEX_BASE);
    url.searchParams.set('iss.meta', 'off');
    url.searchParams.set('interval', String(sourceMinutes === 1_440 ? 24 : sourceMinutes));
    url.searchParams.set('from', from);
    url.searchParams.set('till', till);
    url.searchParams.set('candles.columns', 'begin,end,open,close,high,low,value,volume');
    const payload = await this.request<MoexPayload>(url);
    const rows = this.tableRows(payload.candles);
    const base = rows.flatMap((row) => this.rowToBar(row, sourceMinutes));
    const aggregated = targetMinutes === sourceMinutes ? base : this.aggregate(base, targetMinutes);
    return aggregated.slice(-Math.min(500, Math.max(40, limit))).map((bar) => ({
      symbol: 'USDRUB', interval, openTime: bar.openTime, closeTime: bar.closeTime,
      open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume,
      provider: this.provider, source: 'moex:iss:delayed:candles', observedAt: bar.closeTime,
    }));
  }

  private async poll(onEvent: (event: MarketProviderEvent) => void): Promise<void> {
    try {
      const url = new URL(`/iss/engines/currency/markets/selt/boards/CETS/securities/${MOEX_SYMBOL}.json`, MOEX_BASE);
      url.searchParams.set('iss.meta', 'off');
      url.searchParams.set('iss.only', 'marketdata');
      url.searchParams.set('marketdata.columns', 'SECID,LAST,BID,OFFER,TIME,SYSTIME,TRADINGSTATUS');
      const payload = await this.request<MoexPayload>(url);
      const row = this.tableRows(payload.marketdata)[0];
      if (!row) return;
      const tradingStatus = String(row.TRADINGSTATUS ?? '');
      if (!MOEX_TRADING_STATUSES.has(tradingStatus)) return;
      const closed = MOEX_CLOSED_STATUSES.has(tradingStatus);
      const last = Number(row.LAST);
      const bid = Number(row.BID);
      const ask = Number(row.OFFER);
      if (!closed && (!Number.isFinite(last) || last <= 0)) return;
      const observedAt = this.parseMoexSystemTime(String(row.SYSTIME ?? '')) ?? new Date();
      const spread = Number.isFinite(bid) && Number.isFinite(ask) && ask >= bid ? ask - bid : undefined;
      const event: ProviderQuoteEvent = {
        kind: 'ticker', symbol: 'USDRUB', provider: this.provider,
        source: closed ? 'moex:iss:delayed:closed-market' : 'moex:iss:delayed',
        providerInstrument: MOEX_SYMBOL, priceType: 'REFERENCE', eventTime: observedAt.getTime(),
        price: Number.isFinite(last) && last > 0 ? String(last) : undefined,
        bid: Number.isFinite(bid) && bid > 0 ? String(bid) : undefined,
        ask: Number.isFinite(ask) && ask > 0 ? String(ask) : undefined,
        spread: spread === undefined ? undefined : String(spread),
        sessionState: closed ? 'CLOSED' : 'OPEN',
      };
      onEvent(event);
    } catch (error) {
      this.logger.warn(`MOEX USD/RUB quote request failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private intervalPlan(interval: MarketKlineInterval): { sourceMinutes: number; targetMinutes: number; lookbackDays: number } {
    const target: Record<string, number> = { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240, '1d': 1_440 };
    const targetMinutes = target[interval];
    const sourceMinutes = interval === '30m' ? 10 : interval === '4h' ? 60 : interval === '1d' ? 1_440 : interval === '1h' ? 60 : 1;
    const lookbackDays = interval === '1d' ? 500 : interval === '4h' ? 180 : interval === '1h' ? 60 : interval === '30m' ? 35 : interval === '15m' ? 20 : interval === '5m' ? 10 : 5;
    return { sourceMinutes, targetMinutes, lookbackDays };
  }

  private rowToBar(row: Record<string, unknown>, sourceMinutes: number) {
    const openTime = this.parseMoexCandleTime(String(row.begin ?? ''));
    const end = this.parseMoexCandleTime(String(row.end ?? ''));
    const values = [row.open, row.high, row.low, row.close].map(Number);
    if (!openTime || values.some((value) => !Number.isFinite(value) || value <= 0)) return [];
    const closeTime = end ?? new Date(openTime.getTime() + sourceMinutes * 60_000 - 1);
    return [{ openTime, closeTime, open: String(values[0]), high: String(values[1]), low: String(values[2]), close: String(values[3]), volume: null as string | null }];
  }

  private aggregate(bars: Array<{ openTime: Date; closeTime: Date; open: string; high: string; low: string; close: string; volume: string | null }>, targetMinutes: number) {
    const bucketMs = targetMinutes * 60_000;
    const buckets = new Map<number, typeof bars>();
    for (const bar of bars) {
      const key = Math.floor(bar.openTime.getTime() / bucketMs) * bucketMs;
      const bucket = buckets.get(key) ?? [];
      bucket.push(bar);
      buckets.set(key, bucket);
    }
    return [...buckets.entries()].sort(([a], [b]) => a - b).map(([key, bucket]) => ({
      openTime: new Date(key), closeTime: new Date(key + bucketMs - 1),
      open: bucket[0].open, high: String(Math.max(...bucket.map((bar) => Number(bar.high)))),
      low: String(Math.min(...bucket.map((bar) => Number(bar.low)))), close: bucket.at(-1)!.close, volume: null as string | null,
    }));
  }

  private tableRows(table?: MoexTable): Array<Record<string, unknown>> {
    if (!table?.columns || !table.data) return [];
    return table.data.map((row) => Object.fromEntries(table.columns!.map((column, index) => [column, row[index]])));
  }

  private parseMoexSystemTime(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return null;
    const parsed = new Date(value.replace(' ', 'T') + '+03:00');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseMoexCandleTime(value: string): Date | null {
    return this.parseMoexSystemTime(value);
  }

  private async request<T>(url: URL): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`MOEX ISS ${response.status}`);
      return await response.json() as T;
    } finally { clearTimeout(timeout); }
  }
}
