import { LedgerAccountScope, OrderSide, Prisma, SpotMarginPositionStatus } from '../../src/prisma/d1-client';
import { MarginService } from '../../src/spot/margin.service';
import { MarginPositionDirection, MarginTransferDirection } from '../../src/spot/margin.dto';

describe('Spot isolated margin authority', () => {
  const pair = { id: 'pair-1', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' };

  it('rejects non-USDT assets on the user-facing Margin Wallet transfer route', async () => {
    const d1: any = { getActiveMarketPair: jest.fn().mockResolvedValue(pair) };
    await expect(new MarginService(d1).transfer('user-1', {
      pair: 'BTC/USDT',
      direction: MarginTransferDirection.TO_MARGIN,
      asset: 'BTC',
      amount: '1',
      idempotencyKey: 'margin-btc-transfer-1',
    })).rejects.toThrow('Margin Wallet transfers support USDT only');
    expect(d1.getActiveMarketPair).not.toHaveBeenCalled();
  });

  it('transfers USDT in both directions with scoped same-user Activity metadata', async () => {
    const d1: any = {
      getActiveMarketPair: jest.fn().mockResolvedValue(pair),
      ensureMarginAccount: jest.fn().mockResolvedValue({ id: 'margin-account-1' }),
      getAccountForUser: jest.fn()
        .mockResolvedValueOnce({ id: 'main-usdt' })
        .mockResolvedValueOnce({ id: 'margin-usdt' })
        .mockResolvedValueOnce({ id: 'main-usdt' })
        .mockResolvedValueOnce({ id: 'margin-usdt' }),
      pairedTransfer: jest.fn()
        .mockResolvedValueOnce({ debitPostingId: 'debit-in', creditPostingId: 'credit-in' })
        .mockResolvedValueOnce({ debitPostingId: 'debit-out', creditPostingId: 'credit-out' }),
    };
    const service = new MarginService(d1);
    await expect(service.transfer('user-1', { pair: 'btc/usdt', direction: MarginTransferDirection.TO_MARGIN, asset: 'USDT', amount: '100', idempotencyKey: 'margin-transfer-in' }))
      .resolves.toMatchObject({ accountId: 'margin-account-1', debitPostingId: 'debit-in' });
    await expect(service.transfer('user-1', { pair: 'btc/usdt', direction: MarginTransferDirection.FROM_MARGIN, asset: 'USDT', amount: '25', idempotencyKey: 'margin-transfer-out' }))
      .resolves.toMatchObject({ accountId: 'margin-account-1', debitPostingId: 'debit-out' });

    expect(d1.pairedTransfer).toHaveBeenNthCalledWith(1, expect.objectContaining({
      debitAccountId: 'main-usdt',
      creditAccountId: 'margin-usdt',
      amount: '100',
      referenceType: 'SPOT_MARGIN_TRANSFER',
      sameUserTransfer: { userId: 'user-1', fromScope: LedgerAccountScope.MAIN, toScope: LedgerAccountScope.MARGIN },
    }));
    expect(d1.pairedTransfer).toHaveBeenNthCalledWith(2, expect.objectContaining({
      debitAccountId: 'margin-usdt',
      creditAccountId: 'main-usdt',
      amount: '25',
      referenceType: 'SPOT_MARGIN_TRANSFER',
      sameUserTransfer: { userId: 'user-1', fromScope: LedgerAccountScope.MARGIN, toScope: LedgerAccountScope.MAIN },
    }));
  });

  it('creates a pending position after borrowing, reserving, and matching through D1', async () => {
    const d1: any = {
      getActiveMarketPair: jest.fn().mockResolvedValue(pair),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ id: 'quote-1', price: '100', state: 'LIVE', provider: 'deterministic-test', source: 'fixture', observedAt: new Date().toISOString(), receivedAt: new Date().toISOString() }),
      getSystemConfigValue: jest.fn().mockResolvedValue(null),
      ensureMarginAccount: jest.fn().mockResolvedValue({ id: 'margin-account-1' }),
      getAccountForUser: jest.fn().mockResolvedValue({ id: 'margin-usdt' }),
      reserveSpotOrder: jest.fn().mockResolvedValue({ id: 'entry-order-1' }),
      matchSpotOrder: jest.fn().mockResolvedValue(false),
      getSpotOrder: jest.fn().mockResolvedValue({ id: 'entry-order-1', status: 'OPEN', filled: '0', price: '100' }),
      createMarginPosition: jest.fn().mockResolvedValue({ id: 'position-1', status: SpotMarginPositionStatus.PENDING }),
    };
    await expect(new MarginService(d1).openPosition('user-1', { pair: 'BTC/USDT', direction: MarginPositionDirection.SHORT, leverage: 5, collateral: '25', idempotencyKey: 'margin-open-1' })).resolves.toMatchObject({ status: SpotMarginPositionStatus.PENDING });
    expect(d1.reserveSpotOrder).toHaveBeenCalledWith(expect.objectContaining({
      reserveScope: LedgerAccountScope.MARGIN,
      side: OrderSide.SELL,
      reservedAmount: '1.25',
      borrow: expect.objectContaining({ asset: 'BTC', amount: '1.25', referenceType: 'SPOT_MARGIN_BORROW' }),
    }));
    expect(d1.createMarginPosition).toHaveBeenCalledWith(expect.objectContaining({ status: SpotMarginPositionStatus.PENDING, entryOrderId: 'entry-order-1' }));
  });

  it('does not commit a borrow before the atomic entry reservation', async () => {
    const d1: any = {
      getActiveMarketPair: jest.fn().mockResolvedValue(pair),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ price: '100' }),
      getSystemConfigValue: jest.fn().mockResolvedValue(null),
      ensureMarginAccount: jest.fn().mockResolvedValue({ id: 'margin-account-1' }),
      getAccountForUser: jest.fn().mockResolvedValue({ id: 'margin-btc' }),
      credit: jest.fn(),
      reserveSpotOrder: jest.fn().mockRejectedValue(new Error('reservation rejected')),
    };

    await expect(new MarginService(d1).openPosition('user-1', {
      pair: 'BTC/USDT', direction: MarginPositionDirection.SHORT, leverage: 5, collateral: '25', idempotencyKey: 'margin-open-orphan',
    })).rejects.toThrow('reservation rejected');
    expect(d1.credit).not.toHaveBeenCalled();
    expect(d1.reserveSpotOrder).toHaveBeenCalledWith(expect.objectContaining({
      borrow: expect.objectContaining({ referenceType: 'SPOT_MARGIN_BORROW' }),
    }));
  });

  it('routes orphan-borrow repayment through the owned D1 financial authority', async () => {
    const d1: any = { repayUnmatchedMarginBorrow: jest.fn().mockResolvedValue({ postingId: 'repay-1', replayed: false }) };
    await expect(new MarginService(d1).repayUnmatchedBorrow('user-1', 'margin-open-1'))
      .resolves.toMatchObject({ postingId: 'repay-1' });
    expect(d1.repayUnmatchedMarginBorrow).toHaveBeenCalledWith('user-1', 'margin-open-1');
  });

  it('accrues interest through the D1 margin command', async () => {
    const d1: any = {
      getMarginPosition: jest.fn().mockResolvedValue({ id: 'position-1', status: SpotMarginPositionStatus.OPEN, debtPrincipal: '100', accountUserId: 'user-1' }),
      accrueMarginInterest: jest.fn().mockResolvedValue({ interest: '10', replayed: false }),
    };
    await expect(new MarginService(d1).accrueInterest('position-1', '0.1', 31536000, 'margin-interest-1')).resolves.toEqual({ interest: '10', replayed: false });
    expect(d1.accrueMarginInterest).toHaveBeenCalledWith('position-1', 'user-1', '10', '0.1', 31536000, 'margin-interest-1');
  });

  it('liquidates an unsafe position through D1 close and settlement commands', async () => {
    const position = { id: 'position-1', userId: 'user-1', accountId: 'margin-account-1', accountPair: 'BTCUSDT', status: SpotMarginPositionStatus.OPEN, direction: MarginPositionDirection.LONG, collateral: '50', quantity: '0.001', entryPrice: '65000', debtPrincipal: '50', debtAsset: 'USDT', interestAccrued: '0', unrealizedPnl: '-30' };
    const d1: any = {
      getMarginPosition: jest.fn().mockResolvedValue(position),
      getActiveMarketPair: jest.fn().mockResolvedValue(pair),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ id: 'quote-1', price: '35000', state: 'LIVE', provider: 'deterministic-test', source: 'fixture', observedAt: new Date().toISOString(), receivedAt: new Date().toISOString() }),
      getSystemConfigValue: jest.fn().mockResolvedValue('0.5'),
      reserveSpotOrder: jest.fn().mockResolvedValue({ id: 'liquidation-order-1' }),
      markMarginClosing: jest.fn().mockResolvedValue(undefined),
      matchSpotOrder: jest.fn().mockResolvedValue(false),
      getSpotOrder: jest.fn().mockResolvedValue({ id: 'liquidation-order-1', status: 'FILLED', price: '35000' }),
      getSpotOrderExecutionPrice: jest.fn().mockResolvedValue('35000'),
      settleMarginClose: jest.fn().mockResolvedValue({ state: 'LIQUIDATED', liquidationOrderId: 'liquidation-order-1' }),
    };
    await expect(new MarginService(d1).liquidatePosition('user-1', position.id, 'margin-liquidation-1')).resolves.toMatchObject({ state: 'LIQUIDATED' });
    expect(d1.markMarginClosing).toHaveBeenCalledWith('position-1', 'user-1', 'margin-account-1', expect.any(String), 'liquidation-order-1', 'margin-liquidation-1', true);
    expect(d1.settleMarginClose).toHaveBeenCalledWith(expect.objectContaining({ state: 'LIQUIDATED', debtAsset: 'USDT', maintenanceRatio: '0.5' }));
  });

  it('reuses an existing closing order without reserving another order or changing its close request', async () => {
    const position = { id: 'position-1', accountId: 'margin-account-1', accountPair: 'BTCUSDT', status: 'CLOSING', closeOrderId: 'close-order-1', direction: MarginPositionDirection.LONG, collateral: '50', quantity: '1', entryPrice: '100', debtPrincipal: '50', debtAsset: 'USDT', interestAccrued: '0', unrealizedPnl: '0' };
    const d1: any = {
      getMarginPosition: jest.fn().mockResolvedValue(position),
      getActiveMarketPair: jest.fn().mockResolvedValue(pair),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ price: '100' }),
      reserveSpotOrder: jest.fn(),
      markMarginClosing: jest.fn(),
      matchSpotOrder: jest.fn().mockResolvedValue(false),
      getSpotOrder: jest.fn().mockResolvedValue({ id: 'close-order-1', status: 'OPEN', price: '100' }),
      settleMarginClose: jest.fn(),
    };
    await expect(new MarginService(d1).closePosition('user-1', 'position-1', 'close-retry')).resolves.toMatchObject({ state: 'CLOSING', closeOrderId: 'close-order-1' });
    expect(d1.getActiveMarketPair).not.toHaveBeenCalled();
    expect(d1.reserveSpotOrder).not.toHaveBeenCalled();
    expect(d1.markMarginClosing).not.toHaveBeenCalled();
    expect(d1.matchSpotOrder).not.toHaveBeenCalled();
    expect(d1.settleMarginClose).not.toHaveBeenCalled();
  });

  it('settles a delayed filled close using executed VWAP with no new reserve or quote', async () => {
    const position = { id:'late-position',accountId:'margin-account-1',accountPair:'BTCUSDT',
      status:'CLOSING',closeOrderId:'late-close-order',direction:MarginPositionDirection.LONG,
      quantity:'3',entryPrice:'100',collateral:'50',debtPrincipal:'50',debtAsset:'USDT',
      interestAccrued:'1',unrealizedPnl:'0' };
    const d1: any = {
      getMarginPosition:jest.fn().mockResolvedValue(position),
      getActiveMarketPair:jest.fn().mockResolvedValue(pair),
      getLiveMarketQuote:jest.fn(),reserveSpotOrder:jest.fn(),markMarginClosing:jest.fn(),
      matchSpotOrder:jest.fn().mockResolvedValue(null),
      getSpotOrder:jest.fn().mockResolvedValue({id:'late-close-order',status:'FILLED'}),
      getSpotOrderExecutionPrice:jest.fn().mockResolvedValue('106.66666666666666667'),
      settleMarginClose:jest.fn().mockResolvedValue({state:'CLOSED'}),
    };
    await expect(new MarginService(d1).closePosition('owner','late-position','original-close')).resolves.toMatchObject({state:'CLOSED'});
    expect(d1.getActiveMarketPair).not.toHaveBeenCalled();
    expect(d1.reserveSpotOrder).not.toHaveBeenCalled();
    expect(d1.markMarginClosing).not.toHaveBeenCalled();
    expect(d1.getLiveMarketQuote).not.toHaveBeenCalled();
    expect(d1.settleMarginClose).toHaveBeenCalledWith(expect.objectContaining({
      closeOrderId:'late-close-order', markPrice:'106.66666666666666667',
      realizedPnl:'20.00000000000000001',repayment:'51', idempotencyKey:'original-close',
    }));
  });

  it('uses D1-backed Admin margin configuration', async () => {
    const d1: any = { getSystemConfigValue: jest.fn().mockImplementation(async (key: string) => key === 'gate2.margin.leverages' ? '2,4,8' : key === 'gate2.margin.maintenanceRatio' ? '0.35' : null) };
    const service = new MarginService(d1);
    await expect((service as any).resolveAllowedLeverages()).resolves.toEqual([2, 4, 8]);
    await expect((service as any).resolveMaintenanceRatio()).resolves.toEqual(new Prisma.Decimal('0.35'));
    await expect((service as any).assertConfiguredLeverage(5)).rejects.toThrow('Margin leverage is not supported');
  });
});
