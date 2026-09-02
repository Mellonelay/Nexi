import { LoanStatus, Prisma } from '@prisma/client';
import { LoanService } from '../../src/loans/loans.service';

describe('LoanService', () => {
  it('stores exact Decimal principal and total repayment while preserving retry identity', async () => {
    const rows = new Map<string, any>();
    const prisma: any = {
      loanApplication: {
        upsert: jest.fn(async ({ where, create }: any) => {
          if (!rows.has(where.id)) rows.set(where.id, create);
          return rows.get(where.id);
        }),
      },
    };
    const service = new LoanService(prisma, {} as any);
    const first = await service.applyForLoan('user-1', '10.123456789012345678', 30, 'doc', 'asset', 'key-1');
    const replay = await service.applyForLoan('user-1', '10.123456789012345678', 30, 'doc', 'asset', 'key-1');
    expect(first).toBe(replay);
    expect(new Prisma.Decimal(first.amountDecimal).toString()).toBe('10.123456789012345678');
    expect(new Prisma.Decimal(first.totalRepaymentDecimal).toString()).toBe('11.135802467913580246');
    expect(first.status).toBe(LoanStatus.PENDING);
    expect(first.productSnapshot).toEqual({ currency: 'USDT', durationDays: 30, interestRate: '0.1' });
  });

  it('routes overdue loan transitions through the D1 gateway when enabled', async () => {
    const d1: any = {
      isEnabled: jest.fn(() => true),
      markOverdueLoans: jest.fn(async () => ({ count: 2 })),
    };
    const prisma: any = { loanApplication: { updateMany: jest.fn() } };
    const service = new LoanService(prisma, {} as any, undefined, d1);

    await expect(service.markOverdue()).resolves.toEqual({ count: 2 });

    expect(d1.markOverdueLoans).toHaveBeenCalledTimes(1);
    expect(prisma.loanApplication.updateMany).not.toHaveBeenCalled();
  });

  it('fails closed for financial loan approval when D1 is unavailable', async () => {
    const prisma: any = { $transaction: jest.fn() };
    const service = new LoanService(prisma, {} as any);
    await expect(service.approveLoan('loan-1', 'key-1')).rejects.toThrow('D1 financial authority is unavailable');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('fails closed for financial loan repayment when D1 is unavailable', async () => {
    const prisma: any = { $transaction: jest.fn() };
    const service = new LoanService(prisma, {} as any);
    await expect(service.repay('user-1', 'loan-1', '1', 'key-1')).rejects.toThrow('D1 financial authority is unavailable');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('fails closed for financial loan rejection when D1 is unavailable', async () => {
    const prisma: any = { $transaction: jest.fn() };
    const service = new LoanService(prisma, {} as any);
    await expect(service.rejectLoan('loan-1', 'key-1')).rejects.toThrow('D1 financial authority is unavailable');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('requires idempotency for D1 loan rejection', async () => {
    const d1: any = { isEnabled: jest.fn(() => true), rejectLoan: jest.fn() };
    const service = new LoanService({} as any, {} as any, undefined, d1);
    await expect(service.rejectLoan('loan-1', '')).rejects.toThrow('Idempotency key is required');
    expect(d1.rejectLoan).not.toHaveBeenCalled();
  });

});
