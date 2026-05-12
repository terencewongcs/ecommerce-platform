import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: z.string().url(),
  DASHBOARD_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
  CLOUDFLARE_R2_PUBLIC_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().default("noreply@trendyunique.org"),
  STOREFRONT_URL: z.string().url().default("http://localhost:3000"),
});

export const env = EnvSchema.parse(process.env);
