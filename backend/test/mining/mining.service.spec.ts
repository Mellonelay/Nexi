import { Prisma } from '@prisma/client';
import { MiningService } from '../../src/mining/mining.service';

describe('MiningService', () => {
  it('routes exact Decimal principal and idempotency through D1', async () => {
    const plan = { id: 'plan-1', isActive: true, currency: 'USDT', minDepositDecimal: new Prisma.Decimal('1'), maxDepositDecimal: new Prisma.Decimal('100'), lockupPeriod: 30, dailyYieldDecimal: new Prisma.Decimal('0.01') };
    const d1: any = {
      isEnabled: jest.fn(() => true),
      getMiningPlan: jest.fn(async () => plan),
      subscribeMining: jest.fn(async (command: any) => ({ ...command, amountDecimal: command.amount })),
    };
    const prisma: any = { $transaction: jest.fn() };
    const service = new MiningService(prisma, {} as any, undefined, d1);
    const first = await service.subscribe('user-1', 'plan-1', '12.345678901234567890', 'key-1');
    const replay = await service.subscribe('user-1', 'plan-1', '12.345678901234567890', 'key-1');
    expect(first.amount).toBe('12.34567890123456789');
    expect(replay.amount).toBe(first.amount);
    expect(d1.subscribeMining).toHaveBeenCalledTimes(2);
    expect(d1.subscribeMining.mock.calls[0][0]).toMatchObject({
      userId: 'user-1', planId: 'plan-1', amount: '12.34567890123456789', idempotencyKey: 'key-1',
      planSnapshot: { currency: 'USDT', lockupPeriod: 30, dailyYield: '0.01', minDeposit: '1', maxDeposit: '100' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['subscribe', (service: MiningService) => service.subscribe('user-1', 'plan-1', '1', 'key-1')],
    ['accrue', (service: MiningService) => service.accrue('subscription-1')],
    ['redeem', (service: MiningService) => service.redeem('subscription-1')],
    ['cancel', (service: MiningService) => service.cancel('user-1', 'subscription-1', 'key-1')],
  ])('fails closed for %s when D1 is unavailable without touching Prisma', async (_name, operation) => {
    const prisma: any = { $transaction: jest.fn(), miningPlan: { findUnique: jest.fn() }, miningSubscription: { findUnique: jest.fn() } };
    const service = new MiningService(prisma, {} as any);
    await expect(operation(service)).rejects.toThrow('D1 financial authority is unavailable');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.miningPlan.findUnique).not.toHaveBeenCalled();
    expect(prisma.miningSubscription.findUnique).not.toHaveBeenCalled();
  });

  it('uses the D1 scheduler query and D1 admin listing when D1 is enabled', async () => {
    const previousB7 = process.env.NEXI_B7_ENABLED;
    const previousScheduler = process.env.NEXI_SCHEDULER_ENABLED;
    process.env.NEXI_B7_ENABLED = 'true';
    process.env.NEXI_SCHEDULER_ENABLED = 'true';

    const d1: any = {
      isEnabled: jest.fn(() => true),
      getMiningSubscription: jest.fn(async () => ({ id: 'subscription-1', userId: 'user-1', status: 'ACTIVE', endDate: null })),
      listMiningSubscriptionsForScheduler: jest.fn(async () => [{ id: 'subscription-1' }]),
      accrueMiningReward: jest.fn(async () => ({ id: 'subscription-1' })),
      listAllMiningSubscriptions: jest.fn(async () => [{ id: 'subscription-2' }]),
    };
    const redis: any = {
      isAvailable: jest.fn(() => true),
      tryAcquireLock: jest.fn(async () => true),
      releaseLock: jest.fn(async () => undefined),
      publish: jest.fn(async () => undefined),
    };
    const prisma: any = { miningSubscription: { findMany: jest.fn() } };
    const service = new MiningService(prisma, {} as any, redis, d1);

    try {
      await expect(service.distributeRewards()).resolves.toEqual({ processed: 1 });
      await expect(service.getAllSubscriptions()).resolves.toEqual([{ id: 'subscription-2' }]);

      expect(d1.listMiningSubscriptionsForScheduler).toHaveBeenCalledTimes(1);
      expect(d1.accrueMiningReward).toHaveBeenCalledWith('subscription-1');
      expect(d1.listAllMiningSubscriptions).toHaveBeenCalledTimes(1);
      expect(prisma.miningSubscription.findMany).not.toHaveBeenCalled();
    } finally {
      if (previousB7 === undefined) delete process.env.NEXI_B7_ENABLED;
      else process.env.NEXI_B7_ENABLED = previousB7;
      if (previousScheduler === undefined) delete process.env.NEXI_SCHEDULER_ENABLED;
      else process.env.NEXI_SCHEDULER_ENABLED = previousScheduler;
    }
  });

});
