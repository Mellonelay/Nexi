import { Prisma } from '@prisma/client';

export const MARKET_KLINE_INTERVALS = [
  '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M',
] as const;

export type MarketKlineInterval = (typeof MARKET_KLINE_INTERVALS)[number];

export interface MarketKlineInput {
  symbol: string;
  interval: MarketKlineInterval;
  openTime: Date;
  closeTime?: Date;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume?: string | number | null;
  provider: string;
  source: string;
  observedAt: Date;
}

export interface NormalizedMarketKline extends Omit<MarketKlineInput, 'open' | 'high' | 'low' | 'close' | 'volume'> {
  open: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  close: Prisma.Decimal;
  volume: Prisma.Decimal | null;
}

export function normalizeMarketKline(input: MarketKlineInput): NormalizedMarketKline {
  const symbol = input.symbol.trim().toUpperCase().replaceAll('/', '');
  if (!/^[A-Z0-9]{4,24}$/.test(symbol)) throw new Error('Market kline symbol is invalid');
  if (!MARKET_KLINE_INTERVALS.includes(input.interval)) throw new Error('Market kline interval is invalid');
  if (!input.openTime || Number.isNaN(input.openTime.getTime())) throw new Error('Market kline openTime is invalid');
  if (!input.observedAt || Number.isNaN(input.observedAt.getTime())) throw new Error('Market kline observedAt is invalid');
  const open = decimal(input.open, 'open');
  const high = decimal(input.high, 'high');
  const low = decimal(input.low, 'low');
  const close = decimal(input.close, 'close');
  if (high.lt(open) || high.lt(close)) throw new Error('Market kline high must cover open and close');
  if (low.gt(open) || low.gt(close)) throw new Error('Market kline low must be below open and close');
  const volume = input.volume === undefined || input.volume === null ? null : decimal(input.volume, 'volume', true);
  return { ...input, symbol, open, high, low, close, volume };
}

function decimal(value: string | number, field: string, allowZero = false): Prisma.Decimal {
  let result: Prisma.Decimal;
  try { result = new Prisma.Decimal(value); } catch { throw new Error(`Market kline ${field} is not a valid decimal`); }
  if (!result.isFinite() || result.isNegative() || (!allowZero && result.isZero())) {
    throw new Error(`Market kline ${field} must be ${allowZero ? 'non-negative' : 'positive'}`);
  }
  return result;
}
