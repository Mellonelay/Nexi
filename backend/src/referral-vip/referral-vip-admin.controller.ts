import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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

const vipLevelSchema = { type: 'object', required: ['id', 'level', 'name', 'threshold', 'benefits', 'enabled', 'createdAt', 'updatedAt'], properties: { id: { type: 'string' }, level: { type: 'integer' }, name: { type: 'string' }, threshold: { type: 'string' }, benefits: { type: 'object', nullable: true, additionalProperties: true }, enabled: { type: 'boolean' }, createdAt: { type: 'string' }, updatedAt: { type: 'string' } }, additionalProperties: true };
const vipStateSchema = { type: 'object', required: ['level', 'name', 'progress', 'threshold', 'benefits', 'evaluatedAt', 'qualifiedAt'], properties: { level: { type: 'integer' }, name: { type: 'string' }, progress: { type: 'string' }, threshold: { type: 'string' }, benefits: { type: 'object', nullable: true, additionalProperties: true }, evaluatedAt: { type: 'string', nullable: true }, qualifiedAt: { type: 'string', nullable: true } } };

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
  @ApiOkResponse({ schema: { type: 'array', items: vipLevelSchema } })
  @RequireAdminPermission('users.view')
  @ApiOperation({ summary: 'List all VIP levels, including disabled levels.' })
  levels() {
    return this.service.listAllVipLevels();
  }

  @Post('vip/levels')
  @ApiCreatedResponse({ schema: { type: 'object', required: ['auditId', 'levels'], properties: { auditId: { type: 'string', format: 'uuid' }, levels: { type: 'array', items: vipLevelSchema } } } })
  @RequireAdminPermission('users.entitlements')
  @ApiOperation({ summary: 'Create or update a VIP level with an Admin audit record.' })
  upsertLevel(@Req() request: AuthenticatedRequest, @Body() body: UpdateVipLevelDto) {
    return this.service.adminUpsertVipLevel(request.user.userId, body);
  }

  @Post('vip/assign')
  @ApiCreatedResponse({ schema: { type: 'object', required: ['auditId', 'userCode', 'vip'], properties: { auditId: { type: 'string', format: 'uuid' }, userCode: { type: 'integer' }, vip: vipStateSchema } } })
  @RequireAdminPermission('users.entitlements')
  @ApiOperation({ summary: 'Assign a VIP level to a NEXI User ID with an Admin audit record.' })
  assign(@Req() request: AuthenticatedRequest, @Body() body: AssignVipDto) {
    return this.service.adminAssignVip(request.user.userId, body);
  }
}
