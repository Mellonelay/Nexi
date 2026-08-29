import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const walletContractVersion: ContractVersion = 'v1';
export const walletAuthorityOwner = 'backend/wallet';
export interface WalletAccountDto { userId: string; accountId: string; state: DataState; }
export interface WalletBalanceDto { asset: string; available: string | null; locked: string | null; pending: string | null; total: string | null; state: DataState; }
export interface WalletMutationDto { accountId: string; asset: string; amount: string; idempotencyKey: string; }
export interface WalletEventPayload { account: WalletAccountDto; balance?: WalletBalanceDto; mutation?: WalletMutationDto; reason?: string; }
export type WalletEvent = ContractEvent<WalletEventPayload>;
