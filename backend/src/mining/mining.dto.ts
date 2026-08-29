import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class MiningSubscribeDto {
  @IsString()
  @Length(1, 128)
  planId!: string;

  @IsString()
  @Length(1, 64)
  amount!: string;

  @IsString()
  @Length(1, 128)
  idempotencyKey!: string;
}

export class MiningSubscriptionActionDto {
  @IsString()
  @Length(1, 128)
  subscriptionId!: string;

  @IsString()
  @Length(1, 128)
  idempotencyKey!: string;
}

export class CreateMiningPlanRequestDto {
  @IsString()
  @Length(1, 128)
  name!: string;

  @IsString()
  @Length(1, 32)
  dailyYield!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  lockupPeriod!: number;

  @IsString()
  @Length(1, 64)
  min!: string;

  @IsString()
  @Length(1, 64)
  max!: string;

  @IsOptional()
  @IsString()
  @Length(2, 32)
  currency?: string;
}
