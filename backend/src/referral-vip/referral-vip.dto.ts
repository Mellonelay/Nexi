import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimReferralDto {
  @ApiPropertyOptional({ description: 'Referral code captured before first wallet sign-in.' })
  @IsOptional()
  @IsString()
  @Length(4, 64)
  referralCode?: string;
}
