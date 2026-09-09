import { LedgerAccountScope, Prisma, SpotMarginPositionStatus } from '@prisma/client';
import { MarginService } from '../../src/spot/margin.service';
import { MarginPositionDirection, MarginTransferDirection } from '../../src/spot/margin.dto';

describe('Spot isolated margin authority', () => {
  const pair = {
    id: 'pair-1', symbol: 'BTCUSDT', status: 'ACTIVE',
    baseAsset: { symbol: 'BTC', status: 'ACTIVE' },
    quoteAsset: { symbol: 'USDT', status: 'ACTIVE' },
  };

  it('moves funds between main and margin ledger scopes with one paired transfer', async () => {
    const account = { id: 'margin-account-1', userId: 'user-1', pair: 'BTCUSDT' };
    const tx = {
      spotMarginActivity: { upsert: jest.fn().mockResolvedValue({ id: 'activity-1' }) },
    };
    const prisma = {
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) },
      spotMarginAccount: { upsert: jest.fn().mockResolvedValue(account) },
      spotMarginPosition: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
    };
    const ledger = {
      getAccountForUserInScope: jest.fn()
        .mockResolvedValueOnce({ id: 'main-usdt', asset: 'USDT' })
        .mockResolvedValueOnce({ id: 'margin-usdt', asset: 'USDT' }),
      pairedTransfer: jest.fn().mockResolvedValue({ debitPostingId: 'debit-1', creditPostingId: 'credit-1' }),
    };
    const service = new MarginService(prisma as any, ledger as any);

    await expect(service.transfer('user-1', { pair: 'btc/usdt', direction: MarginTransferDirection.TO_MARGIN, asset: 'USDT', amount: '100', idempotencyKey: 'margin-transfer-1' })).resolves.toMatchObject({ activityId: 'activity-1' });
    expect(ledger.getAccountForUserInScope).toHaveBeenNthCalledWith(1, 'user-1', 'USDT', LedgerAccountScope.MAIN, tx);
    expect(ledger.getAccountForUserInScope).toHaveBeenNthCalledWith(2, 'user-1', 'USDT', LedgerAccountScope.MARGIN, tx);
    expect(ledger.pairedTransfer).toHaveBeenCalledWith(expect.objectContaining({ debitAccountId: 'main-usdt', creditAccountId: 'margin-usdt', amount: '100' }), tx);
  });

  it('creates a pending position and reserves only actual collateral until Spot fill exists', async () => {
    const tx = {
      gate2SpotOrder: { findUnique: jest.fn().mockResolvedValue({ id: 'entry-order-1', status: 'OPEN', filled: '0' }) },
      spotMarginPosition: { create: jest.fn().mockResolvedValue({ id: 'position-1', status: SpotMarginPositionStatus.PENDING, quantity: '0' }) },
      spotMarginPositionEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
      spotMarginActivity: { create: jest.fn().mockResolvedValue({ id: 'activity-1' }) },
    };
    const prisma = {
      spotMarginPosition: { findUnique: jest.fn().mockResolvedValue(null) },
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) },
      marketQuoteLatest: { findUnique: jest.fn().mockResolvedValue({ state: 'LIVE', price: '100', receivedAt: new Date(), id: 'quote-1' }) },
      spotMarginAccount: { upsert: jest.fn().mockResolvedValue({ id: 'margin-account-1' }) },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
    };
    const ledger = {
      getAccountForUserInScope: jest.fn().mockResolvedValue({ id: 'margin-usdt', asset: 'USDT' }),
      reserve: jest.fn().mockResolvedValue({ postingId: 'reserve-1' }),
      credit: jest.fn().mockResolvedValue({ postingId: 'borrow-1' }),
    };
    const spot = {
      placeOrderInTransaction: jest.fn().mockResolvedValue({ id: 'entry-order-1', status: 'OPEN' }),
      matchOrdersInTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const service = new MarginService(prisma as any, ledger as any, spot as any);

    await expect(service.openPosition('user-1', { pair: 'BTC/USDT', direction: MarginPositionDirection.SHORT, leverage: 5, collateral: '25', idempotencyKey: 'margin-open-1' })).resolves.toMatchObject({ status: SpotMarginPositionStatus.PENDING, state: 'PENDING_SPOT_EXECUTION' });
    expect(ledger.credit).toHaveBeenCalledWith(expect.objectContaining({ asset: 'BTC', amount: '1.25' }), tx);
    expect(tx.spotMarginPosition.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ leverage: 5, collateral: expect.anything(), status: SpotMarginPositionStatus.PENDING }) }));
  });

  it('activates a pending entry only after the owned Spot order is filled', async () => {
    const pending = {
      id: 'position-1',
      status: SpotMarginPositionStatus.PENDING,
      direction: MarginPositionDirection.LONG,
      collateral: new Prisma.Decimal('100'),
      leverage: 2,
      account: { userId: 'user-1', pair: 'BTCUSDT', quoteAsset: 'USDT', baseAsset: 'BTC' },
    };
    const order = { id: 'entry-order-1', userId: 'user-1', pair: 'BTCUSDT', status: 'FILLED', filled: new Prisma.Decimal('0.003'), price: new Prisma.Decimal('65000') };
    const tx = {
      spotMarginPosition: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'position-1', status: SpotMarginPositionStatus.OPEN }),
      },
      spotMarginPositionEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
    };
    const prisma = {
      spotMarginPosition: { findUnique: jest.fn().mockResolvedValue(pending) },
      gate2SpotOrder: { findUnique: jest.fn().mockResolvedValue(order) },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
    };
    const service = new MarginService(prisma as any, {} as any);

    await expect(service.activateFromSpotFill('position-1', 'entry-order-1')).resolves.toMatchObject({ status: SpotMarginPositionStatus.OPEN });
    expect(tx.spotMarginPosition.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: SpotMarginPositionStatus.OPEN, quantity: order.filled, entryPrice: order.price }) }));
    expect(tx.spotMarginPositionEvent.create).toHaveBeenCalled();
  });

  it('accrues interest idempotently through the margin activity and event records', async () => {
    const position = {
      id: 'position-1',
      status: SpotMarginPositionStatus.OPEN,
      debtPrincipal: new Prisma.Decimal('100'),
      accountId: 'margin-account-1',
      account: { userId: 'user-1' },
    };
    const tx = {
      spotMarginActivity: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'activity-1' }) },
      spotMarginPosition: { update: jest.fn().mockResolvedValue({ id: 'position-1' }) },
      spotMarginPositionEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
    };
    const prisma = {
      spotMarginPosition: { findUnique: jest.fn().mockResolvedValue(position) },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
    };
    const service = new MarginService(prisma as any, {} as any);

    await expect(service.accrueInterest('position-1', '0.1', 31536000, 'margin-interest-1')).resolves.toMatchObject({ interest: '10', replayed: false });
    expect(tx.spotMarginPosition.update).toHaveBeenCalledWith(expect.objectContaining({ data: { interestAccrued: { increment: expect.anything() } } }));
    expect(tx.spotMarginActivity.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }));
  });

  it('liquidates an unsafe position and records authoritative collateral release', async () => {
    const position = {
      id: 'position-liquidation-1',
      accountId: 'margin-account-1',
      status: SpotMarginPositionStatus.OPEN,
      direction: MarginPositionDirection.LONG,
      collateral: new Prisma.Decimal('50'),
      quantity: new Prisma.Decimal('0.001'),
      entryPrice: new Prisma.Decimal('65000'),
      debtPrincipal: new Prisma.Decimal('50'),
      debtAsset: 'USDT',
      interestAccrued: new Prisma.Decimal('0'),
      unrealizedPnl: new Prisma.Decimal('-30'),
      account: { userId: 'user-1', pair: 'BTCUSDT', quoteAsset: 'USDT', baseAsset: 'BTC' },
    };
    const tx = {
      spotMarginActivity: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'liquidation-activity-1' }),
      },
      spotMarginPosition: {
        update: jest.fn()
          .mockResolvedValueOnce({ ...position, status: SpotMarginPositionStatus.CLOSING })
          .mockResolvedValueOnce({ ...position, status: SpotMarginPositionStatus.LIQUIDATED, id: position.id }),
      },
      gate2SpotOrder: {
        findUnique: jest.fn().mockResolvedValue({ id: 'liquidation-order-1', status: 'FILLED', price: new Prisma.Decimal('35000') }),
      },
      spotMarginPositionEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
    };
    const prisma = {
      spotMarginPosition: { findFirst: jest.fn().mockResolvedValue(position) },
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) },
      marketQuoteLatest: { findUnique: jest.fn().mockResolvedValue({ state: 'LIVE', price: new Prisma.Decimal('35000'), receivedAt: new Date() }) },
      systemConfig: { findUnique: jest.fn().mockResolvedValue({ value: '0.5' }) },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
    };
    const ledger = {
      getAccountForUserInScope: jest.fn().mockResolvedValue({ id: 'margin-usdt', asset: 'USDT' }),
      debit: jest.fn().mockResolvedValue({ postingId: 'repayment-1' }),
    };
    const spot = {
      placeOrderInTransaction: jest.fn().mockResolvedValue({ id: 'liquidation-order-1' }),
      matchOrdersInTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const service = new MarginService(prisma as any, ledger as any, spot as any);

    await expect(service.liquidatePosition('user-1', position.id, 'margin-liquidation-1')).resolves.toMatchObject({
      state: 'LIQUIDATED',
      liquidationOrderId: 'liquidation-order-1',
    });
    expect(ledger.debit).toHaveBeenCalledWith(expect.objectContaining({ referenceType: 'SPOT_MARGIN_LIQUIDATION_REPAYMENT', amount: '50' }), tx);
    expect(tx.spotMarginPositionEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: 'COLLATERAL_RELEASE',
        asset: 'USDT',
        amount: position.collateral,
        metadata: expect.objectContaining({ releaseAuthority: 'MARGIN_LIQUIDATION' }),
      }),
    }));
    expect(tx.spotMarginPositionEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'LIQUIDATION', metadata: expect.objectContaining({ maintenanceRatio: '0.5' }) }),
    }));
  });

  it('uses D1-backed Admin margin configuration for leverage and maintenance ratio', async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      getSystemConfigValue: jest.fn().mockImplementation(async (key: string) =>
        key === 'gate2.margin.leverages' ? '2,4,8' : key === 'gate2.margin.maintenanceRatio' ? '0.35' : null,
      ),
    };
    const service = new MarginService({} as any, {} as any, undefined, d1 as any);

    await expect((service as any).resolveAllowedLeverages()).resolves.toEqual([2, 4, 8]);
    await expect((service as any).resolveMaintenanceRatio()).resolves.toEqual(new Prisma.Decimal('0.35'));
    await expect((service as any).assertConfiguredLeverage(4)).resolves.toBeUndefined();
    await expect((service as any).assertConfiguredLeverage(5)).rejects.toThrow('Margin leverage is not supported');
  });

});
