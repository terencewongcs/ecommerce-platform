import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const ClientEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SENTRY_DSN: optionalUrl,
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
});

export const clientEnv = ClientEnvSchema.parse(import.meta.env);
