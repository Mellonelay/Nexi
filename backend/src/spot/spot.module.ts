import { Module } from '@nestjs/common';
import { SpotService } from './spot.service';
import { SpotController } from './spot.controller';
import { SpotGateway } from './spot.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { LedgerModule } from '../ledger/ledger.module';
import { MarketModule } from '../market/market.module';
import { MarginService } from './margin.service';
import { MarginRecoveryScheduler } from './margin-recovery.scheduler';
import { RedisModule } from '../redis/redis.module';
import { MarginController } from './margin.controller';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [WalletModule, AuthModule, LedgerModule, MarketModule, D1PrismaModule, RedisModule],
  providers: [SpotService, SpotGateway, MarginService, MarginRecoveryScheduler],
  controllers: [SpotController, MarginController],
  exports: [SpotService, MarginService],
})
export class SpotModule {}
