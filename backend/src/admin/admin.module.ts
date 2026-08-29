import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { AdminAuthController } from "./admin-auth.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { LedgerModule } from "../ledger/ledger.module";
import { AdminPermissionGuard } from "./admin-permission.guard";
import { SpotModule } from "../spot/spot.module";
import { BinaryModule } from "../binary/binary.module";
import { FinancialOperationsModule } from "../financial/financial-operations.module";
import { SandboxModule } from "../sandbox/sandbox.module";
import { MiningModule } from "../mining/mining.module";
import { LoansModule } from "../loans/loans.module";
import { D1PrismaModule } from "../d1/d1-prisma.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LedgerModule,
    SpotModule,
    BinaryModule,
    FinancialOperationsModule,
    SandboxModule,
    MiningModule,
    LoansModule,
    D1PrismaModule,
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminPermissionGuard],
})
export class AdminModule {}
