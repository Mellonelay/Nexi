import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { MARKET_KLINE_INTERVALS } from './market-kline.contract';

export class MarketKlineQueryDto {
  @IsString()
  @Matches(/^[A-Za-z0-9/]{4,24}$/)
  symbol!: string;

  @IsOptional()
  @IsIn(MARKET_KLINE_INTERVALS)
  interval: string = '1m';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(40)
  @Max(500)
  limit = 240;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
