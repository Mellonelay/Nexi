import { AdminService } from '../../src/admin/admin.service';

describe('Admin mining configuration authority', () => {
  const context = { adminId: 'admin-1', reason: 'reviewed plan change', idempotencyKey: 'mining-plan-key-01' };
  const createService = () => {
    const d1: any = {
      isEnabled: jest.fn().mockReturnValue(true),
      listAdminMiningPlans: jest.fn().mockResolvedValue([{ id: 'disabled-plan', isActive: 0 }]),
      listAdminLoanPlans: jest.fn().mockResolvedValue([{ id: 'inactive-loan', isActive: false }]),
      createMiningPlan: jest.fn().mockResolvedValue({ id: 'plan-1' }),
      updateMiningPlan: jest.fn().mockResolvedValue({ id: 'plan-1' }),
      getMiningPlan: jest.fn().mockResolvedValue({ id: 'plan-1', name: 'Basic', currency: 'USDT', lockupPeriod: 7, dailyYieldDecimal: '0.01', minDepositDecimal: '10', maxDepositDecimal: '100', isActive: 1 }),
    };
    const prisma: any = { $transaction: jest.fn(), miningPlan: { findMany: jest.fn() } };
    const service = Object.assign(Object.create(AdminService.prototype), { d1, prisma });
    return { service, d1, prisma };
  };

  it('reuses the original Admin audit receipt for a Prisma mining-plan replay', async () => {
    const plan = {
      id: 'plan-1', name: 'Basic', currency: 'USDT', lockupPeriod: 7,
      dailyYield: '0.01', minDeposit: '10', maxDeposit: '100',
    };
    const receipts: any[] = [];
    const tx: any = {
      miningPlan: {
        create: jest.fn(async () => plan),
        count: jest.fn(async () => 0),
        findUnique: jest.fn(async () => plan),
      },
      adminAuditLog: {
        findMany: jest.fn(async () => receipts),
        create: jest.fn(async ({ data }: any) => {
          const receipt = { ...data, createdAt: new Date() };
          receipts.push(receipt);
          return receipt;
        }),
      },
    };
    const prisma: any = { $transaction: jest.fn(async (work: any) => work(tx)) };
    const d1: any = { isEnabled: () => false };
    const service = Object.assign(Object.create(AdminService.prototype), { d1, prisma });
    const payload = {
      name: 'Basic', currency: 'USDT', lockupPeriod: 7,
      dailyYield: '0.01', minDeposit: '10', maxDeposit: '100',
    };
    const first = await service.createMiningPlan(payload, context);
    const replay = await service.createMiningPlan(payload, context);
    expect(first.auditId).toBe(replay.auditId);
    expect(replay.replayed).toBe(true);
    expect(tx.miningPlan.create).toHaveBeenCalledTimes(1);
    expect(tx.adminAuditLog.create).toHaveBeenCalledTimes(1);
  });

  it('enforces the seven-plan limit, including disabled plans, in the Prisma fallback transaction', async () => {
    const tx: any = {
      miningPlan: { count: jest.fn(async () => 7), create: jest.fn() },
    };
    const prisma: any = { $transaction: jest.fn(async (work: any) => work(tx)) };
    const d1: any = { isEnabled: () => false };
    const service = Object.assign(Object.create(AdminService.prototype), { d1, prisma });
    await expect(service.createMiningPlan({
      name: 'Plan 8', currency: 'USDT', lockupPeriod: 7,
      dailyYield: '0.01', minDeposit: '10', maxDeposit: '100', isActive: false,
    })).rejects.toThrow('Mining plans are limited to 7 total, including disabled plans');
    expect(tx.miningPlan.count).toHaveBeenCalledTimes(1);
    expect(tx.miningPlan.create).not.toHaveBeenCalled();
  });

  it('lists disabled plans from D1 so Admin can re-enable them', async () => {
    const { service, d1, prisma } = createService();
    await expect(service.getMiningPlans()).resolves.toEqual([{ id: 'disabled-plan', isActive: 0 }]);
    expect(d1.listAdminMiningPlans).toHaveBeenCalled();
    expect(prisma.miningPlan.findMany).not.toHaveBeenCalled();
  });

  it('lists disabled loan plans through the Admin-specific D1 read path', async () => {
    const { service, d1, prisma } = createService();
    await expect(service.getLoanPlans()).resolves.toEqual([{ id: 'inactive-loan', isActive: false }]);
    expect(d1.listAdminLoanPlans).toHaveBeenCalledTimes(1);
    expect(prisma.miningPlan.findMany).not.toHaveBeenCalled();
  });

  it('creates plans in D1, the authority used by Public mining', async () => {
    const { service, d1, prisma } = createService();
    await service.createMiningPlan({ name: 'Basic', currency: 'USDT', lockupPeriod: 7, dailyYield: 0.01, minDeposit: 10, maxDeposit: 100 }, context);
    expect(d1.createMiningPlan).toHaveBeenCalledWith(expect.objectContaining({ name: 'Basic', currency: 'USDT', lockupPeriod: 7, dailyYield: '0.01', minDeposit: '10', maxDeposit: '100', adminId: context.adminId, reason: context.reason, idempotencyKey: context.idempotencyKey }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('updates plans in D1, the authority used by Public mining', async () => {
    const { service, d1, prisma } = createService();
    await service.updateMiningPlan('plan-1', { dailyYield: 0.02, isActive: false }, context);
    expect(d1.updateMiningPlan).toHaveBeenCalledWith(expect.objectContaining({ id: 'plan-1', name: 'Basic', dailyYield: '0.02', minDeposit: '10', maxDeposit: '100', isActive: false, adminId: context.adminId, idempotencyKey: context.idempotencyKey }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
