import {
  buildSentryOperationContext,
  isFirstPartyTraceTarget,
  SENTRY_REPLAY_ENABLED,
  scrubSentryContext,
} from '../../src/observability/sentry-policy';

describe('Sentry privacy policy boundary', () => {
  it('keeps replay disabled and restricts trace targets to first-party origins', () => {
    expect(SENTRY_REPLAY_ENABLED).toBe(false);
    expect(isFirstPartyTraceTarget('http://127.0.0.1/api/health')).toBe(true);
    expect(isFirstPartyTraceTarget('https://provider.example/quote')).toBe(false);
    expect(isFirstPartyTraceTarget('not-a-url')).toBe(false);
  });

  it('drops health noise and bounds operation context', () => {
    expect(buildSentryOperationContext({ service: 'authoritative-backend', operation: 'GET /ops/ready' })).toBeNull();
    expect(buildSentryOperationContext({ service: 'authoritative-backend', operation: 'POST /admin/users/123', durationMs: 700 })).toEqual({
      service: 'authoritative-backend',
      operation: 'POST /admin/users/:id',
      durationBucket: '500_1999ms',
    });
  });

  it('redacts secrets, financial, KYC, and body data before an event can be used', () => {
    const scrubbed = scrubSentryContext({
      authorization: 'Bearer test-token',
      financialPayload: { amount: '100.00' },
      kycDocument: 'fake-document',
      body: { walletAddress: 'wallet-secret' },
      safeState: 'SETTLED',
    });
    expect(scrubbed).toEqual({
      authorization: '[REDACTED]',
      financialPayload: '[REDACTED]',
      kycDocument: '[REDACTED]',
      body: '[REDACTED]',
      safeState: 'SETTLED',
    });
  });
});
