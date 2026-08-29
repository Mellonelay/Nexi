export type ContractVersion = 'v1';
export type DataState = 'LOADING' | 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'ERROR' | 'DISCONNECTED' | 'SUBMITTING' | 'SUCCESS' | 'FAILURE' | 'MAINTENANCE';
export interface ContractEnvelope<T> { version: ContractVersion; state: DataState; data: T | null; source?: string; updatedAt?: string; correlationId?: string; }
export interface ContractEvent<T> { version: ContractVersion; event: string; emittedAt: string; correlationId?: string; payload: T; }
