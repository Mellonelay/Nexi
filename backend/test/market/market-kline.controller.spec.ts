import { MarketKlineController } from '../../src/market/market-kline.controller';
import { MarketKlineQueryService } from '../../src/market/market-kline-query.service';

describe('MarketKlineController', () => {
  it('hydrates a missing chart window through the provider router and persists it', async () => {
    const candle = {
      symbol: 'AXPUSDT', interval: '1h', openTime: new Date('2026-08-31T00:00:00.000Z'),
      closeTime: new Date('2026-08-31T00:59:59.999Z'), open: '100', high: '110', low: '95', close: '105',
      volume: '42', provider: 'gate', source: 'gate:rest:stock-candlesticks', observedAt: new Date(), receivedAt: new Date(),
    };
    const klines = {
      list: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([candle]),
      persist: jest.fn().mockResolvedValue(candle),
    };
    const providers = { fetchHistory: jest.fn().mockResolvedValue([candle]) };
    const queryService = new MarketKlineQueryService(klines as never, providers as never);
    const controller = new MarketKlineController(queryService);

    await expect(controller.list({ symbol: 'AXP/USDT', interval: '1h', limit: 40 } as never)).resolves.toMatchObject({
      dataState: 'LIVE', symbol: 'AXPUSDT', interval: '1h', candles: [candle],
    });
    expect(providers.fetchHistory).toHaveBeenCalledWith('AXPUSDT', '1h', 40);
    expect(klines.persist).toHaveBeenCalledWith(candle);
    expect(klines.list).toHaveBeenCalledTimes(2);
  });
});
