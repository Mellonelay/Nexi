import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AuthModule } from '../auth/auth.module';
import { LedgerModule } from '../ledger/ledger.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Module({
  imports: [D1PrismaModule, LedgerModule, forwardRef(() => AuthModule)],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
