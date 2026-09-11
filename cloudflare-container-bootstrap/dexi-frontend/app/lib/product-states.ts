export const AUTHORITATIVE_STATES = [
  'LOADING',
  'LIVE',
  'STALE',
  'UNAVAILABLE',
  'DISABLED',
  'ERROR',
] as const;

export type AuthoritativeState = (typeof AUTHORITATIVE_STATES)[number];

const PRODUCT_STATE_LABELS: Record<string, string> = {
  LIVE: 'Current',
  STALE: 'Updating',
  UNAVAILABLE: 'Not available',
  DISABLED: 'Not available',
  ERROR: 'Try again',
  LOADING: 'Loading',
  CONNECTION_ERROR: 'Connection issue',
};

export function productStateLabel(state: string): string {
  const mapped = PRODUCT_STATE_LABELS[state];
  if (mapped) return mapped;
  const normalized = state.replaceAll('_', ' ').toLowerCase();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : 'Not available';
}

export const WALLET_DOMAINS = ['OVERVIEW', 'FUNDING', 'SPOT', 'BINARY', 'FINANCE'] as const;
export type WalletDomain = (typeof WALLET_DOMAINS)[number];

export const EXTERNAL_WALLET_STATES = [
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'WRONG_NETWORK',
  'UNSUPPORTED_NETWORK',
  'SIGNATURE_REQUIRED',
  'CONNECTION_ERROR',
] as const;
export type ExternalWalletState = (typeof EXTERNAL_WALLET_STATES)[number];

export const EARN_STATES = [
  'AVAILABLE',
  'SUBMITTING',
  'ACTIVE',
  'MATURING',
  'CLAIMABLE',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
  'DISABLED',
] as const;
export type EarnState = (typeof EARN_STATES)[number];

export const LOAN_STATES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ACTIVE',
  'PAID',
  'OVERDUE',
] as const;
export type LoanState = (typeof LOAN_STATES)[number];

export const MESSAGE_DELIVERY_STATES = [
  'DRAFT',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
] as const;
export type MessageDeliveryState = (typeof MESSAGE_DELIVERY_STATES)[number];

export const MESSAGE_THREAD_STATES = ['UNREAD', 'READ', 'ARCHIVED'] as const;
export type MessageThreadState = (typeof MESSAGE_THREAD_STATES)[number];

export function authoritativeValue(value: unknown): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
  if (typeof value === 'string') return value.trim() || '—';
  return '—';
}

export function normalizeProductState<T extends readonly string[]>(value: unknown, allowed: T): T[number] | 'UNAVAILABLE' {
  const state = String(value ?? '').trim().toUpperCase();
  return (allowed as readonly string[]).includes(state) ? state as T[number] : 'UNAVAILABLE';
}

export function normalizeLoanState(value: unknown): LoanState | 'UNAVAILABLE' {
  return normalizeProductState(value, LOAN_STATES);
}

export function normalizeMessageDeliveryState(value: unknown): MessageDeliveryState | 'UNAVAILABLE' {
  return normalizeProductState(value, MESSAGE_DELIVERY_STATES);
}

export function normalizeMessageThreadState(value: unknown): MessageThreadState | 'UNAVAILABLE' {
  return normalizeProductState(value, MESSAGE_THREAD_STATES);
}

export function normalizeExternalWalletState(value: unknown): ExternalWalletState {
  const state = String(value ?? '').trim().toUpperCase();
  return (EXTERNAL_WALLET_STATES as readonly string[]).includes(state)
    ? state as ExternalWalletState
    : 'CONNECTION_ERROR';
}

export function resolveEndpointTemplate(
  template: string | undefined,
  params: Record<string, string>,
): string | null {
  if (!template?.trim()) return null;
  let endpoint = template.trim();
  for (const [key, value] of Object.entries(params)) {
    endpoint = endpoint.replaceAll(`{${key}}`, encodeURIComponent(value));
  }
  return /\{[^}]+\}/.test(endpoint) ? null : endpoint;
}

export function actionCanSubmit(input: {
  authenticated: boolean;
  valid: boolean;
  backendAvailable: boolean;
}): boolean {
  return input.authenticated && input.valid && input.backendAvailable;
}
