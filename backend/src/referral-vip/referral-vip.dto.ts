import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimReferralDto {
  @ApiPropertyOptional({ description: 'Referral code captured before first wallet sign-in.' })
  @IsOptional()
  @IsString()
  @Length(4, 64)
  referralCode?: string;
}

export class UpdateVipLevelDto {
  @IsInt()
  @Min(0)
  @Max(999)
  level!: number;

  @IsString()
  @Length(1, 64)
  name!: string;

  @IsString()
  @Length(1, 128)
  threshold!: string;

  @IsOptional()
  @IsObject()
  benefits?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsString()
  @Length(3, 500)
  reason!: string;
}

export class AssignVipDto {
  @IsInt()
  @Min(100000)
  @Max(999999)
  userCode!: number;

  @IsInt()
  @Min(0)
  @Max(999)
  level!: number;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  progress?: string;

  @IsString()
  @Length(3, 500)
  reason!: string;
}

export class UpdateVipPolicyDto {
  @IsString()
  @Length(2, 20)
  baseAsset!: string;

  @IsString()
  @Length(3, 500)
  reason!: string;
}

export class UpdateReferralRewardPolicyDto {
  @IsBoolean()
  enabled!: boolean;

  @IsIn(['FIXED', 'PERCENT'])
  @IsString()
  @Length(1, 16)
  mode!: 'FIXED' | 'PERCENT';

  @IsOptional()
  @IsString()
  @Length(1, 64)
  value?: string | null;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  asset?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  minimumFirstDeposit?: string | null;

  @IsString()
  @Length(3, 500)
  reason!: string;
}

export class InvalidateExternalDepositDto {
  @IsIn(['DEPOSIT', 'DEPOSIT_CLAIM'])
  sourceType!: 'DEPOSIT' | 'DEPOSIT_CLAIM';

  @IsString()
  @Length(1, 160)
  sourceId!: string;

  @IsString()
  @Length(3, 500)
  reason!: string;
}


export class ClearVipOverrideDto {
  @IsInt()
  @Min(100000)
  @Max(999999)
  userCode!: number;

  @IsString()
  @Length(3, 500)
  reason!: string;
}
