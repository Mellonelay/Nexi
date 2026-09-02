import { Prisma } from '@prisma/client';
import { MiningService } from '../../src/mining/mining.service';

describe('MiningService', () => {
  it('reserves exact Decimal principal and replays the same subscription idempotently', async () => {
    const subscriptions = new Map<string, any>();
    const plan = { id: 'plan-1', isActive: true, currency: 'USDT', minDepositDecimal: new Prisma.Decimal('1'), maxDepositDecimal: new Prisma.Decimal('100'), lockupPeriod: 30, dailyYieldDecimal: new Prisma.Decimal('0.01') };
    const tx: any = {
      miningPlan: { findUnique: jest.fn(async () => plan) },
      miningSubscription: {
        findUnique: jest.fn(async ({ where }: any) => subscriptions.get(where.id) ?? null),
        upsert: jest.fn(async ({ create }: any) => { if (!subscriptions.has(create.id)) subscriptions.set(create.id, create); return subscriptions.get(create.id); }),
      },
    };
    const prisma: any = { $transaction: async (callback: any) => callback(tx) };
    const ledger: any = {
      getAccountForUser: jest.fn(async () => ({ id: 'account-1', asset: 'USDT' })),
      reserve: jest.fn(async () => ({ replayed: false })),
    };
    const service = new MiningService(prisma, ledger);
    const first = await service.subscribe('user-1', 'plan-1', '12.345678901234567890', 'key-1');
    const replay = await service.subscribe('user-1', 'plan-1', '12.345678901234567890', 'key-1');
    expect(first).toBe(replay);
    expect(first.amountDecimal).toBe('12.34567890123456789');
    expect(first.planSnapshot).toEqual({
      name: undefined,
      currency: 'USDT',
      lockupPeriod: 30,
      dailyYield: '0.01',
      minDeposit: '1',
      maxDeposit: '100',
    });
    expect(ledger.reserve).toHaveBeenCalledTimes(1);
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
