import * as Sentry from "@sentry/react";

// VITE_SENTRY_DSN must be set in Vercel environment variables.
// If not set (e.g. local dev without DSN), Sentry is a no-op.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  environment: import.meta.env.MODE,
  integrations: [
    // Traces page navigations and route changes as transactions
    Sentry.browserTracingIntegration(),
    // Records a video-like replay of the session when an error occurs
    Sentry.replayIntegration(),
  ],
  // Capture 20% of transactions in production, 100% elsewhere
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  // Record 10% of all sessions, and 100% of sessions where an error occurs
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
