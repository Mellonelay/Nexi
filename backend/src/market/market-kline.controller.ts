import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MarketKlineQueryDto } from "./market-kline.dto";
import { MarketKlineService } from "./market-kline.service";

@ApiTags("Market Data")
@Controller("market")
export class MarketKlineController {
  constructor(private readonly klines: MarketKlineService) {}

  @Get("klines")
  async list(@Query() query: MarketKlineQueryDto) {
    const symbol = query.symbol.replaceAll("/", "").toUpperCase();
    const candles = await this.klines.list(
      symbol,
      query.interval,
      query.limit,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
    const newest = candles.at(-1)?.observedAt
      ? new Date(candles.at(-1)!.observedAt).getTime()
      : 0;
    const staleAfterMs = Number(
      process.env.MARKET_QUOTE_STALE_AFTER_MS ?? "30000",
    );
    const dataState =
      candles.length === 0
        ? "UNAVAILABLE"
        : Date.now() - newest <= staleAfterMs
          ? "LIVE"
          : "STALE";
    return {
      dataState,
      symbol,
      interval: query.interval,
      candles,
      observedAt: candles.at(-1)?.observedAt ?? null,
      message:
        candles.length > 0
          ? undefined
          : "Authoritative market candles are unavailable.",
    };
  }
}
