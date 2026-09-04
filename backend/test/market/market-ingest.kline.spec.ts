import { MarketIngestService } from '../../src/market/market-ingest.service';

describe('MarketIngestService Kline publication', () => {
  it('persists provider Kline updates before publishing the normalized realtime event', async () => {
    const candle = {
      symbol: 'BTCUSDT', interval: '1m', time: 1_000, closeTime: '1970-01-01T00:01:00.999Z',
      open: '10', high: '12', low: '9', close: '11', volume: '3', provider: 'fixture',
      source: 'websocket:kline', observedAt: '1970-01-01T00:01:01.000Z', receivedAt: '1970-01-01T00:01:01.001Z',
    };
    const redis = { isAvailable: jest.fn().mockReturnValue(true), publish: jest.fn().mockResolvedValue(undefined) };
    const marketKlines = { persist: jest.fn().mockResolvedValue(candle), accumulateQuote: jest.fn() };
    const service = new MarketIngestService(
      { ingestQuote: jest.fn() } as never,
      marketKlines as never,
      { start: jest.fn(), stop: jest.fn() } as never,
      redis as never,
      { persistDepth: jest.fn(), persistTrade: jest.fn() } as never,
    );

    await (service as any).handleProviderEvent({
      kind: 'kline', symbol: 'BTCUSDT', provider: 'fixture', source: 'websocket:kline', providerInstrument: 'BTCUSDT',
      eventTime: 61_000, openTime: 1_000, closeTime: 60_999, interval: '1m',
      open: '10', high: '12', low: '9', close: '11', volume: '3', closed: false,
    });

    expect(marketKlines.persist).toHaveBeenCalledTimes(1);
    expect(redis.publish).toHaveBeenCalledWith('market:klines:v1', expect.stringContaining('"event":"market_kline"'));
    expect(redis.publish.mock.invocationCallOrder[0]).toBeGreaterThan(marketKlines.persist.mock.invocationCallOrder[0]);
  });
});
