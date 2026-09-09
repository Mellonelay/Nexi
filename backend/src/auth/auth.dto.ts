import { Transform, Type } from 'class-transformer';
import { IsEmail, IsISO8601, IsInt, IsObject, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, Min, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class SignupDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(43)
  @MaxLength(128)
  refreshToken!: string;
}

export class KycSubmissionDto {
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsISO8601()
  dob!: string;

  @IsString()
  @Length(2, 64)
  country!: string;

  @IsString()
  @Length(2, 64)
  documentType!: string;

  @IsUrl({ require_protocol: true })
  documentUrl!: string;
}

export class WalletChallengeDto {
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{40}$/)
  address!: string;

  @IsInt()
  @Min(1)
  chainId!: number;
}

export class WalletVerifyDto {
  @IsString()
  @Length(1, 4096)
  message!: string;

  @IsString()
  @Matches(/^0x[0-9a-fA-F]+$/)
  signature!: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  referralCode?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  email?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @Length(2, 16)
  locale?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  theme?: string;

  @IsOptional()
  @IsObject()
  notificationSettings?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  tradingSettings?: Record<string, unknown>;
}

export class SecurityPasswordChangeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  currentSecurityPassword?: string;

  @IsString()
  @MinLength(12)
  newSecurityPassword!: string;
}

export class SetupMfaDto {
  @IsString()
  @Length(1, 256)
  label!: string;
}

export class VerifyMfaDto {
  @IsString()
  @Length(6, 6)
  token!: string;
}

export class DisableMfaDto {
  @IsString()
  @MinLength(1)
  securityPassword!: string;

  @IsOptional()
  @IsString()
  @Length(6, 64)
  token?: string;
}

export class GenerateBackupCodesDto {}
