import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WalletModule, PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
