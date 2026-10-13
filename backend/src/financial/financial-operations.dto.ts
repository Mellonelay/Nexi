import { IsInt, IsOptional, IsString, Length, Matches, Max, Min, MinLength } from 'class-validator';

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

export class Gate2WithdrawalDto {
  @IsString() @Length(2, 32) asset!: string;
  @IsString() @Length(1, 32) network!: string;
  @IsString() @Length(1, 256) address!: string;
  @IsString() @Matches(DECIMAL) amount!: string;
  @IsString() @Length(8, 160) idempotencyKey!: string;
  @IsString() @MinLength(1) securityPassword!: string;
  @IsOptional() @IsString() @Length(6, 64) mfaToken?: string;
}

export class Gate2TransferDto {
  @IsOptional() @IsString() @Length(1, 128) toUserId?: string;
  @IsOptional() @IsInt() @Min(100000) @Max(999999) toUserCode?: number;
  @IsString() @Length(2, 32) asset!: string;
  @IsString() @Matches(DECIMAL) amount!: string;
  @IsString() @Length(8, 160) idempotencyKey!: string;
}

export class WalletAccountTransferDto {
  @IsString() @Length(2, 32) sourceScope!: string;
  @IsString() @Length(2, 32) destinationScope!: string;
  @IsString() @Length(2, 32) asset!: string;
  @IsString() @Matches(DECIMAL) amount!: string;
  @IsString() @Length(8, 160) idempotencyKey!: string;
}

export class Gate2ConversionQuoteDto {
  @IsString() @Length(2, 32) fromAsset!: string;
  @IsString() @Length(2, 32) toAsset!: string;
  @IsString() @Matches(DECIMAL) amount!: string;
  @IsString() @Length(8, 160) quoteKey!: string;
}

export class Gate2ConversionAcceptDto {
  @IsString() @Length(1, 128) quoteId!: string;
  @IsString() @Length(8, 160) acceptanceKey!: string;
}

export class Gate2WithdrawalReviewDto {
  @IsString() @Length(1, 128) withdrawalId!: string;
  @IsString() @Length(1, 500) reason!: string;
}

export class Gate2WithdrawalSettleDto {
  @IsString() @Length(1, 128) withdrawalId!: string;
  @IsString() @Length(1, 256) providerReceipt!: string;
  @IsString() @Length(3, 500) reason!: string;
}

export class DepositClaimDto {
  @IsString() @Length(2, 32) asset!: string;
  @IsString() @Length(1, 32) network!: string;
  @IsString() @Length(1, 128) depositAddressId!: string;
  @IsString() @Matches(DECIMAL) claimedAmount!: string;
  @IsString() @Length(1, 512) proofObjectKey!: string;
  @IsOptional() @IsString() @Length(1, 256) txHash?: string;
  @IsString() @Length(8, 160) idempotencyKey!: string;
}

export class DepositClaimReviewDto {
  @IsString() @Length(1, 500) reason!: string;
  @IsString() @Length(8, 160) idempotencyKey!: string;
}

export class DepositProofIntentDto {
  @IsString() @Matches(/^image\/(png|jpeg|webp|gif)$/) contentType!: string;
  @IsString() @Matches(/^\d+$/) byteSize!: string;
}

export class DepositProofAuthorizationDto {
  @IsString() @Length(20, 300) key!: string;
}
