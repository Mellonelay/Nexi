import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { LoanStatus, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

type LoanAdminContext = { adminId: string; reason: string };

@Injectable()
export class LoanService {
  constructor(private readonly prisma: PrismaService, private readonly ledger: LedgerAuthorityService, @Optional() private readonly redis?: RedisService, @Optional() private readonly d1?: D1FinancialCommandGateway) {}

  private async publish(type: string, referenceId: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.redis?.isAvailable()) return;
    await this.redis.publish('nexi:b7:loans', JSON.stringify({ type, referenceId, occurredAt: new Date().toISOString(), payload }));
  }

  private decimal(value: string, label: string): Prisma.Decimal {
    let amount: Prisma.Decimal;
    try { amount = new Prisma.Decimal(value); } catch { throw new BadRequestException(`${label} must be a decimal`); }
    if (!amount.isFinite() || amount.isNegative() || amount.isZero()) throw new BadRequestException(`${label} must be positive`);
    return amount;
  }
  private idempotentId(userId: string, key: string): string {
    const hex = createHash('sha256').update(`loan:${userId}:${key}`).digest('hex').slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(parseInt(hex.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, '0')}${hex.slice(18, 20)}-${hex.slice(20)}`;
  }
  private legacyNumber(value: Prisma.Decimal): number { const n = Number(value.toString()); if (!Number.isFinite(n)) throw new BadRequestException('Amount is outside legacy storage range'); return n; }

  async applyForLoan(userId: string, amountText: string, durationDays: number, collateralImg: string, collateral: string, idempotencyKey: string, planId?: string): Promise<any> {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const amount = this.decimal(amountText, 'amount');
    if (!Number.isInteger(durationDays) || durationDays < 1) throw new BadRequestException('duration must be a positive integer');
    const id = this.idempotentId(userId, idempotencyKey);
    if (this.d1?.isEnabled()) {
      const plan: any = planId ? await this.d1.getLoanPlan(planId) : null;
      if (planId && (!plan || !plan.isActive)) throw new NotFoundException('Loan plan not found');
      const effectiveDuration = Number(plan?.durationDays ?? durationDays);
      const interestRate = new Prisma.Decimal(String(plan?.interestRate ?? '0.1'));
      const minAmount = plan ? new Prisma.Decimal(String(plan.minAmount)) : null;
      const maxAmount = plan ? new Prisma.Decimal(String(plan.maxAmount)) : null;
      if (minAmount && (amount.lt(minAmount) || amount.gt(maxAmount!))) throw new BadRequestException('Amount is outside loan plan limits');
      const total = amount.add(amount.mul(interestRate));
      return this.d1.applyLoan({ id, userId, amount: amount.toString(), currency: 'USDT', term: effectiveDuration, durationDays: effectiveDuration, interestRate: interestRate.toString(), totalRepayment: total.toString(), collateral, collateralImg, productSnapshot: plan ? { planId: plan.id, name: plan.name, currency: 'USDT', durationDays: effectiveDuration, interestRate: interestRate.toString(), minAmount: minAmount?.toString() ?? null, maxAmount: maxAmount?.toString() ?? null } : { currency: 'USDT', durationDays: effectiveDuration, interestRate: interestRate.toString() } });
    }
    const plan = planId ? await this.prisma.loanPlan.findFirst({ where: { id: planId, isActive: true } }) : null;
    if (planId && !plan) throw new NotFoundException('Loan plan not found');
    const effectiveDuration = plan?.durationDays ?? durationDays;
    const minAmount = plan ? new Prisma.Decimal(plan.minAmount) : null;
    const maxAmount = plan ? new Prisma.Decimal(plan.maxAmount) : null;
    if (minAmount && (amount.lt(minAmount) || amount.gt(maxAmount!))) throw new BadRequestException('Amount is outside loan plan limits');
    const interestRate = plan ? new Prisma.Decimal(plan.interestRate) : new Prisma.Decimal('0.1');
    const interest = amount.mul(interestRate);
    const total = amount.add(interest);
    const result = await this.prisma.loanApplication.upsert({
      where: { id },
      update: {},
      create: {
        id,
        userId,
        amount: this.legacyNumber(amount),
        amountDecimal: amount.toString(),
        currency: 'USDT',
        term: effectiveDuration,
        durationDays: effectiveDuration,
        interestRate: Number(interestRate.toString()),
        interestRateDecimal: interestRate.toString(),
        totalRepayment: this.legacyNumber(total),
        totalRepaymentDecimal: total.toString(),
        collateral,
        collateralImg,
        status: LoanStatus.PENDING,
        // The application retains the product terms used for underwriting;
        // later Admin edits do not rewrite an existing loan's economics.
        productSnapshot: plan
          ? { planId: plan.id, name: plan.name, currency: 'USDT', durationDays: effectiveDuration, interestRate: interestRate.toString(), minAmount: minAmount?.toString() ?? null, maxAmount: maxAmount?.toString() ?? null }
          : { currency: 'USDT', durationDays: effectiveDuration, interestRate: interestRate.toString() },
      },
    });
    await this.publish('LOAN_APPLICATION_SUBMITTED', result.id, { userId, amount: amount.toString() });
    return result;
  }

  async approveLoan(loanId: string, idempotencyKey: string, adminContext?: LoanAdminContext) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    if (!this.d1?.isEnabled()) throw new Error('D1 financial authority is unavailable');
    return this.d1.approveLoan({ loanId, idempotencyKey, adminId: adminContext?.adminId, reason: adminContext?.reason });
  }

  async rejectLoan(loanId: string, idempotencyKey: string, adminContext?: LoanAdminContext) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    if (!this.d1?.isEnabled()) throw new Error('D1 financial authority is unavailable');
    return this.d1.rejectLoan(loanId, idempotencyKey, adminContext?.adminId, adminContext?.reason);
  }

  async repay(userId: string, loanId: string, amountText: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const amount = this.decimal(amountText, 'repayment');
    if (!this.d1?.isEnabled()) throw new Error('D1 financial authority is unavailable');
    return this.d1.repayLoan({ userId, loanId, amount: amount.toString(), idempotencyKey });
  }

  async markOverdue() {
    if (this.d1?.isEnabled()) return this.d1.markOverdueLoans();
    return this.prisma.loanApplication.updateMany({ where: { status: LoanStatus.ACTIVE, dueDate: { lt: new Date() } }, data: { status: LoanStatus.OVERDUE } });
  }
  async getActiveLoanPlans() {
    return this.d1?.isEnabled() ? this.d1.listLoanPlans() : this.prisma.loanPlan.findMany({ where: { isActive: true }, orderBy: { durationDays: 'asc' } });
  }
  async getUserLoans(userId: string) { return this.d1?.isEnabled() ? this.d1.listLoanApplications(userId) : this.prisma.loanApplication.findMany({ where: { userId }, include: { repayments: { orderBy: { paidAt: 'desc' } } }, orderBy: { createdAt: 'desc' } }); }
  async getAllLoans() { return this.d1?.isEnabled() ? this.d1.listLoanApplications() : this.prisma.loanApplication.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, email: true } } } }); }
}
