import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { D1PrismaModule } from '../d1/d1-prisma.module';
import { RedisModule } from '../redis/redis.module';
import { ReadinessService } from './readiness.service';

@Module({
  imports: [D1PrismaModule, RedisModule],
  controllers: [HealthController],
  providers: [ReadinessService],
  exports: [ReadinessService],
})
export class ObservabilityModule {}
