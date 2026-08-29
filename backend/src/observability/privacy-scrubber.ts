const SENSITIVE_KEY = /(password|token|secret|authorization|cookie|refresh|access|kyc|document|private.?key|seed|mnemonic|financial.?payload|raw.?body|body|header|query|local.?storage|wallet|address|account|balance|amount|stake|payout|rate|order|receipt|sql|redis|provider)/i;

export function scrubTelemetryValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[REDACTED_DEPTH]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 512 ? `${value.slice(0, 512)}…[TRUNCATED]` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => scrubTelemetryValue(item, depth + 1));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    SENSITIVE_KEY.test(key) ? '[REDACTED]' : scrubTelemetryValue(item, depth + 1),
  ]));
}

export function scrubTelemetryContext(context: Record<string, unknown>): Record<string, unknown> {
  return scrubTelemetryValue(context) as Record<string, unknown>;
}
