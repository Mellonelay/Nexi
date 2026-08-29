import { scrubTelemetryContext } from '../../src/observability/privacy-scrubber';

describe('privacy telemetry scrubber', () => {
  it('redacts credentials, KYC, and financial payload keys recursively', () => {
    const result = scrubTelemetryContext({ token: 'secret', nested: { documentUrl: 'private', amount: '12.5', rawBody: { password: 'x' } } });
    expect(result).toEqual({ token: '[REDACTED]', nested: { documentUrl: '[REDACTED]', amount: '[REDACTED]', rawBody: '[REDACTED]' } });
  });

  it('truncates oversized strings', () => {
    const result = scrubTelemetryContext({ message: 'a'.repeat(600) });
    expect(String(result.message)).toContain('[TRUNCATED]');
  });
});
