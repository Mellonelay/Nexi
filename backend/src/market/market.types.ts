export interface MarketTick {
  symbol: string;
  price: number;
  change: number; // 24h change percentage
  vol: number;    // 24h volume
  timestamp: number;
}

export const MARKET_TICKS_CHANNEL = 'market:ticks';
export const MARKET_QUOTES_CHANNEL = 'market:quotes:v1';
export const MARKET_REFERENCE_CHANNEL = 'market:reference:v1';

export type MarketReferenceDepthEvent = {
  version: 'v1';
  event: 'market.reference.depth';
  kind: 'depth';
  symbol: string;
  provider: string;
  source: string;
  providerInstrument: string;
  eventTime: number;
  updateId: number;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
};

export type MarketReferenceTradeEvent = {
  version: 'v1';
  event: 'market.reference.trade';
  kind: 'trade';
  symbol: string;
  provider: string;
  source: string;
  providerInstrument: string;
  eventTime: number;
  tradeId: number;
  price: string;
  quantity: string;
  maker: boolean;
};

export type MarketReferenceEvent = MarketReferenceDepthEvent | MarketReferenceTradeEvent;
