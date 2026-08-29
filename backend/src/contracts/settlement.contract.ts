import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const settlementContractVersion: ContractVersion = 'v1';
export const settlementAuthorityOwner = 'backend/settlement';
export type SettlementState = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
export interface SettlementRequestDto { positionId: string; authorityReference: string; idempotencyKey: string; }
export interface SettlementReceiptDto { settlementId: string; positionId: string; state: SettlementState; ledgerEntryId: string | null; settledAt: string | null; auditReference: string; }
export interface SettlementEventPayload { receipt: SettlementReceiptDto; request?: SettlementRequestDto; dataState: DataState; }
export type SettlementEvent = ContractEvent<SettlementEventPayload>;
