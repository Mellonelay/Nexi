import { BadRequestException, Injectable } from "@nestjs/common";
import { AdminCommandStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type BinarySandboxDirective = {
  commandId: string;
  mode: "forced_win" | "forced_loss" | "deterministic" | "payout_override";
  result?: "WIN" | "LOSS" | "DRAW" | "REFUND";
  payoutRate?: Prisma.Decimal;
  expiresAt: Date;
};

const SUPPORTED_BINARY_MODES = new Set([
  "forced_win",
  "forced_loss",
  "deterministic",
  "payout_override",
]);

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

      if (mode === "payout_override") {
        if (typeof payload.payoutRate !== "string")
          throw new BadRequestException(
            "Payout override requires an explicit payoutRate",
          );
        let payoutRate: Prisma.Decimal;
        try {
          payoutRate = new Prisma.Decimal(payload.payoutRate);
        } catch {
          throw new BadRequestException("Payout override is not numeric");
        }
        if (payoutRate.isNegative())
          throw new BadRequestException("Payout override cannot be negative");
        return { commandId: command.id, mode, payoutRate, expiresAt };
      }

      const result =
        mode === "forced_win"
          ? "WIN"
          : mode === "forced_loss"
            ? "LOSS"
            : typeof payload.expectedResult === "string"
              ? payload.expectedResult.toUpperCase()
              : "";
      if (!["WIN", "LOSS", "DRAW", "REFUND"].includes(result))
        throw new BadRequestException(
          "Deterministic sandbox mode requires WIN, LOSS, DRAW, or REFUND",
        );
      return { commandId: command.id, mode, result, expiresAt };
    }
    return null;
  }
}
