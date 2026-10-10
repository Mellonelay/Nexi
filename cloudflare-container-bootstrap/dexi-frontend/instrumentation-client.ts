import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: 0.05,
    enableLogs: true,
    replaysSessionSampleRate: 0.02,
    replaysOnErrorSampleRate: 1.0,
    profileSessionSampleRate: 0.01,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserProfilingIntegration(),
    ],
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
