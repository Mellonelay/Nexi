import { Module } from '@nestjs/common';
import { FinancialOperationsModule } from '../financial/financial-operations.module';
import { ReferralVipController } from './referral-vip.controller';
import { ReferralVipService } from './referral-vip.service';

@Module({
  imports: [FinancialOperationsModule],
  controllers: [ReferralVipController],
  providers: [ReferralVipService],
  exports: [ReferralVipService],
})
export class ReferralVipModule {}
