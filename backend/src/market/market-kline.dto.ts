import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MARKET_KLINE_INTERVALS, MarketKlineInterval } from './market-kline.contract';

export class MarketKlineQueryDto {
  @ApiProperty({ description: 'Canonical market pair, with or without a slash.', example: 'BTCUSDT' })
  @IsString()
  @Matches(/^[A-Za-z0-9/]{4,24}$/)
  symbol!: string;

  @ApiPropertyOptional({ enum: MARKET_KLINE_INTERVALS, default: '1m' })
  @IsOptional()
  @IsIn(MARKET_KLINE_INTERVALS)
  interval: MarketKlineInterval = '1m';

  @ApiPropertyOptional({ minimum: 40, maximum: 500, default: 240 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(40)
  @Max(500)
  limit = 240;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class MarketKlineCandleDto {
  @ApiProperty({ example: 1720000000 }) time!: number;
  @ApiProperty({ example: '100.00' }) open!: string;
  @ApiProperty({ example: '110.00' }) high!: string;
  @ApiProperty({ example: '95.00' }) low!: string;
  @ApiProperty({ example: '105.00' }) close!: string;
  @ApiPropertyOptional({ nullable: true, example: '42.5' }) volume!: string | null;
  @ApiProperty({ example: 'BTCUSDT' }) symbol!: string;
  @ApiProperty({ enum: MARKET_KLINE_INTERVALS, example: '1m' }) interval!: MarketKlineInterval;
  @ApiPropertyOptional({ nullable: true, format: 'date-time' }) closeTime!: string | null;
  @ApiProperty({ example: 'binance-spot' }) provider!: string;
  @ApiProperty({ example: 'rest:klines' }) source!: string;
  @ApiProperty({ format: 'date-time' }) observedAt!: string;
  @ApiProperty({ format: 'date-time' }) receivedAt!: string;
}

export class MarketKlineResponseDto {
  @ApiProperty({ enum: ['LIVE', 'STALE', 'ERROR', 'UNAVAILABLE'] })
  dataState!: 'LIVE' | 'STALE' | 'ERROR' | 'UNAVAILABLE';
  @ApiProperty({ example: 'BTCUSDT' }) symbol!: string;
  @ApiProperty({ enum: MARKET_KLINE_INTERVALS, example: '1m' }) interval!: MarketKlineInterval;
  @ApiProperty({ type: [MarketKlineCandleDto] }) candles!: MarketKlineCandleDto[];
  @ApiPropertyOptional({ nullable: true, format: 'date-time' }) observedAt!: string | null;
  @ApiPropertyOptional() message?: string;
}
