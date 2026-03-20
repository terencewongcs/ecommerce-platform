import { z } from "zod";

const ServerEnvSchema = z.object({
  API_URL: z.string().url(),
});

const ClientEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SENTRY_DSN: z.string().url().optional(),
});

export const serverEnv = ServerEnvSchema.parse(process.env);

export const clientEnv = ClientEnvSchema.parse(import.meta.env);
