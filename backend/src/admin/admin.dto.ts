import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  IsPositive,
  IsIn,
} from "class-validator";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateSystemConfigDto {
  @IsString()
  @Length(1, 128)
  @Matches(/^[A-Za-z0-9._-]+$/)
  key!: string;

  @IsString()
  @Length(1, 10000)
  value!: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsString()
  @Length(3, 500)
  reason!: string;
}

export class UpdateUserControlDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @Length(1, 32)
  outcome!: string;
}

export class CreateCurrencyDto {
  @IsString() @Length(2, 20) @Matches(/^[A-Z0-9._-]+$/) symbol!: string;
  @IsString() @Length(1, 128) name!: string;
  @IsOptional() @IsUrl({ require_protocol: true }) logo?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @IsPositive() rate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minDeposit?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxDeposit?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minWithdrawal?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxWithdrawal?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) withdrawalFee?: number;
  @IsOptional() @IsBoolean() depositEnabled?: boolean;
  @IsOptional() @IsBoolean() withdrawEnabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) confirmationCount?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) decimals?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCurrencyDto extends PartialType(CreateCurrencyDto) {
  @IsString()
  @Length(3, 500)
  reason!: string;

  @IsString()
  @Length(8, 128)
  idempotencyKey!: string;
}

export class CreateDepositAddressDto {
  @IsString() @Length(2, 32) network!: string;
  @IsString() @Length(8, 256) address!: string;
  @IsOptional() @IsString() @Length(1, 128) label?: string;
}

export class CreateMiningPlanDto {
  @IsString() @Length(1, 128) name!: string;
  @IsOptional()
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Z0-9._-]+$/)
  currency?: string;
  @Type(() => Number) @IsInt() @Min(1) lockupPeriod!: number;
  @Type(() => Number) @IsNumber() @Min(0) dailyYield!: number;
  @Type(() => Number) @IsNumber() @Min(0) minDeposit!: number;
  @Type(() => Number) @IsNumber() @Min(0) maxDeposit!: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsString() @Length(1, 256) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class UpdateMiningPlanDto extends PartialType(CreateMiningPlanDto) {}

export class CreateLoanPlanDto {
  @IsString() @Length(1, 128) name!: string;
  @Type(() => Number) @IsInt() @Min(1) durationDays!: number;
  @Type(() => Number) @IsNumber() @Min(0) interestRate!: number;
  @Type(() => Number) @IsNumber() @Min(0) minAmount!: number;
  @Type(() => Number) @IsNumber() @Min(0) maxAmount!: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsString() @Length(1, 256) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class UpdateLoanPlanDto extends PartialType(CreateLoanPlanDto) {}

export class UpdatePairRiskDto {
  @IsString() @Length(3, 32) symbol!: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(100) houseWinRatio!: number;
}

export class UpdatePayoutDto {
  @Type(() => Number) @IsNumber() @IsPositive() rate!: number;
}

export class UpdateBinaryConfigurationDto {
  @IsString() @Length(3, 32) pair!: string;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(86400)
  durationSeconds!: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(86400)
  sourceDurationSeconds?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  payoutRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @IsPositive() minStake?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @IsPositive() maxStake?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class UpdateMarginConfigurationDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(0.99)
  maintenanceRatio!: number;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  leverages?: string;

  @IsString()
  @Length(3, 500)
  reason!: string;

  @IsString()
  @Length(8, 128)
  idempotencyKey!: string;
}

export class CreateGovernanceCommandDto {
  @IsString() @Length(3, 128) commandType!: string;
  @IsOptional() @IsString() @Length(1, 256) target?: string;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
  @IsOptional() payload?: Record<string, unknown>;
}

export class GovernanceDecisionDto {
  @IsString() @Length(3, 500) reason!: string;
}

export class UpdateFeatureFlagDto {
  @IsString() @Length(1, 128) @Matches(/^[A-Za-z0-9._-]+$/) key!: string;
  @IsBoolean() enabled!: boolean;
  @IsOptional() @IsString() @Length(1, 32) environment?: string;
  @IsString() @Length(3, 500) reason!: string;
}

export class FinancialCorrectionDto {
  @IsUUID() userId!: string;
  @IsString() @Length(2, 20) @Matches(/^[A-Z0-9._-]+$/) asset!: string;
  @IsString() @Length(1, 128) amount!: string;
  @IsString() @Matches(/^(CREDIT|DEBIT)$/) direction!: "CREDIT" | "DEBIT";
  @IsString() @Length(8, 128) idempotencyKey!: string;
  @IsUUID() governanceCommandId!: string;
  @IsString() @Length(3, 500) reason!: string;
}

export class SandboxControlDto {
  @IsString() @IsIn(["binary", "spot", "balance"]) scope!:
    | "binary"
    | "spot"
    | "balance";
  @IsString() @Length(1, 256) target!: string;
  @IsString()
  @IsIn(["normal", "forced_win", "forced_loss"])
  mode!: "normal" | "forced_win" | "forced_loss";
  @IsOptional() @IsString() @Length(1, 256) seed?: string;
  @IsOptional() @IsString() @Length(1, 256) expectedResult?: string;
  @IsDateString() expiresAt!: string;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminKycDecisionDto {
  @IsUUID() id!: string;
  @IsIn(["approved", "rejected"]) decision!: "approved" | "rejected";
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminFeedStatusDto {
  @IsString() @Length(1, 128) id!: string;
  @IsIn(["LIVE", "STALE", "UNAVAILABLE", "DISABLED"]) status!:
    | "LIVE"
    | "STALE"
    | "UNAVAILABLE"
    | "DISABLED";
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminAssetVisibilityDto {
  @IsString() @Length(1, 128) id!: string;
  @IsBoolean() visible!: boolean;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminNetworkVisibilityDto {
  @IsUUID() id!: string;
  @IsBoolean() enabled!: boolean;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminAuditQueryDto {
  @IsOptional() @IsString() @Length(1, 128) actor?: string;
  @IsOptional() @IsString() @Length(1, 128) action?: string;
  @IsOptional() @IsString() @Length(1, 256) target?: string;
  @IsOptional() @IsString() @Length(1, 32) environment?: string;
  @IsOptional() @IsString() @Length(1, 128) correlationId?: string;
  @IsOptional()
  @IsString()
  @IsIn(["ok", "error", "denied", "unknown"])
  result?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}

export class AdminIncidentQueryDto {
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @Length(1, 32) environment?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}

export class AdminIncidentAcknowledgeDto {
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminSupportReplyDto {
  @IsString() @Length(1, 10000) body!: string;
  @IsBoolean() internal!: boolean;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminSupportStatusDto {
  @IsString()
  @IsIn(["open", "pending_user", "resolved", "escalated"])
  status!: string;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class AdminPairMaintenanceDto {
  @IsString() @Length(3, 64) symbol!: string;
  @IsBoolean() enabled!: boolean;
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class CreateMaintenanceWindowDto {
  @IsString() @IsIn(["global", "route", "market", "pair"]) scope!:
    | "global"
    | "route"
    | "market"
    | "pair";
  @IsString() @Length(1, 256) target!: string;
  @IsDateString() scheduledAt!: string;
  @IsDateString() endsAt!: string;
  @IsString() @Length(3, 500) reason!: string;
  @IsString()
  @IsIn(["DEVELOPMENT", "SANDBOX", "PRODUCTION"])
  environment!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}

export class MaintenanceWindowQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(["scheduled", "active", "completed", "cancelled"])
  status?: string;
  @IsOptional()
  @IsString()
  @IsIn(["DEVELOPMENT", "SANDBOX", "PRODUCTION"])
  environment?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 100;
}

export class CancelMaintenanceWindowDto {
  @IsString() @Length(3, 500) reason!: string;
  @IsString() @Length(8, 128) idempotencyKey!: string;
}
