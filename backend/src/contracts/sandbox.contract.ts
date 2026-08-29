import { ContractEvent, ContractVersion, DataState } from './common.contract';
export const sandboxContractVersion: ContractVersion = 'v1';
export const sandboxAuthorityOwner = 'backend/sandbox';
export interface SandboxScopeDto { scopeId: string; environment: 'TEST' | 'SANDBOX'; accountId: string; permissions: string[]; expiresAt: string | null; state: DataState; }
export interface SandboxScenarioRequestDto { scopeId: string; scenario: string; parameters: Record<string, string | number | boolean | null>; auditReference: string; }
export interface SandboxAuditEventPayload { scope: SandboxScopeDto; scenario?: SandboxScenarioRequestDto; actorId: string; auditReference: string; }
export type SandboxEvent = ContractEvent<SandboxAuditEventPayload>;
