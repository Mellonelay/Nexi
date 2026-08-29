import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const spotContractVersion: ContractVersion = 'v1';
export const spotAuthorityOwner = 'backend/spot';
export type SpotSide = 'BUY' | 'SELL';
export type SpotOrderType = 'MARKET' | 'LIMIT';
export interface SpotOrderRequestDto { accountId: string; pair: string; side: SpotSide; type: SpotOrderType; amount: number; limitPrice?: number; idempotencyKey: string; }
export interface SpotOrderDto { orderId: string; pair: string; side: SpotSide; type: SpotOrderType; amount: number; filledAmount: number | null; state: DataState; createdAt: string; }
// Monetary values remain decimal strings across the HTTP and Socket.IO
// boundary so browser rendering never changes matching or ledger precision.
export interface OrderBookEntryDto { orderId: string; price: string | null; amount: string; }
export interface OrderBookDto { pair: string; bids: OrderBookEntryDto[]; asks: OrderBookEntryDto[]; spread?: string | null; state?: DataState; }
export interface SpotEventPayload { order?: SpotOrderDto; orderBook?: OrderBookDto; source?: string; }
export type SpotEvent = ContractEvent<SpotEventPayload>;
