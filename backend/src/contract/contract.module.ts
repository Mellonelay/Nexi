import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { WalletModule } from '../wallet/wallet.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, D1PrismaModule, WalletModule],
  controllers: [ContractController],
  providers: [ContractService],
})
export class ContractModule {}
