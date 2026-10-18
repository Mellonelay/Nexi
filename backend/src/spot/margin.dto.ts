import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  Length,
  Matches,
} from 'class-validator';

export enum MarginPositionDirection {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum MarginLeverage {
  TWO = 2,
  THREE = 3,
  FIVE = 5,
}

export enum MarginTransferDirection {
  TO_MARGIN = 'TO_MARGIN',
  FROM_MARGIN = 'FROM_MARGIN',
}

const ASSET = /^[A-Z0-9][A-Z0-9._-]{1,19}$/;
const PAIR = /^[A-Z0-9][A-Z0-9._-]{1,19}\/[A-Z0-9][A-Z0-9._-]{1,19}$/;
const POSITIVE_DECIMAL = /^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;
const normalize = ({ value }: { value: unknown }): string =>
  String(value ?? '').trim().toUpperCase();

export class OpenMarginPositionDto {
  @Transform(normalize)
  @IsString()
  @Matches(PAIR)
  pair!: string;

  @IsEnum(MarginPositionDirection)
  direction!: MarginPositionDirection;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(20)
  leverage!: number;

  @IsString()
  @Matches(POSITIVE_DECIMAL)
  collateral!: string;

  @IsString()
  @Length(8, 160)
  idempotencyKey!: string;
}

export class MarginTransferDto {
  @Transform(normalize)
  @IsString()
  @Matches(PAIR)
  pair!: string;

  @IsEnum(MarginTransferDirection)
  direction!: MarginTransferDirection;

  @Transform(normalize)
  @IsString()
  @Matches(ASSET)
  asset!: string;

  @IsString()
  @Matches(POSITIVE_DECIMAL)
  amount!: string;

  @IsString()
  @Length(8, 160)
  idempotencyKey!: string;
}

export class RepayUnmatchedMarginBorrowDto {
  @IsString()
  @Length(8, 160)
  openIdempotencyKey!: string;
}

export class CloseMarginPositionDto {
  @IsString()
  @Length(1, 128)
  positionId!: string;

  @IsString()
  @Length(8, 160)
  idempotencyKey!: string;
}

export class LiquidateMarginPositionDto {
  @IsString()
  @Length(8, 160)
  idempotencyKey!: string;
}

export class CancelPendingMarginPositionDto {
  @IsString()
  @Length(8, 160)
  idempotencyKey!: string;
}
