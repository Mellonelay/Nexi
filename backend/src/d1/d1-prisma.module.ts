import { Global, Module } from '@nestjs/common';
import { D1FinancialCommandGateway } from './d1-financial-command.gateway';
import { D1PrismaService } from './d1-prisma.service';

@Global()
@Module({
  providers: [D1PrismaService, D1FinancialCommandGateway],
  exports: [D1PrismaService, D1FinancialCommandGateway],
})
export class D1PrismaModule {}
