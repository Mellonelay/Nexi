import { AdminService } from '../../src/admin/admin.service';

describe('Admin mining configuration authority', () => {
  const context = { adminId: 'admin-1', reason: 'reviewed plan change', idempotencyKey: 'mining-plan-key-01' };
  const createService = () => {
    const d1: any = {
      isEnabled: jest.fn().mockReturnValue(true),
      listAdminMiningPlans: jest.fn().mockResolvedValue([{ id: 'disabled-plan', isActive: 0 }]),
      createMiningPlan: jest.fn().mockResolvedValue({ id: 'plan-1' }),
      updateMiningPlan: jest.fn().mockResolvedValue({ id: 'plan-1' }),
      getMiningPlan: jest.fn().mockResolvedValue({ id: 'plan-1', name: 'Basic', currency: 'USDT', lockupPeriod: 7, dailyYieldDecimal: '0.01', minDepositDecimal: '10', maxDepositDecimal: '100', isActive: 1 }),
    };
    const prisma: any = { $transaction: jest.fn(), miningPlan: { findMany: jest.fn() } };
    const service = Object.assign(Object.create(AdminService.prototype), { d1, prisma });
    return { service, d1, prisma };
  };

  it('lists disabled plans from D1 so Admin can re-enable them', async () => {
    const { service, d1, prisma } = createService();
    await expect(service.getMiningPlans()).resolves.toEqual([{ id: 'disabled-plan', isActive: 0 }]);
    expect(d1.listAdminMiningPlans).toHaveBeenCalled();
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
