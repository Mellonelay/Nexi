import { Injectable, Logger } from '@nestjs/common';
import { BinanceSpotAdapter } from './binance-spot.adapter';
import { FinnhubMarketAdapter } from './finnhub-market.adapter';
import { MassiveMarketAdapter } from './massive-market.adapter';
import { MarketProviderAdapter, MarketProviderEvent, MarketProviderRuntimeSymbol } from './market-provider.adapter';
import type { MarketKlineInput, MarketKlineInterval } from './market-kline.contract';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { getMarketSourcePolicy, getProviderMapping, installRuntimeProviderMappings } from './market-source-registry';
import { MetalsApiMarketAdapter } from './metals-api-market.adapter';
import { MetalpriceApiMarketAdapter } from './metalprice-api-market.adapter';
import { OandaMarketAdapter } from './oanda-market.adapter';
import { AlphaVantageMarketAdapter } from './alpha-vantage-market.adapter';
import { TickDbMarketAdapter } from './tickdb-market.adapter';
import { FawazCurrencyMarketAdapter } from './fawaz-currency-market.adapter';
import { RzzroIndustrialMetalsMarketAdapter } from './rzzro-industrial-metals-market.adapter';
import { YahooMarketAdapter } from './yahoo-market.adapter';
import { BiquoteMarketAdapter } from './biquote-market.adapter';
import { MoexUsdRubAdapter } from './moex-usdrub.adapter';
import { CoinGeckoMarketAdapter } from './coingecko-market.adapter';
import { CoinMarketCapMarketAdapter } from './coinmarketcap-market.adapter';
import { OkxMarketAdapter, BitgetMarketAdapter, HtxMarketAdapter, BybitMarketAdapter, GateMarketAdapter } from './public-exchange-market.adapter';

@Injectable()
export class MarketProviderRouterService {
  private readonly logger = new Logger(MarketProviderRouterService.name);
  private readonly adapters: readonly MarketProviderAdapter[];
  private readonly activeProviders = new Set<string>();

  constructor(
    binance: BinanceSpotAdapter,
    massive: MassiveMarketAdapter,
    finnhub: FinnhubMarketAdapter,
    oanda: OandaMarketAdapter,
    metalsApi: MetalsApiMarketAdapter,
    metalpriceApi: MetalpriceApiMarketAdapter,
    alphaVantage: AlphaVantageMarketAdapter,
    tickdb: TickDbMarketAdapter,
    fawazCurrency: FawazCurrencyMarketAdapter,
    rzzroIndustrialMetals: RzzroIndustrialMetalsMarketAdapter,
    yahoo: YahooMarketAdapter,
    biquote: BiquoteMarketAdapter,
    moex: MoexUsdRubAdapter,
    coingecko: CoinGeckoMarketAdapter,
    coinmarketcap: CoinMarketCapMarketAdapter,
    okx: OkxMarketAdapter,
    bitget: BitgetMarketAdapter,
    htx: HtxMarketAdapter,
    bybit: BybitMarketAdapter,
    gate: GateMarketAdapter,
    private readonly d1: D1PrismaService,
  ) {
    this.adapters = [binance, moex, biquote, yahoo, coingecko, coinmarketcap, massive, finnhub, oanda, metalsApi, metalpriceApi, alphaVantage, tickdb, fawazCurrency, rzzroIndustrialMetals, okx, bitget, htx, bybit, gate];
  }

  async start(onEvent: (event: MarketProviderEvent) => void): Promise<boolean> {
    const runtimePolicy = await this.loadRuntimePolicy();
    const configured = runtimePolicy.size > 0 ? [...runtimePolicy.keys()] : this.configuredProviders();
    const selected = this.adapters.filter((adapter) => configured.includes(adapter.provider));
    if (selected.length === 0) {
      this.logger.warn(`Configured market provider is unsupported or missing: ${configured.join(', ') || 'missing'}.`);
      return false;
    }
    let started = false;
    for (const adapter of selected) {
      const symbols = runtimePolicy.get(adapter.provider);
      if (symbols) adapter.configure?.(symbols);
      if (!adapter.isEnabled()) continue;
      await adapter.start(onEvent);
      this.activeProviders.add(adapter.provider);
      started = true;
    }
    this.logger.log(`Active market providers: ${[...this.activeProviders].join(', ') || 'none'}.`);
    return started;
  }

  async fetchHistory(symbol: string, interval: MarketKlineInterval, limit: number): Promise<MarketKlineInput[]> {
    const normalized = symbol.trim().toUpperCase().replaceAll('/', '');
    const candidates = await this.historyCandidates(normalized);
    for (const provider of candidates) {
      const adapter = this.adapters.find((candidate) => candidate.provider === provider);
      const mapping = getProviderMapping(normalized, provider);
      if (!adapter?.fetchHistory || !mapping?.klineSupported) continue;
      try {
        const rows = await adapter.fetchHistory(normalized, interval, limit);
        if (rows.length > 0) {
          this.logger.log(`Market history ${normalized} ${interval}: ${rows.length} row(s) from ${provider}.`);
          return rows;
        }
      } catch (error) {
        this.logger.warn(`Market history ${normalized} ${interval} failed via ${provider}: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
    return [];
  }

  private async historyCandidates(symbol: string): Promise<string[]> {
    if (this.d1.isEnabled()) {
      try {
        const providers = await this.d1.marketProviderConfig.findMany({
          where: { status: 'ACTIVE', supportsKlines: true },
          orderBy: [{ priority: 'asc' }, { key: 'asc' }],
          include: {
            symbols: {
              where: { enabled: true },
              orderBy: { priority: 'asc' },
              include: { pair: { select: { symbol: true, status: true } } },
            },
          },
        });
        return providers
          .flatMap((provider) => provider.symbols
            .filter((mapping) => mapping.pair.status === 'ACTIVE' && mapping.pair.symbol === symbol)
            .map((mapping) => ({ provider: provider.key, mappingPriority: mapping.priority, providerPriority: provider.priority })))
          .sort((a, b) => a.mappingPriority - b.mappingPriority || a.providerPriority - b.providerPriority || a.provider.localeCompare(b.provider))
          .map((entry) => entry.provider);
      } catch (error) {
        this.logger.warn(`D1 market history policy load failed for ${symbol}: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
    return getMarketSourcePolicy(symbol)?.providerMappings
      .filter((mapping) => mapping.klineSupported)
      .map((mapping) => mapping.provider) ?? [];
  }

  stop(): void {
    for (const adapter of this.adapters) adapter.stop();
    this.activeProviders.clear();
  }

  isProviderEnabled(provider?: string | null): boolean {
    if (!provider) return false;
    if (this.activeProviders.size > 0) return this.activeProviders.has(provider.trim().toLowerCase());
    return this.configuredProviders().includes(provider.trim().toLowerCase());
  }

  private configuredProviders(): string[] {
    const multi = process.env.MARKET_PROVIDER_NAMES?.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean) ?? [];
    const legacy = process.env.MARKET_PROVIDER_NAME?.trim().toLowerCase();
    return [...new Set(multi.length ? multi : legacy ? [legacy] : [])];
  }

  private async loadRuntimePolicy(): Promise<Map<string, MarketProviderRuntimeSymbol[]>> {
    if (!this.d1.isEnabled()) return new Map();
    try {
      const providers = await this.d1.marketProviderConfig.findMany({
        where: { status: 'ACTIVE', supportsQuotes: true },
        orderBy: [{ priority: 'asc' }, { key: 'asc' }],
        include: {
          symbols: {
            where: { enabled: true },
            orderBy: { priority: 'asc' },
            include: { pair: { select: { symbol: true, status: true } } },
          },
        },
      });
      const allMappings: Array<{ symbol: string; provider: string; providerInstrument: string }> = [];
      const bySymbol = new Map<string, Array<{ provider: string; symbol: string; providerInstrument: string; mappingPriority: number; providerPriority: number }>>();
      for (const provider of providers) {
        for (const mapping of provider.symbols) {
          if (mapping.pair.status !== 'ACTIVE') continue;
          const staticMapping = getMarketSourcePolicy(mapping.pair.symbol)?.providerMappings
            .find((candidate) => candidate.provider === provider.key);
          if (!staticMapping?.quoteSupported) continue;
          const entry = {
            provider: provider.key,
            symbol: mapping.pair.symbol,
            providerInstrument: mapping.providerSymbol,
            mappingPriority: mapping.priority,
            providerPriority: provider.priority,
          };
          allMappings.push(entry);
          const existing = bySymbol.get(entry.symbol) ?? [];
          existing.push(entry);
          bySymbol.set(entry.symbol, existing);
        }
      }
      installRuntimeProviderMappings(allMappings);

      const selected = new Map<string, MarketProviderRuntimeSymbol[]>();
      for (const entries of bySymbol.values()) {
        entries.sort((a, b) => a.mappingPriority - b.mappingPriority || a.providerPriority - b.providerPriority || a.provider.localeCompare(b.provider));
        for (const entry of entries.slice(0, 2)) {
          const symbols = selected.get(entry.provider) ?? [];
          symbols.push({ symbol: entry.symbol, providerInstrument: entry.providerInstrument });
          selected.set(entry.provider, symbols);
        }
      }
      this.logger.log(`Loaded D1 market policy: ${allMappings.length} callable mapping(s), ${selected.size} active provider(s).`);
      return selected;
    } catch (error) {
      this.logger.warn(`D1 market policy load failed; using bootstrap provider configuration: ${error instanceof Error ? error.message : 'unknown error'}`);
      return new Map();
    }
  }
}
