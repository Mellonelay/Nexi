import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinancialOperationsModule } from './financial-operations.module';
import { FinancialOperationsController } from './financial-operations.controller';
import { LocalDepositProofController } from './local-deposit-proof.controller';

// Authorization belongs to the HTTP boundary, not the shared financial service module.
@Module({
  imports: [AuthModule, FinancialOperationsModule],
  controllers: [FinancialOperationsController, LocalDepositProofController],
})
export class FinancialHttpModule {}
