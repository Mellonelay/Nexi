import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SandboxExecutionService } from "./sandbox-execution.service";
import { SandboxScenarioService } from "./sandbox-scenario.service";

@Module({
  imports: [PrismaModule],
  providers: [SandboxExecutionService, SandboxScenarioService],
  exports: [SandboxExecutionService, SandboxScenarioService],
})
export class SandboxModule {}
