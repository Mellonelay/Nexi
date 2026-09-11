import { Module } from '@nestjs/common';
import { D1PrismaModule } from '../d1/d1-prisma.module';
import { LedgerAuthorityService } from './ledger-authority.service';

@Module({
  imports: [D1PrismaModule],
  providers: [LedgerAuthorityService],
  exports: [LedgerAuthorityService],
})
export class LedgerModule {}
