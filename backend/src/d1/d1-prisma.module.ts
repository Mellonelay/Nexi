import { Global, Module } from '@nestjs/common';
import { D1FinancialCommandGateway } from './d1-financial-command.gateway';
import { D1PrismaService } from './d1-prisma.service';
import { D1WorkerBridgeModule } from './d1-worker-bridge.module';

@Global()
@Module({
  imports: [D1WorkerBridgeModule],
  providers: [D1PrismaService, D1FinancialCommandGateway],
  exports: [D1PrismaService, D1FinancialCommandGateway],
})
export class D1PrismaModule {}
