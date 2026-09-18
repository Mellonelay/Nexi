import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../auth/auth-surface.guard';
import { RequireAuthSurface } from '../auth/auth-surface.decorator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ClaimReferralDto } from './referral-vip.dto';
import { ReferralVipService } from './referral-vip.service';

@ApiTags('Referral and VIP')
@ApiBearerAuth()
@Controller()
export class ReferralVipController {
  constructor(private readonly service: ReferralVipService) {}

  @Get('referral/me')
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  @ApiOperation({ summary: 'Return the authenticated user referral identity and referral totals.' })
  referral(@Req() request: AuthenticatedRequest) {
    return this.service.getReferral(request.user.userId);
  }

  @Post('referral/claim')
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  @ApiOperation({ summary: 'Apply a referral code once to the authenticated account.' })
  claim(@Req() request: AuthenticatedRequest, @Body() body: ClaimReferralDto) {
    if (!body.referralCode) return this.service.getReferral(request.user.userId);
    return this.service.claimReferral(request.user.userId, body.referralCode);
  }

  @Get('vip/me')
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  @ApiOperation({ summary: 'Return the authenticated user VIP level, progress and benefits.' })
  vip(@Req() request: AuthenticatedRequest) {
    return this.service.getVip(request.user.userId);
  }

  @Get('vip/levels')
  @ApiOperation({ summary: 'List enabled VIP levels and public benefit metadata.' })
  levels() {
    return this.service.listVipLevels();
  }
}
