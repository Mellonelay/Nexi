import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

const normalizeEmail = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  email?: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 16)
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 64)
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 32)
  theme?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  notificationSettings?: Record<string, boolean>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  tradingSettings?: Record<string, unknown>;
}
