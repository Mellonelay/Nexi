const DENY_KEY = /(authorization|cookie|token|secret|password|body|query|local.?storage|wallet|address|account|balance|amount|stake|payout|kyc|document|receipt|private.?key|seed|mnemonic)/i;

export type FrontendTelemetryContext = {
  route: string;
  operation: string;
  status?: string;
  outcome?: 'success' | 'failure' | 'unavailable';
};

export function isApprovedApiOrigin(rawUrl: string): boolean {
  try {
    const browserOrigin = typeof window === 'undefined' ? 'http://127.0.0.1' : window.location.origin;
    const url = new URL(rawUrl, browserOrigin);
    return url.origin === browserOrigin || url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  } catch {
    return false;
  }
}

export function buildFrontendTelemetryContext(context: FrontendTelemetryContext): Record<string, string> {
  const route = context.route.split('?')[0].replace(/\/\d+/g, '/:id');
  const result: Record<string, string> = { route, operation: context.operation };
  if (context.status) result.status = context.status;
  if (context.outcome) result.outcome = context.outcome;
  return Object.fromEntries(Object.entries(result).filter(([key]) => !DENY_KEY.test(key)));
}

export function sanitizeFrontendEvent(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([key]) => !DENY_KEY.test(key)));
}
