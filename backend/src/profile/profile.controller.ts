import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../auth/auth-surface.guard';
import { RequireAuthSurface } from '../auth/auth-surface.decorator';
import { AuthenticatedRequest } from '../auth/auth.types';
import { ProfileService } from './profile.service';
import { UpdatePreferencesDto, UpdateProfileDto } from './profile.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard, AuthSurfaceGuard)
@RequireAuthSurface('PUBLIC')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Return the complete wallet-native public profile.' })
  getMe(@Req() request: AuthenticatedRequest) {
    return this.service.getProfile(request.user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update optional public profile metadata. Wallet identity remains immutable.' })
  updateMe(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.service.updateProfile(request.user.userId, body);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Return public account preferences.' })
  preferences(@Req() request: AuthenticatedRequest) {
    return this.service.getPreferences(request.user.userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update public account preferences.' })
  updatePreferences(@Req() request: AuthenticatedRequest, @Body() body: UpdatePreferencesDto) {
    return this.service.updatePreferences(request.user.userId, body);
  }
}
