import { Module } from '@nestjs/common';
import { ConversionService } from './conversion.service';
import { ConversionController } from './conversion.controller';
import { WalletModule } from '../wallet/wallet.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, D1PrismaModule, AuthModule],
  providers: [ConversionService],
  controllers: [ConversionController],
  exports: [ConversionService],
})
export class ConversionModule {}
