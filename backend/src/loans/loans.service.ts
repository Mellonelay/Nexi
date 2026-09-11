import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '../prisma/d1-client';
import { createHash } from 'crypto';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { RedisService } from '../redis/redis.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

type LoanAdminContext = { adminId: string; reason: string };

@Injectable()
export class LoanService {
  constructor(private readonly redis: RedisService, private readonly d1: D1FinancialCommandGateway) {}

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

  async approveLoan(loanId: string, idempotencyKey: string, adminContext?: LoanAdminContext) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    return this.d1.approveLoan({ loanId, idempotencyKey, adminId: adminContext?.adminId, reason: adminContext?.reason });
  }

  async rejectLoan(loanId: string, idempotencyKey: string, adminContext?: LoanAdminContext) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    return this.d1.rejectLoan(loanId, idempotencyKey, adminContext?.adminId, adminContext?.reason);
  }

  async repay(userId: string, loanId: string, amountText: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const amount = this.decimal(amountText, 'repayment');
    return this.d1.repayLoan({ userId, loanId, amount: amount.toString(), idempotencyKey });
  }

  async markOverdue() {
    return this.d1.markOverdueLoans();
  }
  async getActiveLoanPlans() {
    return this.d1.listLoanPlans();
  }
  async getUserLoans(userId: string) { return this.d1.listLoanApplications(userId); }
  async getAllLoans() { return this.d1.listLoanApplications(); }
}
