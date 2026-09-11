import { MarketReferencePersistenceService } from '../../src/market/market-reference-persistence.service';

describe('MarketReferencePersistenceService', () => {
  const trade = {
    kind: 'trade' as const,
    symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket', providerInstrument: 'BTCUSDT',
    eventTime: 1_700_000_000_000, tradeId: 42, price: '100', quantity: '0.5', maker: false,
  };
  const depth = {
    kind: 'depth' as const,
    symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket', providerInstrument: 'BTCUSDT',
    eventTime: 1_700_000_000_000, updateId: 7, bids: [['99', '1']] as Array<[string, string]>, asks: [['101', '2']] as Array<[string, string]>,
  };

  it('accepts trades only after required archive delivery succeeds', async () => {
    const archive = { archive: jest.fn().mockResolvedValue(true), isRequired: () => true, isConfigured: () => true };
    const service = new MarketReferencePersistenceService({} as never, archive as never);
    await expect(service.persistTrade(trade)).resolves.toEqual({ accepted: true, reason: 'ARCHIVED' });
    expect(archive.archive).toHaveBeenCalledWith(trade);
  });

  it('accepts depth only through the archive boundary', async () => {
    const archive = { archive: jest.fn().mockResolvedValue(true), isRequired: () => true, isConfigured: () => true };
    const service = new MarketReferencePersistenceService({} as never, archive as never);
    await expect(service.persistDepth(depth)).resolves.toEqual({ accepted: true, reason: 'ARCHIVED' });
    expect(archive.archive).toHaveBeenCalledWith(depth);
  });

  it('fails closed when archive delivery is unavailable', async () => {
    const archive = { archive: jest.fn().mockResolvedValue(false), isRequired: () => true, isConfigured: () => false };
    const service = new MarketReferencePersistenceService({} as never, archive as never);
    await expect(service.persistTrade(trade)).resolves.toEqual({ accepted: false, reason: 'ARCHIVE_UNAVAILABLE' });
  });

  it('keeps retention fail-closed until an archive checkpoint is confirmed', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const archive = { archive: jest.fn(), isRequired: () => true, isConfigured: () => true };
    const previous = { ...process.env };
    process.env.MARKET_ARCHIVE_RETENTION_ENABLED = 'true';
    process.env.MARKET_ARCHIVE_CHECKPOINT_CONFIRMED = 'false';
    delete process.env.MARKET_ARCHIVE_CHECKPOINT_ID;
    const d1 = { marketTrade: { deleteMany }, marketDepthSnapshot: { deleteMany }, marketQuoteSnapshot: { deleteMany } };
    const service = new MarketReferencePersistenceService(d1 as never, archive as never);

    await service.enforceBoundedRetention();
    expect(deleteMany).not.toHaveBeenCalled();
    process.env.MARKET_ARCHIVE_CHECKPOINT_CONFIRMED = 'true';
    process.env.MARKET_ARCHIVE_CHECKPOINT_ID = 'r2-snapshot-test';
    await service.enforceBoundedRetention();
    expect(deleteMany).toHaveBeenCalledTimes(3);
    process.env = previous;
  });
});
