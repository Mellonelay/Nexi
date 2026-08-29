import { Module } from '@nestjs/common';
import { LoanService } from './loans.service';
import { LoansController } from './loans.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [LedgerModule, PrismaModule, AuthModule, RedisModule, D1PrismaModule],
  providers: [LoanService],
  controllers: [LoansController],
  exports: [LoanService],
})
export class LoansModule {}
