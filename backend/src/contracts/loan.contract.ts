import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const loanContractVersion: ContractVersion = 'v1';
export const loanAuthorityOwner = 'backend/loan';
export interface LoanPlanDto { planId: string; asset: string; collateralAsset: string; collateralRatio: number | null; state: DataState; }
export interface LoanApplicationRequestDto { userId: string; planId: string; principal: number; collateralAmount: number; idempotencyKey: string; }
export interface LoanApplicationDto { loanId: string; planId: string; principal: number | null; collateralAmount: number | null; riskRatio: number | null; state: 'PENDING' | 'ACTIVE' | 'REPAID' | 'REJECTED' | 'DEFAULTED'; }
export interface LoanEventPayload { plan?: LoanPlanDto; application?: LoanApplicationDto; auditReference?: string; }
export type LoanEvent = ContractEvent<LoanEventPayload>;
