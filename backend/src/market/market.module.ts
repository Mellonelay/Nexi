import { Module } from '@nestjs/common';
import { MarketIngestService } from './market-ingest.service';
import { MarketGateway } from './market.gateway';
import { MarketSeederService } from './market-seeder.service';
import { MarketSubscriberService } from './market-subscriber.service';
import { RedisModule } from '../redis/redis.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';
import { BinaryModule } from '../binary/binary.module';
import { MarketAuthorityService } from './market-authority.service';
import { MarketKlineController } from './market-kline.controller';
import { MarketPublicController } from './market-public.controller';
import { MarketKlineService } from './market-kline.service';
import { MarketKlineQueryService } from './market-kline-query.service';
import { BinanceSpotAdapter } from './binance-spot.adapter';
import { MetalsApiMarketAdapter } from './metals-api-market.adapter';
import { MetalpriceApiMarketAdapter } from './metalprice-api-market.adapter';
import { OandaMarketAdapter } from './oanda-market.adapter';
import { MarketProviderRouterService } from './market-provider-router.service';
import { FawazCurrencyMarketAdapter } from './fawaz-currency-market.adapter';
import { RzzroIndustrialMetalsMarketAdapter } from './rzzro-industrial-metals-market.adapter';
import { YahooMarketAdapter } from './yahoo-market.adapter';
import { BiquoteMarketAdapter } from './biquote-market.adapter';
import { MoexUsdRubAdapter } from './moex-usdrub.adapter';
import { CoinGeckoMarketAdapter } from './coingecko-market.adapter';
import { CoinMarketCapMarketAdapter } from './coinmarketcap-market.adapter';
import { OkxMarketAdapter, BitgetMarketAdapter, HtxMarketAdapter, BybitMarketAdapter, GateMarketAdapter } from './public-exchange-market.adapter';

@Module({
  imports: [D1PrismaModule, RedisModule, BinaryModule],
  controllers: [MarketKlineController, MarketPublicController],
  providers: [MarketAuthorityService, MarketIngestService, MarketGateway, MarketSeederService, MarketSubscriberService, MarketKlineService, MarketKlineQueryService, BinanceSpotAdapter, MoexUsdRubAdapter, BiquoteMarketAdapter, YahooMarketAdapter, CoinGeckoMarketAdapter, CoinMarketCapMarketAdapter, OandaMarketAdapter, MetalsApiMarketAdapter, MetalpriceApiMarketAdapter, FawazCurrencyMarketAdapter, RzzroIndustrialMetalsMarketAdapter, OkxMarketAdapter, BitgetMarketAdapter, HtxMarketAdapter, BybitMarketAdapter, GateMarketAdapter, MarketProviderRouterService],
  exports: [MarketAuthorityService, MarketIngestService, MarketGateway, MarketSeederService, MarketSubscriberService, BinanceSpotAdapter, MoexUsdRubAdapter, BiquoteMarketAdapter, YahooMarketAdapter, CoinGeckoMarketAdapter, CoinMarketCapMarketAdapter, OandaMarketAdapter, MetalsApiMarketAdapter, MetalpriceApiMarketAdapter, FawazCurrencyMarketAdapter, RzzroIndustrialMetalsMarketAdapter, OkxMarketAdapter, BitgetMarketAdapter, HtxMarketAdapter, BybitMarketAdapter, GateMarketAdapter, MarketProviderRouterService],
})
export class MarketModule {}
