import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  async submitKyc(@Body() body: { userId: string; firstName: string; lastName: string; country: string; documentType: string; documentUrl: string }) {
    return this.kycService.submitKyc(body.userId, body);
  }

  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string) {
    return this.kycService.getKycStatus(userId);
  }

  // Admin Endpoints
  @Post('admin/approve')
  async approve(@Body() body: { userId: string }) {
    return this.kycService.approveKyc(body.userId);
  }

  @Post('admin/reject')
  async reject(@Body() body: { userId: string }) {
    return this.kycService.rejectKyc(body.userId);
  }
}
