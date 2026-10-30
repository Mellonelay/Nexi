import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../auth/auth-surface.guard';
import { RequireAuthSurface } from '../auth/auth-surface.decorator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ProfileService } from './profile.service';
import { UpdatePreferencesDto, UpdateProfileDto } from './profile.dto';

const preferencesSchema = { type: 'object', required: ['locale', 'timezone', 'theme', 'notificationSettings', 'tradingSettings'], properties: { locale: { type: 'string' }, timezone: { type: 'string' }, theme: { type: 'string' }, notificationSettings: { type: 'object', nullable: true, additionalProperties: true }, tradingSettings: { type: 'object', nullable: true, additionalProperties: true } } };
const profileSchema = { type: 'object', required: ['id', 'email', 'displayName', 'walletAddress', 'chainId', 'kycStatus', 'country', 'role', 'createdAt', 'lastActive', 'preferences', 'referral', 'vip'], properties: { id: { type: 'string' }, email: { type: 'string', nullable: true }, displayName: { type: 'string', nullable: true }, walletAddress: { type: 'string', nullable: true }, chainId: { type: 'integer', nullable: true }, kycStatus: { type: 'string' }, country: { type: 'string', nullable: true }, role: { type: 'string' }, createdAt: { type: 'string' }, lastActive: { type: 'string', nullable: true }, preferences: preferencesSchema, referral: { type: 'object', required: ['referralCode', 'referralCount', 'totalEarnings', 'referredByUserCode'], properties: { referralCode: { type: 'string' }, referralCount: { type: 'integer' }, totalEarnings: { type: 'string' }, referredByUserCode: { type: 'integer', nullable: true } } }, vip: { type: 'object', required: ['level', 'name', 'progress', 'threshold', 'benefits', 'evaluatedAt', 'qualifiedAt'], properties: { level: { type: 'integer' }, name: { type: 'string' }, progress: { type: 'string' }, threshold: { type: 'string' }, benefits: { type: 'object', nullable: true, additionalProperties: true }, evaluatedAt: { type: 'string', nullable: true }, qualifiedAt: { type: 'string', nullable: true } } } } };

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard, AuthSurfaceGuard)
@RequireAuthSurface('PUBLIC')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Complete wallet-native profile with preferences, referral and VIP state.', schema: profileSchema })
  @ApiOperation({ summary: 'Return the complete wallet-native public profile.' })
  getMe(@Req() request: AuthenticatedRequest) {
    return this.service.getProfile(request.user.userId);
  }

  @Patch('me')
  @ApiOkResponse({ description: 'Updated profile returned with canonical preferences, referral and VIP state.', schema: profileSchema })
  @ApiOperation({ summary: 'Update optional public profile metadata. Wallet identity remains immutable.' })
  updateMe(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.service.updateProfile(request.user.userId, body);
  }

  @Get('preferences')
  @ApiOkResponse({ schema: preferencesSchema })
  @ApiOperation({ summary: 'Return public account preferences.' })
  preferences(@Req() request: AuthenticatedRequest) {
    return this.service.getPreferences(request.user.userId);
  }

  @Patch('preferences')
  @ApiOkResponse({ description: 'Persisted Public account preferences.', schema: preferencesSchema })
  @ApiOperation({ summary: 'Update public account preferences.' })
  updatePreferences(@Req() request: AuthenticatedRequest, @Body() body: UpdatePreferencesDto) {
    return this.service.updatePreferences(request.user.userId, body);
  }
}
