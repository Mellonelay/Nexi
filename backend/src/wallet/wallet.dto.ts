import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, Length } from 'class-validator';

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
