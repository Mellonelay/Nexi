import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { KycModule } from "./kyc/kyc.module";
import { WalletModule } from "./wallet/wallet.module";
import { BinaryModule } from "./binary/binary.module";
import { SpotModule } from "./spot/spot.module";
import { ConversionModule } from "./conversion/conversion.module";
import { LoansModule } from "./loans/loans.module";
import { MiningModule } from "./mining/mining.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { EventsModule } from "./events/events.module";
import { FeedbackController } from "./feedback/feedback.controller";
import { MarketModule } from "./market/market.module";
import { RedisModule } from "./redis/redis.module";
import { LedgerModule } from "./ledger/ledger.module";
import { SettlementModule } from "./settlement/settlement.module";
import { NotificationModule } from "./notification/notification.module";
import { CommunicationsModule } from "./communications/communications.module";
import { AuditModule } from "./audit/audit.module";
import { RiskModule } from "./risk/risk.module";
import { SandboxModule } from "./sandbox/sandbox.module";
import { RuntimeLifecycleService } from "./runtime/runtime-lifecycle.service";
import { validateRuntimeEnvironment } from "./runtime/runtime.config";
import { FinancialOperationsModule } from "./financial/financial-operations.module";
import { ObservabilityModule } from "./observability/observability.module";
import { D1WorkerBridgeModule } from "./d1/d1-worker-bridge.module";
import { D1PrismaModule } from "./d1/d1-prisma.module";
import { WorkflowCommandsModule } from "./workflows/workflow-commands.module";
import { ReferralVipModule } from "./referral-vip/referral-vip.module";
import { ProfileModule } from "./profile/profile.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateRuntimeEnvironment,
    }),
    ScheduleModule.forRoot(),
    // SOVEREIGN UNIFIED GATEWAY: Port 3000 handles everything
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "..", "frontend", "out"),
    }),
    PrismaModule,
    RedisModule,
    LedgerModule,
    SettlementModule,
    NotificationModule,
    CommunicationsModule,
    AuditModule,
    RiskModule,
    SandboxModule,
    UsersModule,
    AuthModule,
    WalletModule,
    BinaryModule,
    SpotModule,
    MiningModule,
    LoansModule,
    KycModule,
    ConversionModule,
    AdminModule,
    EventsModule,
    MarketModule,
    FinancialOperationsModule,
    ObservabilityModule,
    D1WorkerBridgeModule,
    D1PrismaModule,
    WorkflowCommandsModule,
    ReferralVipModule,
    ProfileModule,
  ],
  controllers: [AppController, FeedbackController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
    RuntimeLifecycleService,
  ],
})
export class AppModule {}
