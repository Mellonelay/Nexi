import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsNumber, IsPositive, IsString, Length, Matches, MinLength } from 'class-validator';
import { BinarySide, LedgerType, OrderSide, OrderType } from '@prisma/client';

const amountOptions = { allowInfinity: false, allowNaN: false };

export class SpotOrderInputDto {
  @IsString() @MinLength(1) accountId!: string;
  @IsString() @Matches(/^[A-Z0-9._-]+\/[A-Z0-9._-]+$/) pair!: string;
  @IsEnum(OrderSide) side!: OrderSide;
  @IsEnum(OrderType) type!: OrderType;
  @Type(() => Number) @IsNumber(amountOptions) @IsPositive() amount!: number;
  @Type(() => Number) @IsNumber(amountOptions) @IsPositive() limitPrice?: number;
  @IsString() @Length(16, 128) idempotencyKey!: string;
}

export class WalletMutationInputDto {
  @IsString() @MinLength(1) accountId!: string;
  @IsString() @Length(2, 20) @Matches(/^[A-Z0-9._-]+$/) asset!: string;
  @Type(() => Number) @IsNumber(amountOptions) @IsPositive() amount!: number;
  @IsString() @Length(16, 128) idempotencyKey!: string;
}

export class SettlementInputDto {
  @IsString() @MinLength(1) positionId!: string;
  @IsString() @MinLength(1) authorityReference!: string;
  @IsString() @Length(16, 128) idempotencyKey!: string;
}

export class SandboxScenarioInputDto {
  @IsString() @MinLength(1) scopeId!: string;
  @IsString() @MinLength(1) scenario!: string;
  @IsString() @MinLength(1) auditReference!: string;
}

export class BinaryPositionInputDto {
  @IsString() @MinLength(1) accountId!: string;
  @IsString() @Matches(/^[A-Z0-9._-]+\/[A-Z0-9._-]+$/) pair!: string;
  @IsEnum(BinarySide) side!: BinarySide;
  @Type(() => Number) @IsNumber(amountOptions) @IsPositive() amount!: number;
  @IsISO8601() expiryAt!: string;
  @IsString() @Length(16, 128) idempotencyKey!: string;
}

export class LedgerMutationInputDto {
  @IsString() @MinLength(1) accountId!: string;
  @IsString() @Length(2, 20) asset!: string;
  @Type(() => Number) @IsNumber(amountOptions) @IsPositive() amount!: number;
  @IsEnum(LedgerType) type!: LedgerType;
  @IsString() @MinLength(1) referenceType!: string;
  @IsString() @MinLength(1) referenceId!: string;
  @IsString() @Length(16, 128) idempotencyKey!: string;
}
