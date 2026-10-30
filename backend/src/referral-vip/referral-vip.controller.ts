import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../auth/auth-surface.guard';
import { RequireAuthSurface } from '../auth/auth-surface.decorator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ClaimReferralDto } from './referral-vip.dto';
import { ReferralVipService } from './referral-vip.service';

const referralSchema = { type: 'object', required: ['referralCode', 'referralCount', 'totalEarnings', 'referredByUserCode'], properties: { referralCode: { type: 'string' }, referralCount: { type: 'integer', minimum: 0 }, totalEarnings: { type: 'string' }, referredByUserCode: { type: 'integer', nullable: true } } };
const vipSchema = { type: 'object', required: ['level', 'name', 'progress', 'threshold', 'benefits', 'evaluatedAt', 'qualifiedAt'], properties: { level: { type: 'integer' }, name: { type: 'string' }, progress: { type: 'string' }, threshold: { type: 'string' }, benefits: { type: 'object', nullable: true, additionalProperties: true }, evaluatedAt: { type: 'string', nullable: true }, qualifiedAt: { type: 'string', nullable: true } } };
const vipLevelSchema = { type: 'object', required: ['id', 'level', 'name', 'threshold', 'benefits', 'enabled'], properties: { id: { type: 'string' }, level: { type: 'integer' }, name: { type: 'string' }, threshold: { type: 'string' }, benefits: {}, enabled: { type: 'boolean' } }, additionalProperties: true };

@ApiTags('Referral and VIP')
@ApiBearerAuth()
@Controller()
export class ReferralVipController {
  constructor(private readonly service: ReferralVipService) {}

  @Get('referral/me')
  @ApiOkResponse({ schema: referralSchema })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  @ApiOperation({ summary: 'Return the authenticated user referral identity and referral totals.' })
  referral(@Req() request: AuthenticatedRequest) {
    return this.service.getReferral(request.user.userId);
  }

  @Get('referral/history')
  @ApiOkResponse({ schema: { type: 'object', required: ['referrals', 'rewards'], properties: { referrals: { type: 'object', required: ['items', 'limit', 'offset', 'hasMore'], properties: { items: { type: 'array', items: { type: 'object', required: ['referredUserCode', 'status', 'attributedAt'], properties: { referredUserCode: { type: 'integer' }, status: { type: 'string' }, attributedAt: { type: 'string', nullable: true } } } }, limit: { type: 'integer' }, offset: { type: 'integer' }, hasMore: { type: 'boolean' } } }, rewards: { type: 'object', required: ['items', 'limit', 'offset', 'hasMore'], properties: { items: { type: 'array', items: { type: 'object', required: ['id', 'referredUserCode', 'amount', 'asset', 'status', 'rewardedAt'], properties: { id: { type: 'string' }, referredUserCode: { type: 'integer' }, amount: { type: 'string' }, asset: { type: 'string' }, status: { type: 'string' }, rewardedAt: { type: 'string' } } } }, limit: { type: 'integer' }, offset: { type: 'integer' }, hasMore: { type: 'boolean' } } } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  @ApiOperation({ summary: 'Return account-scoped referral attribution and ledger-backed reward history.' })
  referralHistory(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.getReferralHistory(
      request.user.userId,
      limit === undefined ? 50 : Number(limit),
      offset === undefined ? 0 : Number(offset),
    );
  }

  @Post('referral/claim')
  @ApiCreatedResponse({ description: 'Referral claim result; returns the current referral identity.', schema: referralSchema })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  @ApiOperation({ summary: 'Apply a referral code once to the authenticated account.' })
  claim(@Req() request: AuthenticatedRequest, @Body() body: ClaimReferralDto) {
    if (!body.referralCode) return this.service.getReferral(request.user.userId);
    return this.service.claimReferral(request.user.userId, body.referralCode);
  }

  @Get('vip/me')
  @ApiOkResponse({ schema: vipSchema })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  @ApiOperation({ summary: 'Return the authenticated user VIP level, progress and benefits.' })
  vip(@Req() request: AuthenticatedRequest) {
    return this.service.getVip(request.user.userId);
  }

  @Get('vip/levels')
  @ApiOkResponse({ schema: { type: 'array', items: vipLevelSchema } })
  @ApiOperation({ summary: 'List enabled VIP levels and public benefit metadata.' })
  levels() {
    return this.service.listVipLevels();
  }
}
