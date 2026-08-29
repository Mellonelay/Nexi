export const SPOT_ORDER_STATES = [
  'DRAFT',
  'SUBMITTING',
  'OPEN',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCEL_PENDING',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
  'FAILED',
] as const;

export type SpotOrderState = (typeof SPOT_ORDER_STATES)[number];

export const TP_SL_STATES = [
  'NOT_CONFIGURED',
  'CONFIGURED',
  'ACTIVE',
  'TRIGGERED',
  'CANCELLED',
  'FAILED',
] as const;

export type TpSlState = (typeof TP_SL_STATES)[number];

export const BINARY_POSITION_STATES = [
  'DRAFT',
  'CONFIRMATION',
  'SUBMITTING',
  'OPEN',
  'SETTLING',
  'SETTLEMENT_DELAYED',
  'WIN',
  'LOSS',
  'HISTORY',
  'UNAVAILABLE',
  'DISABLED',
  'ERROR',
  'CONNECTION_LOST',
  'PRICE_STALE',
] as const;

export type BinaryPositionState = (typeof BINARY_POSITION_STATES)[number];

const SPOT_TRANSITIONS: Record<SpotOrderState, readonly SpotOrderState[]> = {
  DRAFT: ['SUBMITTING'],
  SUBMITTING: ['OPEN', 'FILLED', 'REJECTED', 'FAILED'],
  OPEN: ['PARTIALLY_FILLED', 'FILLED', 'CANCEL_PENDING', 'EXPIRED', 'FAILED'],
  PARTIALLY_FILLED: ['FILLED', 'CANCEL_PENDING', 'EXPIRED', 'FAILED'],
  FILLED: [],
  CANCEL_PENDING: ['CANCELLED', 'OPEN', 'PARTIALLY_FILLED', 'FAILED'],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
  FAILED: [],
};

const BINARY_TRANSITIONS: Record<BinaryPositionState, readonly BinaryPositionState[]> = {
  DRAFT: ['CONFIRMATION', 'UNAVAILABLE', 'DISABLED', 'PRICE_STALE'],
  CONFIRMATION: ['SUBMITTING', 'DRAFT', 'UNAVAILABLE', 'PRICE_STALE'],
  SUBMITTING: ['OPEN', 'ERROR', 'CONNECTION_LOST'],
  OPEN: ['SETTLING', 'CONNECTION_LOST', 'PRICE_STALE'],
  SETTLING: ['SETTLEMENT_DELAYED', 'WIN', 'LOSS', 'ERROR'],
  SETTLEMENT_DELAYED: ['WIN', 'LOSS', 'ERROR', 'CONNECTION_LOST'],
  WIN: ['HISTORY'],
  LOSS: ['HISTORY'],
  HISTORY: [],
  UNAVAILABLE: ['DRAFT'],
  DISABLED: ['DRAFT'],
  ERROR: ['DRAFT', 'HISTORY'],
  CONNECTION_LOST: ['OPEN', 'SETTLING', 'SETTLEMENT_DELAYED', 'ERROR'],
  PRICE_STALE: ['DRAFT', 'OPEN', 'SETTLING', 'ERROR'],
};

export function canTransitionSpot(from: SpotOrderState, to: SpotOrderState) {
  return SPOT_TRANSITIONS[from].includes(to);
}

export function canTransitionBinary(from: BinaryPositionState, to: BinaryPositionState) {
  return BINARY_TRANSITIONS[from].includes(to);
}

export function normalizeSpotOrderState(value: unknown): SpotOrderState {
  const state = String(value ?? '').toUpperCase().replaceAll('CANCELED', 'CANCELLED');
  return (SPOT_ORDER_STATES as readonly string[]).includes(state) ? state as SpotOrderState : 'FAILED';
}

export function normalizeBinaryPositionState(value: unknown): BinaryPositionState {
  const state = String(value ?? '').toUpperCase();
  const normalized = state === 'FAILED' ? 'ERROR' : state;
  return (BINARY_POSITION_STATES as readonly string[]).includes(normalized)
    ? normalized as BinaryPositionState
    : 'ERROR';
}

export function positiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function spotOrderReady(input: {
  authenticated: boolean;
  backendConfigured: boolean;
  amount: unknown;
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LIMIT';
  price?: unknown;
  stopPrice?: unknown;
}) {
  if (!input.authenticated || !input.backendConfigured || positiveNumber(input.amount) === null) return false;
  if (input.orderType === 'LIMIT') return positiveNumber(input.price) !== null;
  if (input.orderType === 'STOP_LIMIT') {
    return positiveNumber(input.price) !== null && positiveNumber(input.stopPrice) !== null;
  }
  return false;
}

export function binaryOrderReady(input: {
  authenticated: boolean;
  backendConfigured: boolean;
  amount: unknown;
  currentPrice: unknown;
  durationEnabled: boolean;
  payoutRate: unknown;
  minimumAmount?: unknown;
  maximumAmount?: unknown;
}) {
  const amount = positiveNumber(input.amount);
  const minimumAmount = positiveNumber(input.minimumAmount);
  const maximumAmount = positiveNumber(input.maximumAmount);
  return input.authenticated
    && input.backendConfigured
    && amount !== null
    && positiveNumber(input.currentPrice) !== null
    && input.durationEnabled
    && positiveNumber(input.payoutRate) !== null
    && (minimumAmount === null || amount >= minimumAmount)
    && (maximumAmount === null || amount <= maximumAmount);
}
