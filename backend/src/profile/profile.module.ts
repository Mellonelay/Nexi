import { Module } from '@nestjs/common';
import { ReferralVipModule } from '../referral-vip/referral-vip.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [ReferralVipModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
