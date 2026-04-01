import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { KycModule } from './kyc/kyc.module';
import { WalletModule } from './wallet/wallet.module';
import { BinaryModule } from './binary/binary.module';
import { SpotModule } from './spot/spot.module';
import { ConversionModule } from './conversion/conversion.module';
import { LoansModule } from './loans/loans.module';
import { MiningModule } from './mining/mining.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ContractModule } from './contract/contract.module';

import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletModule,
    BinaryModule,
    SpotModule,
    ContractModule, // Added ContractModule
    MiningModule,
    LoansModule,
    KycModule,
    ConversionModule,
    AdminModule,
    EventsModule, // Added EventsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
