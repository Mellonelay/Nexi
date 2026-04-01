import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { MiningController } from './mining.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WalletModule, PrismaModule],
  providers: [MiningService],
  controllers: [MiningController],
  exports: [MiningService],
})
export class MiningModule {}
