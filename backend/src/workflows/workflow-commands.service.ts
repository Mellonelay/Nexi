import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { FinancialOperationsService } from "../financial/financial-operations.service";
import { MiningService } from "../mining/mining.service";
import { LoanService } from "../loans/loans.service";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";

type WorkflowCommand = {
  workflow: string;
  instanceId: string;
  action: string;
  entityId: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
};

@Injectable()
export class WorkflowCommandsService {
  constructor(
    private readonly financial: FinancialOperationsService,
    private readonly mining: MiningService,
    private readonly loans: LoanService,
    private readonly d1: D1FinancialCommandGateway,
  ) {}

  assertSignature(
    input: WorkflowCommand,
    signature: string | undefined,
    timestampHeader: string | undefined,
  ): void {
    const secret = process.env.JWT_SECRET;
    const timestamp = Number(timestampHeader);
    if (
      !secret ||
      !signature ||
      !Number.isFinite(timestamp) ||
      Math.abs(Date.now() - timestamp) > 5 * 60 * 1000
    ) {
      throw new UnauthorizedException("Workflow command authentication failed");
    }
    const expected = createHmac("sha256", secret)
      .update(
        `${timestamp}:${input.workflow}:${input.instanceId}:${input.action}:${input.entityId}:${input.idempotencyKey}`,
      )
      .digest("hex");
    const actual = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (
      actual.length !== expectedBuffer.length ||
      !timingSafeEqual(actual, expectedBuffer)
    ) {
      throw new UnauthorizedException("Workflow command authentication failed");
    }
  }

  async execute(input: WorkflowCommand): Promise<Record<string, unknown>> {
    if (!this.d1.isEnabled())
      throw new UnauthorizedException("D1 workflow authority is unavailable");
    if (
      !/^(withdrawal|mining|loan)$/.test(input.workflow) ||
      !/^[A-Za-z0-9._:-]{1,160}$/.test(input.entityId) ||
      !input.idempotencyKey?.trim()
    ) {
      throw new BadRequestException("Invalid workflow command");
    }
    const payload = input.payload ?? {};
    if (input.workflow === "withdrawal") return this.withdrawal(input, payload);
    if (input.workflow === "mining") return this.miningCommand(input, payload);
    return this.loanCommand(input, payload);
  }

  private async withdrawal(
    input: WorkflowCommand,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const withdrawal: any = await this.d1.getWithdrawalById(input.entityId);
    if (!withdrawal) throw new NotFoundException("Withdrawal not found");
    const state = String(withdrawal.state);
    if (input.action === "prepare")
      return {
        done: ["SETTLED", "FAILED", "REJECTED"].includes(state),
        state,
        withdrawal,
      };
    const actor = `workflow:${input.instanceId}`;
    if (input.action === "settle") {
      const receipt =
        typeof payload.receipt === "string" &&
        payload.receipt.startsWith("deterministic:")
          ? payload.receipt
          : `deterministic:workflow:${input.entityId}:${input.idempotencyKey}`;
      return this.financial.settleWithdrawal(
        input.entityId,
        receipt,
        actor,
        "Workflow provider settlement",
      ) as Promise<Record<string, unknown>>;
    }
    if (input.action === "fail")
      return this.financial.failWithdrawal(
        input.entityId,
        typeof payload.reason === "string"
          ? payload.reason
          : "Workflow provider failure",
        actor,
        input.idempotencyKey,
      );
    throw new BadRequestException("Unsupported withdrawal workflow action");
  }

  private async miningCommand(
    input: WorkflowCommand,
    _payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const subscription: any = await this.d1.getMiningSubscription(
      input.entityId,
    );
    if (!subscription)
      throw new NotFoundException("Mining subscription not found");
    if (input.action === "plan") {
      const end = subscription.endDate
        ? new Date(String(subscription.endDate)).getTime()
        : 0;
      return {
        done: String(subscription.status) !== "ACTIVE",
        state: subscription.status,
        nextRunAt:
          end && end <= Date.now()
            ? new Date().toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        subscription,
      };
    }
    if (input.action === "accrue") {
      const result: any = await this.mining.accrue(input.entityId);
      const current: any = await this.d1.getMiningSubscription(input.entityId);
      return {
        done: !current || String(current.status) !== "ACTIVE",
        state: current?.status ?? "UNKNOWN",
        nextRunAt:
          current?.endDate ??
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        result,
      };
    }
    throw new BadRequestException("Unsupported mining workflow action");
  }

  private async loanCommand(
    input: WorkflowCommand,
    _payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const loan: any = await this.d1.getLoanApplication(input.entityId);
    if (!loan) throw new NotFoundException("Loan application not found");
    if (input.action === "schedule") {
      if (["REJECTED", "PAID"].includes(String(loan.status)))
        return { done: true, state: loan.status, loan };
      if (!loan.dueDate)
        throw new BadRequestException("Loan due date is unavailable");
      return {
        done: false,
        state: loan.status,
        dueAt: String(loan.dueDate),
        loan,
      };
    }
    if (input.action === "check-due") {
      const result = await this.loans.markOverdue();
      const current: any = await this.d1.getLoanApplication(input.entityId);
      return {
        done:
          ["PAID", "REJECTED"].includes(String(current?.status)) ||
          String(current?.status) !== "OVERDUE",
        state: current?.status ?? "UNKNOWN",
        result,
        loan: current,
      };
    }
    throw new BadRequestException("Unsupported loan workflow action");
  }
}
