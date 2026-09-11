import { Module } from "@nestjs/common";
import { D1PrismaModule } from "../d1/d1-prisma.module";
import { SandboxExecutionService } from "./sandbox-execution.service";
import { SandboxScenarioService } from "./sandbox-scenario.service";

@Module({
  imports: [D1PrismaModule],
  providers: [SandboxExecutionService, SandboxScenarioService],
  exports: [SandboxExecutionService, SandboxScenarioService],
})
export class SandboxModule {}
