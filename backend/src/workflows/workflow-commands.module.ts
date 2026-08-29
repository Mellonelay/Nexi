import { Module } from "@nestjs/common";
import { FinancialOperationsModule } from "../financial/financial-operations.module";
import { MiningModule } from "../mining/mining.module";
import { LoansModule } from "../loans/loans.module";
import { D1PrismaModule } from "../d1/d1-prisma.module";
import { WorkflowCommandsController } from "./workflow-commands.controller";
import { WorkflowCommandsService } from "./workflow-commands.service";

@Module({
  imports: [
    FinancialOperationsModule,
    MiningModule,
    LoansModule,
    D1PrismaModule,
  ],
  controllers: [WorkflowCommandsController],
  providers: [WorkflowCommandsService],
})
export class WorkflowCommandsModule {}
