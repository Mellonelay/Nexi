import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../prisma/d1-client";
import { createHash } from "crypto";
import { RedisService } from "../redis/redis.service";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";

type LoanAdminContext = { adminId: string; reason: string };

@Injectable()
export class LoanService {
  constructor(
    private readonly redis: RedisService,
    private readonly d1: D1FinancialCommandGateway,
  ) {}

  private async publish(
    type: string,
    referenceId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.redis?.isAvailable()) return;
    await this.redis.publish(
      "nexi:b7:loans",
      JSON.stringify({
        type,
        referenceId,
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );
  }

  private decimal(value: string, label: string): Prisma.Decimal {
    let amount: Prisma.Decimal;
    try {
      amount = new Prisma.Decimal(value);
    } catch {
      throw new BadRequestException(`${label} must be a decimal`);
    }
    if (!amount.isFinite() || amount.isNegative() || amount.isZero())
      throw new BadRequestException(`${label} must be positive`);
    return amount;
  }
  private idempotentId(userId: string, key: string): string {
    const hex = createHash("sha256")
      .update(`loan:${userId}:${key}`)
      .digest("hex")
      .slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20)}`;
  }
  private legacyNumber(value: Prisma.Decimal): number {
    const n = Number(value.toString());
    if (!Number.isFinite(n))
      throw new BadRequestException("Amount is outside legacy storage range");
    return n;
  }

  async applyForLoan(
    userId: string,
    amountText: string,
    durationDays: number,
    collateralImg: string,
    collateral: string,
    idempotencyKey: string,
    planId?: string,
  ): Promise<any> {
    if (!idempotencyKey?.trim())
      throw new BadRequestException("Idempotency key is required");
    const amount = this.decimal(amountText, "amount");
    if (!Number.isInteger(durationDays) || durationDays < 1)
      throw new BadRequestException("duration must be a positive integer");
    const id = this.idempotentId(userId, idempotencyKey);
    if (!planId?.trim())
      throw new BadRequestException("A configured loan plan is required");
    const prior = await this.d1.getLoanApplication(id, userId);
    if (prior) {
      const snapshot = typeof prior.productSnapshot === "string"
        ? JSON.parse(prior.productSnapshot) as { planId?: string }
        : prior.productSnapshot as { planId?: string } | null;
      if (snapshot?.planId !== planId ||
          !new Prisma.Decimal(String(prior.amountDecimal ?? prior.amount)).eq(amount) ||
          Number(prior.durationDays) !== durationDays ||
          String(prior.collateral ?? "") !== collateral ||
          String(prior.collateralImg ?? "") !== collateralImg)
        throw new BadRequestException("Loan original request key belongs to different application terms");
      return { ...prior, replayed: true };
    }
    const plan: any = await this.d1.getLoanPlan(planId);
    if (!plan || !plan.isActive)
      throw new NotFoundException("Loan plan not found");
    const currency = String(plan.currency ?? "")
      .trim()
      .toUpperCase();
    if (!currency)
      throw new BadRequestException("Loan plan has no supported asset");
    const effectiveDuration = Number(plan.durationDays);
    if (!Number.isInteger(effectiveDuration) || effectiveDuration < 1)
      throw new BadRequestException("Loan plan duration is invalid");
    if (durationDays !== effectiveDuration)
      throw new BadRequestException(
        "Duration does not match the selected loan plan",
      );
    const interestRate = new Prisma.Decimal(String(plan.interestRate));
    const minAmount = new Prisma.Decimal(String(plan.minAmount));
    const maxAmount = new Prisma.Decimal(String(plan.maxAmount));
    if (amount.lt(minAmount) || amount.gt(maxAmount))
      throw new BadRequestException("Amount is outside loan plan limits");
    const total = amount.add(amount.mul(interestRate));
    return this.d1.applyLoan({
      id,
      userId,
      amount: amount.toString(),
      currency,
      term: effectiveDuration,
      durationDays: effectiveDuration,
      interestRate: interestRate.toString(),
      totalRepayment: total.toString(),
      collateral,
      collateralImg,
      productSnapshot: {
        planId: plan.id,
        name: plan.name,
        currency,
        durationDays: effectiveDuration,
        interestRate: interestRate.toString(),
        minAmount: minAmount.toString(),
        maxAmount: maxAmount.toString(),
      },
    });
  }

  async approveLoan(
    loanId: string,
    idempotencyKey: string,
    adminContext?: LoanAdminContext,
  ) {
    if (!idempotencyKey?.trim())
      throw new BadRequestException("Idempotency key is required");
    return this.d1.approveLoan({
      loanId,
      idempotencyKey,
      adminId: adminContext?.adminId,
      reason: adminContext?.reason,
    });
  }

  async rejectLoan(
    loanId: string,
    idempotencyKey: string,
    adminContext?: LoanAdminContext,
  ) {
    if (!idempotencyKey?.trim())
      throw new BadRequestException("Idempotency key is required");
    return this.d1.rejectLoan(
      loanId,
      idempotencyKey,
      adminContext?.adminId,
      adminContext?.reason,
    );
  }

  async repay(
    userId: string,
    loanId: string,
    amountText: string,
    idempotencyKey: string,
  ) {
    if (!idempotencyKey?.trim())
      throw new BadRequestException("Idempotency key is required");
    const amount = this.decimal(amountText, "repayment");
    return this.d1.repayLoan({
      userId,
      loanId,
      amount: amount.toString(),
      idempotencyKey,
    });
  }

  async markOverdue() {
    return this.d1.markOverdueLoans();
  }
  async getActiveLoanPlans() {
    return this.d1.listLoanPlans();
  }
  async getUserLoans(userId: string) {
    return this.d1.listLoanApplications(userId);
  }

  async getApplicationByIntent(userId: string, idempotencyKey: string) {
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(idempotencyKey))
      throw new BadRequestException('Loan application idempotency key is invalid');
    return this.d1.getLoanApplication(this.idempotentId(userId, idempotencyKey), userId);
  }
  async getAllLoans() {
    return this.d1.listLoanApplications();
  }
}
