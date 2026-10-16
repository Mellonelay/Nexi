import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LedgerModule } from '../ledger/ledger.module';
import { FinancialOperationsController } from './financial-operations.controller';
import { FinancialOperationsService } from './financial-operations.service';
import { LocalDepositProofStore } from './local-deposit-proof.store';
import { LocalDepositProofController } from './local-deposit-proof.controller';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [LedgerModule, AuthModule, D1PrismaModule],
  controllers: [FinancialOperationsController, LocalDepositProofController],
  providers: [FinancialOperationsService, LocalDepositProofStore],
  exports: [FinancialOperationsService],
})
export class FinancialOperationsModule {}
