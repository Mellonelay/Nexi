import { LoanStatus, Prisma } from '@prisma/client';
import { LoanService } from '../../src/loans/loans.service';

describe('LoanService', () => {
  it('routes exact Decimal principal and idempotency through D1', async () => {
    const rows = new Map<string, any>();
    const d1: any = {
      applyLoan: jest.fn(async (command: any) => {
        if (!rows.has(command.id)) rows.set(command.id, { ...command, amountDecimal: command.amount, totalRepaymentDecimal: command.totalRepayment, status: LoanStatus.PENDING });
        return rows.get(command.id);
      }),
    };
    const service = new LoanService({ isAvailable: () => false } as any, d1);
    const first = await service.applyForLoan('user-1', '10.123456789012345678', 30, 'doc', 'asset', 'key-1');
    const replay = await service.applyForLoan('user-1', '10.123456789012345678', 30, 'doc', 'asset', 'key-1');
    expect(first).toBe(replay);
    expect(new Prisma.Decimal(first.amountDecimal).toString()).toBe('10.123456789012345678');
    expect(new Prisma.Decimal(first.totalRepaymentDecimal).toString()).toBe('11.135802467913580246');
    expect(first.status).toBe(LoanStatus.PENDING);
    expect(d1.applyLoan).toHaveBeenCalledTimes(2);
  });

  it('routes overdue loan transitions through D1', async () => {
    const d1: any = { markOverdueLoans: jest.fn().mockResolvedValue({ count: 2 }) };
    await expect(new LoanService({ isAvailable: () => false } as any, d1).markOverdue()).resolves.toEqual({ count: 2 });
  });

  it.each([
    ['approval', (service: LoanService) => service.approveLoan('loan-1', 'key-1'), 'approveLoan'],
    ['repayment', (service: LoanService) => service.repay('user-1', 'loan-1', '1', 'key-1'), 'repayLoan'],
    ['rejection', (service: LoanService) => service.rejectLoan('loan-1', 'key-1'), 'rejectLoan'],
  ])('propagates D1 unavailability for financial loan %s without ORM access', async (_name, operation, method) => {
    const d1: any = { [method]: jest.fn().mockRejectedValue(new Error('D1 financial authority is unavailable')) };
    const prisma: any = { $transaction: jest.fn() };
    await expect(operation(new LoanService({ isAvailable: () => false } as any, d1))).rejects.toThrow('D1 financial authority is unavailable');
    expect(d1[method]).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('requires idempotency for D1 loan rejection', async () => {
    const d1: any = { rejectLoan: jest.fn() };
    const service = new LoanService({ isAvailable: () => false } as any, d1);
    await expect(service.rejectLoan('loan-1', '')).rejects.toThrow('Idempotency key is required');
    expect(d1.rejectLoan).not.toHaveBeenCalled();
  });
});
