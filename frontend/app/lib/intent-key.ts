/** Stable key for retries of one economic intent; a changed payload starts a new intent. */
export type PendingIntentKey = { fingerprint: string; key: string };

export function getIntentKey(
  pending: PendingIntentKey | null,
  fingerprint: string,
  prefix: string,
  generateId: () => string = () => crypto.randomUUID(),
): PendingIntentKey {
  return pending?.fingerprint === fingerprint
    ? pending
    : { fingerprint, key: `${prefix}:${generateId()}` };
}
