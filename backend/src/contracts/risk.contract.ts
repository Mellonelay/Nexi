import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const riskContractVersion: ContractVersion = 'v1';
export const riskAuthorityOwner = 'backend/risk';
export interface RiskAssessmentDto { assessmentId: string; subjectType: 'USER' | 'POSITION' | 'LOAN' | 'ASSET'; subjectId: string; ratio: number | null; factors: string[]; state: DataState; assessedAt: string; }
export interface RiskDecisionDto { decisionId: string; assessmentId: string; decision: 'ALLOW' | 'REVIEW' | 'REJECT'; reason: string; auditReference: string; }
export interface RiskEventPayload { assessment: RiskAssessmentDto; decision?: RiskDecisionDto; }
export type RiskEvent = ContractEvent<RiskEventPayload>;
