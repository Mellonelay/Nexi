import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const binaryContractVersion: ContractVersion = 'v1';
export const binaryAuthorityOwner = 'backend/binary';
export type BinaryState = 'LOADING' | 'WAITING_FOR_MARKET' | 'DISCONNECTED' | 'EXPIRED' | 'SETTLEMENT_PENDING' | 'COMPLETED';
export interface BinaryQuoteDto { pair: string; market: string; source: string; referenceValue: number | null; state: BinaryState; observedAt: string | null; }
export interface BinaryPositionRequestDto { accountId: string; pair: string; direction: 'UP' | 'DOWN'; amount: number; expiryAt: string; idempotencyKey: string; }
export interface BinaryPositionDto { positionId: string; pair: string; direction: 'UP' | 'DOWN'; amount: number; state: BinaryState; openedAt: string; expiresAt: string; }
export interface BinaryEventPayload { quote?: BinaryQuoteDto; position?: BinaryPositionDto; dataState: DataState; }
export type BinaryEvent = ContractEvent<BinaryEventPayload>;
