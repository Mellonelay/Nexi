jest.mock('../../src/d1/d1-prisma.service', () => ({ D1PrismaService: class D1PrismaService {} }));

import { Prisma } from '@prisma/client';
import { MarketReferencePersistenceService } from '../../src/market/market-reference-persistence.service';

describe('MarketReferencePersistenceService', () => {
  const disabledD1 = () => ({ isEnabled: jest.fn().mockReturnValue(false) });
  const pair = { id: 'pair-1', symbol: 'BTCUSDT' };
  const trade = {
    kind: 'trade' as const,
    symbol: 'BTC/USDT', provider: 'binance-spot', source: 'websocket', providerInstrument: 'BTCUSDT',
    eventTime: 1_700_000_000_000, tradeId: 42, price: '100', quantity: '0.5', maker: false,
  };
  const depth = {
    kind: 'depth' as const,
    symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket', providerInstrument: 'BTCUSDT',
    eventTime: 1_700_000_000_000, updateId: 7, bids: [['99', '1']] as Array<[string, string]>, asks: [['101', '2']] as Array<[string, string]>,
  };

  it('persists a normalized trade and maps maker=false to BUY', async () => {
    const create = jest.fn().mockResolvedValue({});
    const service = new MarketReferencePersistenceService({
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) }, marketTrade: { create },
    } as never, disabledD1() as never);

    await expect(service.persistTrade(trade)).resolves.toEqual({ accepted: true, reason: 'PERSISTED' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ pairId: 'pair-1', side: 'BUY', sequence: 42n }) }));
  });

  it('does not grow relational trade storage when required archive delivery succeeds', async () => {
    const create = jest.fn();
    const service = new MarketReferencePersistenceService({
      marketPair: { findUnique: jest.fn() }, marketTrade: { create },
    } as never, disabledD1() as never, { archive: jest.fn().mockResolvedValue(true), isRequired: () => true } as never);

    await expect(service.persistTrade(trade)).resolves.toEqual({ accepted: true, reason: 'ARCHIVED' });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate provider trade id idempotently', async () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '7.3.0' });
    const service = new MarketReferencePersistenceService({
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) }, marketTrade: { create: jest.fn().mockRejectedValue(duplicate) },
    } as never, disabledD1() as never);

    await expect(service.persistTrade(trade)).resolves.toEqual({ accepted: false, reason: 'DUPLICATE' });
  });

  it('persists depth snapshots and both bid/ask levels in one transaction', async () => {
    const create = jest.fn().mockResolvedValue({});
    const transaction = jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({ marketDepthSnapshot: { create } }));
    const service = new MarketReferencePersistenceService({
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) }, $transaction: transaction,
    } as never, disabledD1() as never);

    await expect(service.persistDepth(depth)).resolves.toEqual({ accepted: true, reason: 'PERSISTED' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ pairId: 'pair-1', sequence: 7n, levels: expect.objectContaining({ create: expect.arrayContaining([expect.objectContaining({ side: 'BID' }), expect.objectContaining({ side: 'ASK' })]) }) }) }));
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('does not fabricate a pair for an unknown provider symbol', async () => {
    const create = jest.fn();
    const service = new MarketReferencePersistenceService({
      marketPair: { findUnique: jest.fn().mockResolvedValue(null) }, marketTrade: { create },
    } as never, disabledD1() as never);

    await expect(service.persistTrade(trade)).resolves.toEqual({ accepted: false, reason: 'PAIR_UNAVAILABLE' });
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps retention fail-closed until an archive checkpoint is confirmed', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const previous = { ...process.env };
    process.env.MARKET_ARCHIVE_REQUIRED = 'true';
    process.env.MARKET_ARCHIVE_RETENTION_ENABLED = 'true';
    process.env.MARKET_ARCHIVE_CHECKPOINT_CONFIRMED = 'false';
    delete process.env.MARKET_ARCHIVE_CHECKPOINT_ID;
    const service = new MarketReferencePersistenceService({
      marketTrade: { deleteMany }, marketDepthSnapshot: { deleteMany }, marketQuoteSnapshot: { deleteMany },
    } as never, disabledD1() as never, { isRequired: () => true, isConfigured: () => true } as never);

    await service.enforceBoundedRetention();
    expect(deleteMany).not.toHaveBeenCalled();

    process.env.MARKET_ARCHIVE_CHECKPOINT_CONFIRMED = 'true';
    process.env.MARKET_ARCHIVE_CHECKPOINT_ID = 'r2-snapshot-test';
    await service.enforceBoundedRetention();
    expect(deleteMany).toHaveBeenCalledTimes(3);
    process.env = previous;
  });
});
