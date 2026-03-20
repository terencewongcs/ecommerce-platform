import { z } from "zod";

const ClientEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SENTRY_DSN: z.string().url().optional(),
});

export const clientEnv = ClientEnvSchema.parse(import.meta.env);
