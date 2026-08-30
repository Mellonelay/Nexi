import type { MarketKlineInput, MarketKlineInterval } from './market-kline.contract';

export type ProviderQuoteEvent = {
  kind: 'ticker';
  symbol: string;
  provider: string;
  source: string;
  providerInstrument: string;
  priceType: 'BID' | 'ASK' | 'MID' | 'LAST' | 'CANDLE_CLOSE' | 'REFERENCE';
  eventTime: number;
  price: string;
  change24h?: string;
  volume24h?: string;
  high24h?: string;
  low24h?: string;
  bid?: string;
  ask?: string;
  spread?: string;
};

export type ProviderKlineEvent = {
  kind: 'kline';
  symbol: string;
  provider: string;
  source: string;
  providerInstrument: string;
  eventTime: number;
  openTime: number;
  closeTime: number;
  interval: MarketKlineInterval;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
  closed: boolean;
};

export type ProviderDepthEvent = {
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

export type ProviderTradeEvent = {
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

export type MarketProviderEvent = ProviderQuoteEvent | ProviderKlineEvent | ProviderDepthEvent | ProviderTradeEvent;

export interface MarketProviderRuntimeSymbol {
  symbol: string;
  providerInstrument: string;
}

export interface MarketProviderAdapter {
  readonly provider: string;
  configure?(symbols: readonly MarketProviderRuntimeSymbol[]): void;
  isEnabled(): boolean;
  start(onEvent: (event: MarketProviderEvent) => void): Promise<void>;
  stop(): void;
  fetchHistory?(symbol: string, interval: MarketKlineInterval, limit: number): Promise<MarketKlineInput[]>;
}
