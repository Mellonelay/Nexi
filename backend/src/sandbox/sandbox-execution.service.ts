import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AdminCommandStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SandboxScenarioService } from "./sandbox-scenario.service";

const SANDBOX_MODES = new Set(["normal", "forced_win", "forced_loss"]);

@Injectable()
export class SandboxExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scenarios: SandboxScenarioService,
  ) {}

  async executeApproved(commandId: string, executorId: string) {
    if (process.env.NODE_ENV === "production")
      throw new ForbiddenException(
        "Sandbox execution is disabled in production",
      );
    return this.prisma.$transaction(async (tx) => {
      const command = await tx.adminGovernanceCommand.findUnique({
        where: { id: commandId },
      });
      if (!command)
        throw new NotFoundException("Sandbox governance command not found");
      if (command.commandType !== "SANDBOX_CONTROL")
        throw new BadRequestException(
          "Governance command is not a sandbox control",
        );
      if (command.status === AdminCommandStatus.EXECUTED)
        return {
          command,
          replayed: true,
          receipt: { commandId, status: "EXECUTED" as const },
        };
      if (command.status !== AdminCommandStatus.APPROVED)
        throw new ForbiddenException(
          "Sandbox command must be approved before execution",
        );
      const payload = (command.payload ?? {}) as Record<string, unknown>;
      const target = typeof payload.target === "string" ? payload.target : "";
      const mode = typeof payload.mode === "string" ? payload.mode : "";
      const expiresAt =
        typeof payload.expiresAt === "string"
          ? new Date(payload.expiresAt)
          : null;
      const sandboxTargets = (process.env.NEXI_SANDBOX_ACCOUNT_IDS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (
        payload.SANDBOX_ONLY !== true ||
        payload.NON_PRODUCTION !== true ||
        payload.ROLE_GATED !== true ||
        payload.ACCOUNT_SCOPED !== true
      )
        throw new ForbiddenException(
          "Sandbox command governance markers are invalid",
        );
      if (!sandboxTargets.includes(target))
        throw new ForbiddenException("Sandbox target is not approved");
      if (!SANDBOX_MODES.has(mode))
        throw new BadRequestException("Sandbox scenario mode is unsupported");
      if (mode !== "normal") this.scenarios.assertSupportedMode(mode);
      if (
        !expiresAt ||
        !Number.isFinite(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now()
      )
        throw new BadRequestException("Sandbox scenario has expired");
      const updated = await tx.adminGovernanceCommand.update({
        where: { id: commandId },
        data: { status: AdminCommandStatus.EXECUTED, executedAt: new Date() },
      });
      const receipt = {
        commandId,
        executorId,
        target,
        mode,
        expiresAt: expiresAt.toISOString(),
        authority: "backend/sandbox",
        outcomeMutation:
          mode === "normal" ? "NORMAL_BINARY_PATH" : "BINARY_SCENARIO_ARMED",
      } as const;
      await tx.adminAuditLog.create({
        data: {
          adminId: executorId,
          action: "SANDBOX_COMMAND_EXECUTED",
          target: commandId,
          details: receipt as unknown as Prisma.InputJsonValue,
        },
      });
      return { command: updated, replayed: false, receipt };
    });
  }
}
