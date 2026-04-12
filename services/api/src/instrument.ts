import * as Sentry from "@sentry/node";
import { env } from "./lib/env.js";

// If SENTRY_DSN is not set, Sentry.init() is a no-op — safe to call in all environments.
Sentry.init({
  ...(env.SENTRY_DSN && { dsn: env.SENTRY_DSN }),
  environment: env.VERCEL_ENV ?? "development",
  // Capture 100% of transactions in non-production, 20% in production to save quota
  tracesSampleRate: env.VERCEL_ENV === "production" ? 0.2 : 1.0,
});
