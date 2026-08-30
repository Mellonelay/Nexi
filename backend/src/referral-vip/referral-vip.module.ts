import { Module } from '@nestjs/common';
import { ReferralVipController } from './referral-vip.controller';
import { ReferralVipService } from './referral-vip.service';

@Module({
  controllers: [ReferralVipController],
  providers: [ReferralVipService],
  exports: [ReferralVipService],
})
export class ReferralVipModule {}
