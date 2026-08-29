import { Injectable, Logger } from '@nestjs/common';
import { BinanceSpotAdapter } from './binance-spot.adapter';
import { FinnhubMarketAdapter } from './finnhub-market.adapter';
import { MassiveMarketAdapter } from './massive-market.adapter';
import { MarketProviderAdapter, MarketProviderEvent } from './market-provider.adapter';
import { MetalsApiMarketAdapter } from './metals-api-market.adapter';
import { MetalpriceApiMarketAdapter } from './metalprice-api-market.adapter';
import { OandaMarketAdapter } from './oanda-market.adapter';
import { AlphaVantageMarketAdapter } from './alpha-vantage-market.adapter';
import { TickDbMarketAdapter } from './tickdb-market.adapter';
import { FawazCurrencyMarketAdapter } from './fawaz-currency-market.adapter';
import { RzzroIndustrialMetalsMarketAdapter } from './rzzro-industrial-metals-market.adapter';
import { YahooMarketAdapter } from './yahoo-market.adapter';
import { CoinGeckoMarketAdapter } from './coingecko-market.adapter';
import { CoinMarketCapMarketAdapter } from './coinmarketcap-market.adapter';
import { OkxMarketAdapter, BitgetMarketAdapter, HtxMarketAdapter, BybitMarketAdapter, GateMarketAdapter } from './public-exchange-market.adapter';

@Injectable()
export class MarketProviderRouterService {
  private readonly logger = new Logger(MarketProviderRouterService.name);
  private readonly adapters: readonly MarketProviderAdapter[];

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
    coingecko: CoinGeckoMarketAdapter,
    coinmarketcap: CoinMarketCapMarketAdapter,
    okx: OkxMarketAdapter,
    bitget: BitgetMarketAdapter,
    htx: HtxMarketAdapter,
    bybit: BybitMarketAdapter,
    gate: GateMarketAdapter,
  ) {
    this.adapters = [binance, yahoo, coingecko, coinmarketcap, massive, finnhub, oanda, metalsApi, metalpriceApi, alphaVantage, tickdb, fawazCurrency, rzzroIndustrialMetals, okx, bitget, htx, bybit, gate];
  }

  async start(onEvent: (event: MarketProviderEvent) => void): Promise<boolean> {
    const configured = this.configuredProviders();
    const selected = this.adapters.filter((adapter) => configured.includes(adapter.provider));
    if (selected.length === 0) {
      this.logger.warn(`Configured market provider is unsupported or missing: ${configured.join(', ') || 'missing'}.`);
      return false;
    }
    let started = false;
    for (const adapter of selected) {
      if (!adapter.isEnabled()) continue;
      await adapter.start(onEvent);
      started = true;
    }
    return started;
  }

  stop(): void { for (const adapter of this.adapters) adapter.stop(); }

  private configuredProviders(): string[] {
    const multi = process.env.MARKET_PROVIDER_NAMES?.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean) ?? [];
    const legacy = process.env.MARKET_PROVIDER_NAME?.trim().toLowerCase();
    return [...new Set(multi.length ? multi : legacy ? [legacy] : [])];
  }
}
