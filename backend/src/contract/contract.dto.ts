import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class ContractDealDto {
  @IsOptional()
  @IsString()
  @Length(2, 64)
  symbol?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  currency_id?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  direction?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  side?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  type?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  share?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  leverNumber?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  leverage?: number;
}

export class SetStopDto {
  @IsString()
  @Length(1, 128)
  id!: string;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  target_profit_price!: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  stop_loss_price!: number;
}

export class ClosePositionDto {
  @IsOptional()
  @IsString()
  @Length(1, 128)
  positionId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  id?: string;
}

export class TradeQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 32)
  status?: string;
}
