import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const marketContractVersion: ContractVersion = 'v1';
export const marketAuthorityOwner = 'backend/market';
export type MarketStatus = 'LIVE' | 'STALE' | 'OFFLINE' | 'MAINTENANCE';
export interface MarketQuoteDto { assetId: string; category: 'FAVORITES' | 'CRYPTO' | 'METAL' | 'FOREX' | 'SHARES'; symbol: string; displayName?: string; pair: string; price: string | null; change24h: string | null; volume24h: string | null; status: MarketStatus; dataState: DataState; updatedAt: string | null; }
export interface MarketQuoteEventPayload { quote: MarketQuoteDto; source: string; observedAt: string; }
export type MarketQuoteEvent = ContractEvent<MarketQuoteEventPayload>;
