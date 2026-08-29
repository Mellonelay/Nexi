import { scrubTelemetryContext } from './privacy-scrubber';

export const SENTRY_REPLAY_ENABLED = false;
export const SENTRY_BACKEND_TRACE_SAMPLE_RATE = 0.05;
export const SENTRY_FRONTEND_TRACE_SAMPLE_RATE = 0.05;

const FIRST_PARTY_ORIGINS = new Set(['http://localhost', 'http://127.0.0.1']);
const EXPECTED_NOISE = [/^GET\s+\/healthz$/, /^GET\s+\/ops\/(live|ready)$/];

export type SentryOperationContext = {
  service: 'public-frontend' | 'authoritative-backend' | 'edge-adapter';
  operation: string;
  state?: string;
  outcome?: 'success' | 'failure' | 'replayed' | 'unavailable';
  durationMs?: number;
};

export function isFirstPartyTraceTarget(rawUrl: string): boolean {
  try {
    return FIRST_PARTY_ORIGINS.has(new URL(rawUrl).origin);
  } catch {
    return false;
  }
}

export function shouldDropExpectedNoise(operation: string): boolean {
  return EXPECTED_NOISE.some((pattern) => pattern.test(operation));
}

export function scrubSentryContext(context: Record<string, unknown>): Record<string, unknown> | null {
  try {
    return scrubTelemetryContext(context);
  } catch {
    return null;
  }
}

export function buildSentryOperationContext(context: SentryOperationContext): Record<string, unknown> | null {
  if (shouldDropExpectedNoise(context.operation)) return null;
  const bounded = {
    service: context.service,
    operation: context.operation.replace(/\/\d+/g, '/:id'),
    ...(context.state ? { state: context.state } : {}),
    ...(context.outcome ? { outcome: context.outcome } : {}),
    ...(typeof context.durationMs === 'number' ? { durationBucket: bucketDuration(context.durationMs) } : {}),
  };
  return scrubSentryContext(bounded);
}

function bucketDuration(durationMs: number): string {
  if (durationMs < 100) return 'lt_100ms';
  if (durationMs < 500) return '100_499ms';
  if (durationMs < 2000) return '500_1999ms';
  return 'gte_2000ms';
}
