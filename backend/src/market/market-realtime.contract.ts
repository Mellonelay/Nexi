/**
 * Static market realtime contract. Redis/provider reconnect is not replay proof:
 * clients recover from an authoritative snapshot, then accept strictly newer
 * per-symbol sequences. Exact missed-event replay remains a deferred runtime
 * capability until a durable cursor/outbox campaign proves it end to end.
 */
export const MARKET_REALTIME_CONTRACT = {
  version: 'v1',
  snapshotEvent: 'market_snapshot',
  quoteEvent: 'market_quote',
  tickEvent: 'market_tick',
  sequence: 'monotonic-per-symbol',
  recovery: 'snapshot-on-connect-exact-replay-deferred',
} as const;
