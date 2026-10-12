import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  PayloadTooLargeException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnershipGuard } from '../auth/ownership.guard';
import { KycSubmissionDto } from '../auth/auth.dto';
import { KycService } from './kyc.service';

const KYC_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('evidence')
  @UseGuards(JwtAuthGuard)
  async uploadEvidence(
    @Req() request: AuthenticatedRequest & AsyncIterable<Uint8Array>,
    @Headers('content-type') contentType?: string,
  ) {
    const normalizedType = contentType?.split(';', 1)[0].trim().toLowerCase();
    if (!normalizedType) throw new BadRequestException('KYC evidence content type is required');
    const declaredSize = Number((request as unknown as { headers?: Record<string, string> }).headers?.['content-length']);
    if (Number.isFinite(declaredSize) && declaredSize > KYC_EVIDENCE_MAX_BYTES) {
      throw new PayloadTooLargeException('KYC evidence exceeds the 5 MiB limit');
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > KYC_EVIDENCE_MAX_BYTES) {
        throw new PayloadTooLargeException('KYC evidence exceeds the 5 MiB limit');
      }
      chunks.push(bytes);
    }
    return this.kycService.uploadEvidence(
      request.user.userId,
      Buffer.concat(chunks, size),
      normalizedType,
    );
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submitKyc(
    @Body() body: KycSubmissionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.kycService.submitKyc(request.user.userId, body);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getMyStatus(@Req() request: AuthenticatedRequest) {
    return this.kycService.getKycStatus(request.user.userId);
  }

  @Get('status/:userId')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  async getStatus(
    @Param('userId') _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.kycService.getKycStatus(request.user.userId);
  }
}
