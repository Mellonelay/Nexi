export type TransitionTable = Readonly<Record<string, readonly string[]>>;

export function canTransition(table: TransitionTable, from: string, to: string): boolean {
  return table[from]?.includes(to) ?? false;
}

export function assertTransition(table: TransitionTable, from: string, to: string): void {
  if (!canTransition(table, from, to)) throw new Error(`Invalid state transition: ${from} -> ${to}`);
}

export const MARKET_TRANSITIONS: TransitionTable = { LOADING: ['LIVE', 'ERROR', 'UNAVAILABLE'], LIVE: ['STALE', 'ERROR', 'UNAVAILABLE'], STALE: ['LIVE', 'ERROR', 'UNAVAILABLE'], ERROR: ['LOADING', 'UNAVAILABLE'], UNAVAILABLE: ['LOADING', 'LIVE'] };
export const SPOT_TRANSITIONS: TransitionTable = { CREATED: ['OPEN', 'CANCELED'], OPEN: ['PARTIALLY_FILLED', 'FILLED', 'CANCELED'], PARTIALLY_FILLED: ['FILLED', 'CANCELED'], FILLED: [], CANCELED: [] };
export const BINARY_TRANSITIONS: TransitionTable = { OPEN: ['EXPIRED'], EXPIRED: ['SETTLEMENT_PENDING'], SETTLEMENT_PENDING: ['COMPLETED'], COMPLETED: [] };
export const SETTLEMENT_TRANSITIONS: TransitionTable = { PENDING: ['PROCESSING', 'REJECTED'], PROCESSING: ['COMPLETED', 'FAILED'], COMPLETED: [], FAILED: [], REJECTED: [] };
export const LOAN_TRANSITIONS: TransitionTable = { PENDING: ['APPROVED', 'REJECTED'], APPROVED: ['ACTIVE'], ACTIVE: ['PAID', 'OVERDUE'], OVERDUE: ['PAID'], PAID: [], REJECTED: [] };
export const MINING_TRANSITIONS: TransitionTable = { ACTIVE: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };
