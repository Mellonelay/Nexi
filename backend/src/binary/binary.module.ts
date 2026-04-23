import { Module } from '@nestjs/common';
import { BinaryService } from './binary.service';
import { BinaryController } from './binary.controller';
import { BinaryGateway } from './binary.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
      WalletModule,
      AuthModule,
      ScheduleModule.forRoot(),
      PrismaModule
  ],
  providers: [BinaryService, BinaryGateway],
  controllers: [BinaryController],
  exports: [BinaryService],
})
export class BinaryModule {}
