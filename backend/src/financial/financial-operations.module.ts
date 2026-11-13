import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { FinancialOperationsService } from './financial-operations.service';
import { LocalDepositProofStore } from './local-deposit-proof.store';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [LedgerModule, D1PrismaModule],
  providers: [FinancialOperationsService, LocalDepositProofStore],
  exports: [FinancialOperationsService, LocalDepositProofStore],
})
export class FinancialOperationsModule {}
