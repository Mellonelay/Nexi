import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerAuthorityService } from './ledger-authority.service';

@Module({
  imports: [PrismaModule],
  providers: [LedgerAuthorityService],
  exports: [LedgerAuthorityService],
})
export class LedgerModule {}
