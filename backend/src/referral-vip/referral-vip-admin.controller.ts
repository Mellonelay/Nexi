import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../prisma/d1-client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../auth/auth-surface.guard';
import { RequireAuthSurface } from '../auth/auth-surface.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { AdminPermissionGuard } from '../admin/admin-permission.guard';
import { RequireAdminPermission } from '../admin/admin-permission.decorator';
import { AssignVipDto, UpdateVipLevelDto } from './referral-vip.dto';
import { ReferralVipService } from './referral-vip.service';

@ApiTags('Admin Referral and VIP')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
@RequireAuthSurface('ADMIN')
@Roles(Role.ADMIN)
export class ReferralVipAdminController {
  constructor(private readonly service: ReferralVipService) {}

  @Get('referrals')
  @RequireAdminPermission('users.view')
  @ApiOperation({ summary: 'List referral identities and referral totals.' })
  referrals(@Query('limit') limit?: string) {
    return this.service.adminReferralOverview(limit ? Number(limit) : 100);
  }

  @Get('vip/users')
  @RequireAdminPermission('users.view')
  @ApiOperation({ summary: 'List user VIP state.' })
  users(@Query('limit') limit?: string) {
    return this.service.adminVipOverview(limit ? Number(limit) : 100);
  }

  @Get('vip/levels')
  @RequireAdminPermission('users.view')
  @ApiOperation({ summary: 'List all VIP levels, including disabled levels.' })
  levels() {
    return this.service.listAllVipLevels();
  }

  @Post('vip/levels')
  @RequireAdminPermission('users.entitlements')
  @ApiOperation({ summary: 'Create or update a VIP level with an Admin audit record.' })
  upsertLevel(@Req() request: AuthenticatedRequest, @Body() body: UpdateVipLevelDto) {
    return this.service.adminUpsertVipLevel(request.user.userId, body);
  }

  @Post('vip/assign')
  @RequireAdminPermission('users.entitlements')
  @ApiOperation({ summary: 'Assign a VIP level to a NEXI User ID with an Admin audit record.' })
  assign(@Req() request: AuthenticatedRequest, @Body() body: AssignVipDto) {
    return this.service.adminAssignVip(request.user.userId, body);
  }
}
