import { Prisma } from '../../src/prisma/d1-client';
import { MiningService } from '../../src/mining/mining.service';

describe('MiningService', () => {
  it('routes exact Decimal principal and idempotency through D1', async () => {
    const plan = { id: 'plan-1', isActive: true, currency: 'USDT', minDepositDecimal: new Prisma.Decimal('1'), maxDepositDecimal: new Prisma.Decimal('100'), lockupPeriod: 30, dailyYieldDecimal: new Prisma.Decimal('0.01') };
    const d1: any = {
      getMiningPlan: jest.fn().mockResolvedValue(plan),
      subscribeMining: jest.fn(async (command: any) => ({ ...command, amount: command.amount })),
    };
    const service = new MiningService({ isAvailable: () => false } as any, d1);
    const first = await service.subscribe('user-1', 'plan-1', '12.345678901234567890', 'key-1');
    const replay = await service.subscribe('user-1', 'plan-1', '12.345678901234567890', 'key-1');
    expect(first.amount).toBe('12.34567890123456789');
    expect(replay.amount).toBe(first.amount);
    expect(d1.subscribeMining).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', planId: 'plan-1', amount: '12.34567890123456789', idempotencyKey: 'key-1' }));
  });

  it.each([
    ['subscribe', (service: MiningService) => service.subscribe('user-1', 'plan-1', '1', 'key-1'), 'getMiningPlan'],
    ['accrue', (service: MiningService) => service.accrue('subscription-1'), 'getMiningSubscription'],
    ['redeem', (service: MiningService) => service.redeem('subscription-1'), 'getMiningSubscription'],
    ['cancel', (service: MiningService) => service.cancel('user-1', 'subscription-1', 'key-1'), 'releaseMiningSubscription'],
  ])('propagates D1 unavailability for %s without legacy storage', async (_name, operation, method) => {
    const d1: any = {
      getMiningPlan: jest.fn().mockRejectedValue(new Error('D1 financial authority is unavailable')),
      getMiningSubscription: jest.fn().mockRejectedValue(new Error('D1 financial authority is unavailable')),
      releaseMiningSubscription: jest.fn().mockRejectedValue(new Error('D1 financial authority is unavailable')),
    };
    await expect(operation(new MiningService({ isAvailable: jest.fn().mockReturnValue(false) } as any, d1))).rejects.toThrow('D1 financial authority is unavailable');
    expect(d1[method]).toHaveBeenCalled();
  });

  it('uses the D1 scheduler query and D1 admin listing', async () => {
    const previousB7 = process.env.NEXI_B7_ENABLED;
    const previousScheduler = process.env.NEXI_SCHEDULER_ENABLED;
    delete process.env.NEXI_B7_ENABLED;
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    const d1: any = {
      getMiningSubscription: jest.fn().mockResolvedValue({ id: 'subscription-1', userId: 'user-1', status: 'ACTIVE', endDate: null }),
      listMiningSubscriptionsForScheduler: jest.fn().mockResolvedValue([{ id: 'subscription-1' }]),
      accrueMiningReward: jest.fn().mockResolvedValue({ id: 'subscription-1' }),
      listAllMiningSubscriptions: jest.fn().mockResolvedValue([{ id: 'subscription-2' }]),
    };
    const redis: any = { isAvailable: jest.fn().mockReturnValue(true), tryAcquireLock: jest.fn().mockResolvedValue(true), releaseLock: jest.fn().mockResolvedValue(undefined), publish: jest.fn() };
    const service = new MiningService(redis, d1);
    try {
      await expect(service.distributeRewards()).resolves.toEqual({ processed: 1 });
      await expect(service.getAllSubscriptions()).resolves.toEqual([{ id: 'subscription-2' }]);
      expect(d1.listMiningSubscriptionsForScheduler).toHaveBeenCalledTimes(1);
      expect(d1.accrueMiningReward).toHaveBeenCalledWith('subscription-1');
    } finally {
      if (previousB7 === undefined) delete process.env.NEXI_B7_ENABLED; else process.env.NEXI_B7_ENABLED = previousB7;
      if (previousScheduler === undefined) delete process.env.NEXI_SCHEDULER_ENABLED; else process.env.NEXI_SCHEDULER_ENABLED = previousScheduler;
    }
  });
});
