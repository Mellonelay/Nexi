import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class ApplyLoanDto {
  @IsString()
  @Length(1, 128)
  planId!: string;

  @IsString()
  @Length(1, 64)
  amount!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration!: number;

  @IsString()
  @Length(1, 2048)
  collateralImg!: string;

  @IsString()
  @Length(1, 2048)
  collateral!: string;

  @IsString()
  @Length(1, 128)
  idempotencyKey!: string;
}

export class LoanTargetDto {
  @IsString()
  @Length(1, 128)
  loanId!: string;

  @IsString()
  @Length(1, 128)
  idempotencyKey!: string;
}

export class LoanAdminDecisionDto {
  @IsString()
  @Length(1, 128)
  idempotencyKey!: string;

  @IsString()
  @Length(1, 512)
  reason!: string;
}

/** Compatibility payload for the legacy /loans/admin/* endpoints. */
export class LoanLegacyAdminDecisionDto extends LoanAdminDecisionDto {
  @IsString()
  @Length(1, 128)
  loanId!: string;
}

export class LoanRepaymentDto extends LoanTargetDto {
  @IsString()
  @Length(1, 64)
  amount!: string;
}
