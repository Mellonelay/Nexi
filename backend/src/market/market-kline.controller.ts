import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MarketKlineQueryDto, MarketKlineResponseDto } from "./market-kline.dto";
import { MarketKlineQueryService } from './market-kline-query.service';

@ApiTags("Market Data")
@Controller("market")
export class MarketKlineController {
  constructor(private readonly marketKlines: MarketKlineQueryService) {}

  @Get("klines")
  @ApiOkResponse({ type: MarketKlineResponseDto })
  async list(@Query() query: MarketKlineQueryDto) {
    return this.marketKlines.list(query);
  }
}
