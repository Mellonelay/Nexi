import { Module } from '@nestjs/common';
import { BinaryService } from './binary.service';
import { BinaryController } from './binary.controller';
import { BinaryGateway } from './binary.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { AuthModule } from '../auth/auth.module';
import { SandboxModule } from '../sandbox/sandbox.module';
import { RedisModule } from '../redis/redis.module';
import { BinarySettlementScheduler } from './binary-settlement.scheduler';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [
      WalletModule,
      ScheduleModule.forRoot(),
      PrismaModule,
      LedgerModule,
      AuthModule,
      SandboxModule,
      RedisModule,
      D1PrismaModule
  ],
  providers: [BinaryService, BinaryGateway, BinarySettlementScheduler],
  controllers: [BinaryController],
  exports: [BinaryService, BinaryGateway],
})
export class BinaryModule {}
