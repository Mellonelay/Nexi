import type { PendingIntentKey } from './intent-key';

/** Persist an economic intent before sending it. This is a recovery hint, not financial truth. */
export type PendingEconomicIntent = {
  principal: string;
  intent: PendingIntentKey;
  context: Record<string, string>;
};

const storageKey = (kind: string, principal: string) => `nexi:pending-economic:v1:${kind}:${principal}`;

export function readPendingEconomicIntent(kind: string, principal: string): PendingEconomicIntent | null {
  if (typeof window === 'undefined' || !principal) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(kind, principal));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Partial<PendingEconomicIntent>;
    if (value.principal !== principal || typeof value.intent?.key !== 'string'
      || !value.intent.key || typeof value.intent.fingerprint !== 'string'
      || !value.context || typeof value.context !== 'object' || Array.isArray(value.context)) return null;
    if (!Object.values(value.context).every((v) => typeof v === 'string')) return null;
    return value as PendingEconomicIntent;
  } catch {
    return null;
  }
}

export function persistPendingEconomicIntent(kind: string, value: PendingEconomicIntent): boolean {
  if (typeof window === 'undefined' || !value.principal) return false;
  try {
    const key = storageKey(kind, value.principal);
    // Never overwrite another unresolved economic operation.
    if (window.sessionStorage.getItem(key)) return false;
    const serialized = JSON.stringify(value);
    window.sessionStorage.setItem(key, serialized);
    return window.sessionStorage.getItem(key) === serialized;
  } catch {
    return false;
  }
}

export function clearPendingEconomicIntent(kind: string, principal: string, expectedKey: string): boolean {
  if (typeof window === 'undefined' || !principal) return false;
  try {
    const key = storageKey(kind, principal);
    const current = readPendingEconomicIntent(kind, principal);
    if (current && current.intent.key !== expectedKey) return false;
    if (!current && window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
