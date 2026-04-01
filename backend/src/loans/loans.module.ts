import { Module } from '@nestjs/common';
import { LoanService } from './loans.service';
import { LoansController } from './loans.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WalletModule, PrismaModule],
  providers: [LoanService],
  controllers: [LoansController],
  exports: [LoanService],
})
export class LoansModule {}
