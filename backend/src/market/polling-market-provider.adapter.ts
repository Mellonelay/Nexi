import { Logger } from '@nestjs/common';
import { CANONICAL_MARKET_CATALOG } from './market-catalog';
import { getProviderMapping, getMarketSourcePolicy } from './market-source-registry';
import { MarketProviderAdapter, MarketProviderRuntimeSymbol, ProviderQuoteEvent } from './market-provider.adapter';

/**
 * Common disabled-by-default REST polling base. A provider starts only when it
 * is explicitly selected and every required credential/configuration key is
 * present. It never substitutes a provider or invents a missing quote.
 */
export abstract class PollingMarketProviderAdapter implements MarketProviderAdapter {
  abstract readonly provider: string;
  protected readonly logger = new Logger(this.constructor.name);
  private timer?: NodeJS.Timeout;
  private runtimeSymbols?: string[];

  configure(symbols: readonly MarketProviderRuntimeSymbol[]): void {
    this.runtimeSymbols = [...new Set(symbols.map((entry) => entry.symbol.trim().toUpperCase()).filter(Boolean))];
  }

  protected abstract requiredEnvironmentKeys(): readonly string[];
  protected abstract fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null>;
  protected pollSpacingMs(): number { return 0; }

  isEnabled(): boolean {
    return process.env.MARKET_PROVIDER_ENABLED === 'true'
      && this.requiredEnvironmentKeys().every((key) => Boolean(process.env[key]?.trim()));
  }

  async start(onEvent: (event: ProviderQuoteEvent) => void): Promise<void> {
    if (!this.isEnabled()) return;
    const symbols = this.configuredSymbols();
    if (symbols.length === 0) {
      this.logger.warn(`${this.provider} is selected but no compatible canonical symbols are configured.`);
      return;
    }
    await this.poll(symbols, onEvent);
    const interval = this.pollIntervalMs();
    this.timer = setInterval(() => { void this.poll(symbols, onEvent); }, interval);
    this.timer.unref?.();
    this.logger.log(`${this.provider} REST polling started for ${symbols.length} canonical symbol(s) every ${interval}ms.`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  protected async requestJson<T>(baseUrl: string, path: string, params: Record<string, string>, headers: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) throw new Error(`${this.provider} REST ${response.status}`);
      return await response.json() as T;
    } finally {
      clearTimeout(timer);
    }
  }

  protected mapping(symbol: string) {
    const mapping = getProviderMapping(symbol, this.provider);
    if (!mapping) throw new Error(`${this.provider} is not mapped for canonical symbol ${symbol}`);
    return mapping;
  }

  protected quote(input: Omit<ProviderQuoteEvent, 'kind' | 'provider'>): ProviderQuoteEvent {
    return { kind: 'ticker', provider: this.provider, ...input };
  }

  private configuredSymbols(): string[] {
    if (this.runtimeSymbols) return this.runtimeSymbols;
    const providerKey = this.provider.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const configured = process.env[`MARKET_PROVIDER_SYMBOLS_${providerKey}`] ?? process.env.MARKET_PROVIDER_SYMBOLS;
    const raw = configured?.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean) ?? [];
    const all = raw.includes('CANONICAL_PRIMARY')
      ? CANONICAL_MARKET_CATALOG
        .filter((entry) => getMarketSourcePolicy(entry.symbol)?.displayPolicy.primaryProvider === this.provider)
        .map((entry) => entry.symbol)
      : raw;
    // Canonical category selectors are deliberately explicit to prevent a
    // paid provider from being subscribed to unrelated assets by accident.
    const categories = new Set(
      raw.flatMap((value) => value === 'CANONICAL_STOCKS' ? ['stock']
        : value === 'CANONICAL_FOREX' ? ['forex']
          : value === 'CANONICAL_METALS' ? ['metal']
            : []),
    );
    const catalogSymbols = categories.size > 0
      ? CANONICAL_MARKET_CATALOG.filter((entry) => categories.has(entry.category)).map((entry) => entry.symbol)
      : all.filter((value) => !value.startsWith('CANONICAL_'));
    return [...new Set(catalogSymbols)]
      .filter((symbol) => getMarketSourcePolicy(symbol)?.providerMappings.some((mapping) => mapping.provider === this.provider
        && (!['okx', 'bitget', 'htx', 'bybit', 'gate'].includes(this.provider) || mapping.quoteSupported)));
  }

  private configuredProviders(): string[] {
    const multi = process.env.MARKET_PROVIDER_NAMES?.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean) ?? [];
    const legacy = process.env.MARKET_PROVIDER_NAME?.trim().toLowerCase();
    return [...new Set(multi.length ? multi : legacy ? [legacy] : [])];
  }

  private pollIntervalMs(): number {
    const parsed = Number(process.env.MARKET_PROVIDER_POLL_INTERVAL_MS ?? '15000');
    return Number.isFinite(parsed) ? Math.max(5_000, Math.min(parsed, 300_000)) : 15_000;
  }

  private async poll(symbols: readonly string[], onEvent: (event: ProviderQuoteEvent) => void): Promise<void> {
    for (const [index, symbol] of symbols.entries()) {
      try {
        const event = await this.fetchQuote(symbol);
        if (event) onEvent(event);
      } catch (error) {
        this.logger.warn(`${this.provider} quote rejected for ${symbol}: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
      const spacing = this.pollSpacingMs();
      if (spacing > 0 && index < symbols.length - 1) await new Promise((resolve) => setTimeout(resolve, spacing));
    }
  }
}
