import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { AuthSurfaceGuard } from '../auth/auth-surface.guard';
import { RequireAuthSurface } from '../auth/auth-surface.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnershipGuard } from '../auth/ownership.guard';
import { KycSubmissionDto } from '../auth/auth.dto';
import { KycService } from './kyc.service';


@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiBearerAuth()
  @Post('evidence')
  @ApiCreatedResponse({ description: 'Private KYC evidence stored for the authenticated user.', schema: { type: 'object', required: ['evidenceId', 'status'], properties: { evidenceId: { type: 'string', format: 'uuid' }, status: { type: 'string', enum: ['UPLOADED'] } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  async uploadEvidence(
    @Req() request: AuthenticatedRequest & AsyncIterable<Uint8Array>,
    @Headers('content-type') contentType?: string,
  ) {
    return this.kycService.uploadEvidenceStream(
      request.user.userId,
      request,
      contentType,
      (request as unknown as { headers?: Record<string, string> }).headers?.['content-length'],
    );
  }

  @ApiBearerAuth()
  @Post('submit')
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  async submitKyc(
    @Body() body: KycSubmissionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.kycService.submitKyc(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Get('status')
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface('PUBLIC')
  async getMyStatus(@Req() request: AuthenticatedRequest) {
    return this.kycService.getKycStatus(request.user.userId);
  }

  @ApiBearerAuth()
  @Get('status/:userId')
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface('PUBLIC')
  async getStatus(
    @Param('userId') _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.kycService.getKycStatus(request.user.userId);
  }
}
