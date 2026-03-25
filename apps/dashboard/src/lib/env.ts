import { z } from "zod";

const EnvSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SENTRY_DSN: z.string().url().optional(),
});

export const clientEnv = EnvSchema.parse(import.meta.env);
