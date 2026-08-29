import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const miningContractVersion: ContractVersion = 'v1';
export const miningAuthorityOwner = 'backend/mining';
export interface MiningPlanDto { planId: string; name: string; asset: string; durationSeconds: number; state: DataState; }
export interface MiningSubscriptionDto { subscriptionId: string; userId: string; planId: string; state: DataState; startedAt: string; endsAt: string | null; rewardTotal: number | null; }
export interface MiningEventPayload { plan?: MiningPlanDto; subscription?: MiningSubscriptionDto; auditReference?: string; }
export type MiningEvent = ContractEvent<MiningEventPayload>;
