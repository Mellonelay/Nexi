import { Module } from '@nestjs/common';
import { SpotService } from './spot.service';
import { SpotController } from './spot.controller';
import { SpotGateway } from './spot.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WalletModule, PrismaModule],
  providers: [SpotService, SpotGateway],
  controllers: [SpotController],
  exports: [SpotService],
})
export class SpotModule {}
