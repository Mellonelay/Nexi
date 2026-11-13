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
  'UNKNOWN',
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
  'UNKNOWN',
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
  SUBMITTING: ['OPEN', 'FILLED', 'REJECTED', 'FAILED', 'UNKNOWN'],
  OPEN: ['PARTIALLY_FILLED', 'FILLED', 'CANCEL_PENDING', 'EXPIRED', 'FAILED'],
  PARTIALLY_FILLED: ['FILLED', 'CANCEL_PENDING', 'EXPIRED', 'FAILED'],
  FILLED: [],
  CANCEL_PENDING: ['CANCELLED', 'OPEN', 'PARTIALLY_FILLED', 'FAILED'],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
  FAILED: [],
  UNKNOWN: ['OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'FAILED'],
};

const BINARY_TRANSITIONS: Record<BinaryPositionState, readonly BinaryPositionState[]> = {
  DRAFT: ['CONFIRMATION', 'UNAVAILABLE', 'DISABLED', 'PRICE_STALE'],
  CONFIRMATION: ['SUBMITTING', 'DRAFT', 'UNAVAILABLE', 'PRICE_STALE'],
  SUBMITTING: ['OPEN', 'UNKNOWN', 'ERROR', 'CONNECTION_LOST'],
  UNKNOWN: ['OPEN', 'SETTLING', 'SETTLEMENT_DELAYED', 'WIN', 'LOSS', 'ERROR', 'CONNECTION_LOST'],
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
  const normalized = state === 'FAILED' ? 'ERROR' : state === 'ACTIVE' ? 'OPEN' : state;
  // An unrecognized read-model state is not evidence of a financial settlement failure.
  // Preserve explicit ERROR/legacy FAILED, but never fabricate ERROR for a new or missing state.
  return (BINARY_POSITION_STATES as readonly string[]).includes(normalized)
    ? normalized as BinaryPositionState
    : 'UNAVAILABLE';
}

export function positiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function positiveDecimalAmount(value: unknown): boolean {
  const amount = String(value ?? '').trim();
  return /^\d+(?:\.\d+)?$/.test(amount) && /[1-9]/.test(amount);
}

export function decimalLessThanOrEqual(left: unknown, right: unknown): boolean {
  const a = String(left ?? '').trim();
  const b = String(right ?? '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(a) || !/^\d+(?:\.\d+)?$/.test(b)) return false;
  const normalize = (value: string) => {
    const [integer, fraction = ''] = value.split('.');
    return [integer.replace(/^0+(?=\d)/, ''), fraction.replace(/0+$/, '')] as const;
  };
  const [aWhole, aFraction] = normalize(a);
  const [bWhole, bFraction] = normalize(b);
  if (aWhole.length !== bWhole.length) return aWhole.length < bWhole.length;
  if (aWhole !== bWhole) return aWhole < bWhole;
  return aFraction.padEnd(Math.max(aFraction.length, bFraction.length), '0')
    <= bFraction.padEnd(Math.max(aFraction.length, bFraction.length), '0');
}

export function decimalAmountWithinBalance(amount: unknown, available: unknown): boolean {
  return positiveDecimalAmount(amount) && decimalLessThanOrEqual(amount, available);
}

function optionsStakeWithinBalance(amount: unknown, accountActive: boolean, available: unknown): boolean {
  return accountActive === true && decimalAmountWithinBalance(amount, available);
}

export function spotOrderReady(input: {
  authenticated: boolean;
  backendConfigured: boolean;
  amount: unknown;
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  price?: unknown;
  stopPrice?: unknown;
}) {
  if (!input.authenticated || !input.backendConfigured || !positiveDecimalAmount(input.amount)) return false;
  if (input.orderType === 'LIMIT') return positiveDecimalAmount(input.price);
  // MARKET submits against a fresh server quote; the displayed JS number can stringify in exponent notation.
  if (input.orderType === 'MARKET') return positiveNumber(input.price) !== null;
  if (input.orderType === 'STOP') {
    return positiveDecimalAmount(input.price) && positiveDecimalAmount(input.stopPrice);
  }
  return false;
}

export function binaryOrderReady(input: {
  authenticated: boolean;
  backendConfigured: boolean;
  optionsAccountActive: boolean;
  optionsAvailableBalance: unknown;
  amount: unknown;
  currentPrice: unknown;
  durationEnabled: boolean;
  payoutRate: unknown;
  minimumAmount?: unknown;
  maximumAmount?: unknown;
}) {
  return input.authenticated
    && input.backendConfigured
    && optionsStakeWithinBalance(input.amount, input.optionsAccountActive, input.optionsAvailableBalance)
    && positiveNumber(input.currentPrice) !== null
    && input.durationEnabled
    && positiveNumber(input.payoutRate) !== null
    && decimalLessThanOrEqual(input.minimumAmount, input.maximumAmount)
    && decimalLessThanOrEqual(input.minimumAmount, input.amount)
    && decimalAmountWithinBalance(input.amount, input.maximumAmount);
}

export function formatDecimalRatePercent(value: unknown, suffix: string): string {
  const rate = String(value ?? '').trim();
  const parsed = /^(0|[1-9]\d*)(?:\.(\d+))?(?:e([+-]?\d{1,3}))?$/i.exec(rate);
  if (!parsed) return '—';
  const [, integer, fraction = '', exponent = '0'] = parsed;
  // Prisma Decimal may serialize very small nonzero rates in scientific notation.
  const point = integer.length + Number(exponent) + 2;
  if (point < -80 || point > 80) return '—';
  const digits = integer + fraction;
  const percentInteger = (point > 0 ? digits.padEnd(point, '0').slice(0, point) : '0').replace(/^0+(?=\d)/, '');
  const percentFraction = (point < 0 ? '0'.repeat(-point) + digits : digits.slice(point)).replace(/0+$/, '');
  return percentInteger + (percentFraction ? '.' + percentFraction : '') + suffix;
}
