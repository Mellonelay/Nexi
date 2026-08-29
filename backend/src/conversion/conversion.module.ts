import { Module } from '@nestjs/common';
import { ConversionService } from './conversion.service';
import { ConversionController } from './conversion.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, PrismaModule, AuthModule],
  providers: [ConversionService],
  controllers: [ConversionController],
  exports: [ConversionService],
})
export class ConversionModule {}
