import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Gate2SpotOrderType, OrderSide } from '../prisma/d1-client';

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

export class PlaceOrderDto {
  @IsString()
  @Length(3, 64)
  pair!: string;

  @IsEnum(OrderSide)
  side!: OrderSide;

  @IsEnum(Gate2SpotOrderType)
  type!: Gate2SpotOrderType;

  @IsString()
  @Matches(DECIMAL)
  amount!: string;

  @IsOptional()
  @IsString()
  @Matches(DECIMAL)
  price?: string;

  @IsOptional()
  @IsString()
  @Matches(DECIMAL)
  stopPrice?: string;

  @IsString()
  @Length(8, 160)
  idempotencyKey!: string;
}

export class CancelOrderDto {
  @IsString()
  @Length(1, 128)
  orderId!: string;
}
