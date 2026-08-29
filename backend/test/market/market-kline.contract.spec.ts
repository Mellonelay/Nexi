import { normalizeMarketKline } from '../../src/market/market-kline.contract';

const base = {
  symbol: 'BTC/USDT',
  interval: '1m' as const,
  openTime: new Date('2026-08-06T00:00:00.000Z'),
  open: '100',
  high: '110',
  low: '90',
  close: '105',
  volume: '12.5',
  provider: 'fixture',
  source: 'deterministic-test',
  observedAt: new Date('2026-08-06T00:01:00.000Z'),
};

describe('market kline contract', () => {
  it('normalizes symbols and preserves decimal OHLCV values', () => {
    const result = normalizeMarketKline(base);
    expect(result.symbol).toBe('BTCUSDT');
    expect(result.open.toString()).toBe('100');
    expect(result.volume?.toString()).toBe('12.5');
  });

  it('rejects candles whose high or low violates OHLC invariants', () => {
    expect(() => normalizeMarketKline({ ...base, high: '104' })).toThrow('high');
    expect(() => normalizeMarketKline({ ...base, low: '101' })).toThrow('low');
  });
});
