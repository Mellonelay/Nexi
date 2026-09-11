import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { MiningController } from './mining.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [LedgerModule, AuthModule, RedisModule, D1PrismaModule],
  providers: [MiningService],
  controllers: [MiningController],
  exports: [MiningService],
})
export class MiningModule {}
