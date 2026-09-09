import { forwardRef, Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../prisma/prisma.module';
import { D1PrismaModule } from '../d1/d1-prisma.module';

@Global()
@Module({
  imports: [forwardRef(() => WalletModule), PrismaModule, D1PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
