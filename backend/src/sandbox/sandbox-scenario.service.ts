import { BadRequestException, Injectable } from "@nestjs/common";
import { AdminCommandStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type BinarySandboxDirective = {
  commandId: string;
  mode: "forced_win" | "forced_loss";
  result: "WIN" | "LOSS";
  expiresAt: Date;
};

const SUPPORTED_BINARY_MODES = new Set(["forced_win", "forced_loss"]);

@Injectable()
export class SandboxScenarioService {
  constructor(private readonly prisma: PrismaService) {}

  assertSupportedMode(mode: string): void {
    if (!SUPPORTED_BINARY_MODES.has(mode)) {
      throw new BadRequestException(
        `Sandbox scenario mode ${mode} has no isolated runtime adapter`,
      );
    }
  }

  /**
   * Resolves only an executed, binary-scoped scenario targeted at this exact
   * sandbox account. The command payload is the existing governance-backed
   * scenario store; no production user or market authority is consulted.
   */
  async findBinaryDirective(tx: any, userId: string, positionId: string) {
    const commands = await tx.adminGovernanceCommand.findMany({
      where: {
        commandType: "SANDBOX_CONTROL",
        status: AdminCommandStatus.EXECUTED,
        target: userId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    for (const command of commands) {
      const payload = (command.payload ?? {}) as Record<string, unknown>;
      if (
        payload.SANDBOX_ONLY !== true ||
        payload.NON_PRODUCTION !== true ||
        payload.ROLE_GATED !== true ||
        payload.ACCOUNT_SCOPED !== true ||
        payload.scope !== "binary" ||
        payload.target !== userId
      )
        continue;

      if (typeof payload.positionId === "string" && payload.positionId !== positionId)
        continue;

      const expiresAt =
        typeof payload.expiresAt === "string"
          ? new Date(payload.expiresAt)
          : null;
      const mode = typeof payload.mode === "string" ? payload.mode : "";
      if (
        !expiresAt ||
        !Number.isFinite(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now()
      )
        continue;
      if (!SUPPORTED_BINARY_MODES.has(mode)) continue;

      const result: "WIN" | "LOSS" = mode === "forced_win" ? "WIN" : "LOSS";
      return { commandId: command.id, mode, result, expiresAt };
    }
    return null;
  }
}
