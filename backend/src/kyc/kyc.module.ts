import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycEvidenceStorageService } from './kyc-evidence-storage.service';
import { AuthModule } from '../auth/auth.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [D1PrismaModule, AuthModule],
  providers: [KycService, KycEvidenceStorageService],
  controllers: [KycController],
  exports: [KycService],
})
export class KycModule {}
