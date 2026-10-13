import * as Sentry from "@sentry/tanstackstart-react";
import { browserProfilingIntegration } from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    tracesSampleRate: 0.05,
    enableLogs: true,
    replaysSessionSampleRate: 0.02,
    replaysOnErrorSampleRate: 1.0,
    profileSessionSampleRate: 0.01,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      ...(typeof window === "undefined" ? [] : [browserProfilingIntegration()]),
    ],
    sendDefaultPii: false,
  });
}
