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
    if (this.d1?.isEnabled()) return this.d1.approveLoan({ loanId, idempotencyKey, adminId: adminContext?.adminId, reason: adminContext?.reason });
    const result = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.loanApplication.findUnique({ where: { id: loanId } });
      if (!loan) throw new NotFoundException('Loan application not found');
      if (loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.APPROVED) return loan;
      if (loan.status !== LoanStatus.PENDING) throw new BadRequestException('Loan is not pending review');
      const account = await this.ledger.getAccountForUser(loan.userId, loan.currency, tx);
      await this.ledger.credit({ accountId: account.id, asset: loan.currency, amount: loan.amountDecimal.toString(), referenceType: 'LOAN_DISBURSEMENT', referenceId: loan.id, idempotencyKey: `loan-disbursement:${loan.id}:${idempotencyKey}`, economicGroup: loan.id }, tx);
      const approvedAt = new Date();
      const dueDate = new Date(approvedAt.getTime() + loan.durationDays * 86400000);
      const approved = await tx.loanApplication.update({ where: { id: loan.id }, data: { status: LoanStatus.ACTIVE, approvedAt, dueDate } });
      if (adminContext) {
        await tx.adminAuditLog.create({ data: { adminId: adminContext.adminId, action: 'LOAN_APPLICATION_APPROVED', target: loan.id, details: { reason: adminContext.reason, idempotencyKey, before: loan.status, after: approved.status } } });
      }
      return approved;
    });
    await this.publish('LOAN_DISBURSED', loanId, {});
    return result;
  }

  async rejectLoan(loanId: string, _idempotencyKey?: string, adminContext?: LoanAdminContext) {
    if (this.d1?.isEnabled()) return this.d1.rejectLoan(loanId, adminContext?.adminId, adminContext?.reason);
    const rejected = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.loanApplication.findUnique({ where: { id: loanId } });
      if (!loan) throw new NotFoundException('Loan application not found');
      if (loan.status === LoanStatus.REJECTED) return loan;
      if (loan.status !== LoanStatus.PENDING) throw new BadRequestException('Loan is not pending review');
      const row = await tx.loanApplication.update({ where: { id: loanId }, data: { status: LoanStatus.REJECTED } });
      if (adminContext) await tx.adminAuditLog.create({ data: { adminId: adminContext.adminId, action: 'LOAN_APPLICATION_REJECTED', target: loanId, details: { reason: adminContext.reason, idempotencyKey: _idempotencyKey ?? null, before: loan.status, after: row.status } } });
      return row;
    });
    await this.publish('LOAN_REJECTED', loanId, {});
    return rejected;
  }

  async repay(userId: string, loanId: string, amountText: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const amount = this.decimal(amountText, 'repayment');
    if (this.d1?.isEnabled()) return this.d1.repayLoan({ userId, loanId, amount: amount.toString(), idempotencyKey });
    const result = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.loanApplication.findUnique({ where: { id: loanId } });
      if (!loan || loan.userId !== userId) throw new NotFoundException('Loan not found');
      if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.OVERDUE) throw new BadRequestException('Loan is not repayable');
      const account = await this.ledger.getAccountForUser(userId, loan.currency, tx);
      const ledgerIdempotencyKey = `loan-repayment:${loan.id}:${idempotencyKey}`;
      const posting = await this.ledger.debit({ accountId: account.id, asset: loan.currency, amount: amount.toString(), referenceType: 'LOAN_REPAYMENT', referenceId: loan.id, idempotencyKey: ledgerIdempotencyKey, economicGroup: loan.id }, tx);
      const activity = await tx.activity.findUnique({ where: { idempotencyKey: ledgerIdempotencyKey }, select: { id: true } });
      if (!activity) throw new BadRequestException('Loan repayment ledger activity was not created');
      const repaymentId = this.idempotentId(`repayment:${loan.id}`, idempotencyKey);
      const existing = await tx.legacyLoanRepayment.findUnique({ where: { id: repaymentId } });
      if (existing) {
        if (!existing.ledgerPostingId || !existing.activityId) {
          await tx.legacyLoanRepayment.update({ where: { id: repaymentId }, data: { ledgerPostingId: posting.postingId, activityId: activity.id } });
        }
        return loan;
      }
      const paidAggregate = await tx.legacyLoanRepayment.aggregate({ where: { loanId: loan.id }, _sum: { amountDecimal: true } });
      const paid = new Prisma.Decimal((paidAggregate._sum.amountDecimal ?? 0).toString());
      const remaining = new Prisma.Decimal(loan.totalRepaymentDecimal.toString()).sub(paid).sub(amount);
      if (remaining.isNegative()) throw new BadRequestException('Repayment exceeds outstanding balance');
      await tx.legacyLoanRepayment.create({ data: { id: repaymentId, loanId: loan.id, amount: Number(amount.toString()), amountDecimal: amount.toString(), currency: loan.currency, ledgerPostingId: posting.postingId, activityId: activity.id } });
      const updated = await tx.loanApplication.update({ where: { id: loan.id }, data: { status: remaining.isZero() ? LoanStatus.PAID : loan.status } });
      return updated;
    });
    await this.publish('LOAN_REPAYMENT_POSTED', loanId, { amount: amount.toString() });
    return result;
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
