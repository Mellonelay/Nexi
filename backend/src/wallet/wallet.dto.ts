import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletActivityPostingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() asset!: string;
  @ApiProperty() kind!: string;
  @ApiProperty() amount!: string;
  @ApiProperty() availableDelta!: string;
  @ApiProperty() lockedDelta!: string;
  @ApiProperty() scope!: string;
  @ApiProperty() referenceType!: string;
  @ApiProperty() referenceId!: string;
  @ApiProperty() idempotencyKey!: string;
  @ApiProperty() correlationId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

export class WalletActivityItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() status!: string;
  @ApiProperty() referenceType!: string;
  @ApiProperty() referenceId!: string;
  @ApiProperty() ledgerCorrelationId!: string;
  @ApiProperty({ type: String, nullable: true }) ledgerPostingId!: string | null;
  @ApiProperty({ type: [WalletActivityPostingResponseDto] }) relatedLedgerPostings!: WalletActivityPostingResponseDto[];
  @ApiProperty({ type: String, nullable: true }) asset!: string | null;
  @ApiProperty({ type: String, nullable: true }) amount!: string | null;
  @ApiProperty({ type: String, nullable: true }) details!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

export class WalletActivityResponseDto {
  @ApiProperty({ type: [WalletActivityItemResponseDto] }) activities!: WalletActivityItemResponseDto[];
  @ApiProperty() hasMore!: boolean;
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}

export class WalletAmountDto {
  @IsString()
  @Length(2, 32)
  currency!: string;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  amount!: number;
}

export class WalletWithdrawalDto extends WalletAmountDto {
  @IsString()
  @Length(1, 256)
  address!: string;
}

export class WalletTargetAmountDto extends WalletAmountDto {
  @IsString()
  @Length(1, 128)
  userId!: string;

  @IsString()
  @Length(1, 500)
  reason!: string;
}

export class WalletTargetWithdrawalDto extends WalletTargetAmountDto {
  @IsString()
  @Length(1, 256)
  address!: string;
}

export class ApproveWithdrawalDto {
  @IsString()
  @Length(1, 128)
  requestId!: string;

  @IsString()
  @Length(1, 256)
  txHash!: string;
}

export class RejectWithdrawalDto {
  @IsString()
  @Length(1, 128)
  requestId!: string;

  @IsString()
  @Length(1, 500)
  reason!: string;
}
