import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const ledgerContractVersion: ContractVersion = 'v1';
export const ledgerAuthorityOwner = 'backend/ledger';
export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'SETTLEMENT' | 'FEE';
export interface LedgerEntryDto { entryId: string; accountId: string; asset: string; type: LedgerEntryType; amount: string; availableDelta: string; lockedDelta: string; referenceType: string; referenceId: string; createdAt: string; state: DataState; }
export interface LedgerMutationDto { accountId: string; asset: string; amount: string; type: LedgerEntryType; referenceType: string; referenceId: string; idempotencyKey: string; }
export interface LedgerEventPayload { entry: LedgerEntryDto; mutation?: LedgerMutationDto; }
export type LedgerEvent = ContractEvent<LedgerEventPayload>;
