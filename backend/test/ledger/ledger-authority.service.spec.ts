import { Prisma } from '@prisma/client';
import { LedgerAuthorityService } from '../../src/ledger/ledger-authority.service';

describe('LedgerAuthorityService', () => {
  const createService = () => {
    const account = { id: 'account-1', userId: 'user-1', asset: 'USDT', status: 'ACTIVE', available: new Prisma.Decimal('100.00'), locked: new Prisma.Decimal('0') };
    const idempotency = new Map<string, any>();
    let postingNumber = 0;
    const client: any = {
      $transaction: async (callback: any) => callback(client),
      ledgerAccount: {
        upsert: jest.fn(async () => account),
        findUnique: jest.fn(async () => account),
        findMany: jest.fn(async () => [account]),
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (where.available?.gte && account.available.lessThan(where.available.gte)) return { count: 0 };
          if (where.locked?.gte && account.locked.lessThan(where.locked.gte)) return { count: 0 };
          if (data.available?.decrement) account.available = account.available.sub(data.available.decrement);
          if (data.available?.increment) account.available = account.available.add(data.available.increment);
          if (data.locked?.decrement) account.locked = account.locked.sub(data.locked.decrement);
          if (data.locked?.increment) account.locked = account.locked.add(data.locked.increment);
          return { count: 1 };
        }),
        update: jest.fn(async ({ data }: any) => {
          if (data.available?.increment) account.available = account.available.add(data.available.increment);
          return account;
        }),
      },
      ledgerIdempotency: {
        findUnique: jest.fn(async ({ where }: any) => idempotency.get(where.idempotencyKey) ?? null),
        create: jest.fn(async ({ data }: any) => { const row = { id: `idem-${idempotency.size + 1}`, ...data }; idempotency.set(data.idempotencyKey, row); return row; }),
        update: jest.fn(async ({ where, data }: any) => { const row = idempotency.get(where.idempotencyKey); Object.assign(row, data); return row; }),
      },
      ledgerPosting: { create: jest.fn(async ({ data }: any) => ({ id: `posting-${++postingNumber}`, ...data })) },
      ledgerAuditEvent: { create: jest.fn(async ({ data }: any) => data) },
      activity: { upsert: jest.fn(async ({ create }: any) => ({ id: 'activity-1', ...create })) },
      ledgerPostingAggregate: jest.fn(),
    };
    return { service: new LedgerAuthorityService(client), client, account };
  };

  const command = (idempotencyKey: string) => ({ accountId: 'account-1', asset: 'USDT', amount: '12.345678901234567890', referenceType: 'TEST', referenceId: 'ref-1', idempotencyKey });

  it('posts exact reserve deltas and replays the same idempotency key', async () => {
    const { service, account } = createService();
    const first = await service.reserve(command('reserve-1'));
    const replay = await service.reserve(command('reserve-1'));
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(account.available.toString()).toBe('87.65432109876543211');
    expect(account.locked.toString()).toBe('12.34567890123456789');
  });

  it('rejects a reserve larger than available funds', async () => {
    const { service } = createService();
    await expect(service.reserve({ ...command('reserve-2'), amount: '101' })).rejects.toThrow('Ledger account cannot satisfy');
  });

  it('keeps the user-facing activity record idempotent with the ledger posting', async () => {
    const { service, client } = createService();
    const result = await service.credit(command('credit-activity-1'));
    expect(result.replayed).toBe(false);
    expect(client.activity.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { idempotencyKey: 'credit-activity-1' },
      create: expect.objectContaining({
        referenceType: 'TEST',
        ledgerPostingId: result.postingId,
        ledgerCorrelationId: 'credit-activity-1',
      }),
    }));
  });

  it('fails closed instead of mixing a D1 command with a PostgreSQL transaction', async () => {
    const { client } = createService();
    const d1 = {
      isEnabled: jest.fn(() => true),
      reserve: jest.fn(),
    } as any;
    const service = new LedgerAuthorityService(client, d1);

    await expect(service.reserve(command('d1-boundary-1'), {} as any)).rejects.toThrow(
      'D1 runtime cannot participate in a PostgreSQL transaction',
    );
    expect(d1.reserve).not.toHaveBeenCalled();
  });
});
