import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { env } from "./lib/env.js";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import adminRouter from "./routes/admin.js";
import vendorRouter from "./routes/vendor.js";
import accountRouter from "./routes/account.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";

const app: Express = express();

// ── Stripe webhook raw body ───────────────────────────────────────────────────
// MUST be registered before express.json() so the raw Buffer reaches the webhook handler.
// express.json() would consume and discard the raw bytes needed for signature verification.

app.use("/orders/webhook", express.raw({ type: "application/json" }));

// ── Core middleware ──────────────────────────────────────────────────────────

app.use(express.json());

// Read cookies from requests (needed for the HttpOnly refresh token)
// Using a lightweight manual parser since cookie-parser isn't in dependencies
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    for (const part of cookieHeader.split(";")) {
      const [key, ...val] = part.trim().split("=");
      if (key) req.cookies[key.trim()] = decodeURIComponent(val.join("="));
    }
  }
  next();
});

// ── CORS ─────────────────────────────────────────────────────────────────────

const PRODUCTION_ORIGINS = (["https://trendyunique.org", "https://www.trendyunique.org", env.DASHBOARD_URL ?? ""] as string[]).filter(Boolean);
const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://localhost:3002"];
// Staging custom domains injected via env vars (set in Vercel Preview environment)
const STAGING_ORIGINS = [env.STOREFRONT_URL, env.DASHBOARD_URL ?? ""].filter(
  (s) => s && !s.includes("localhost")
);

function isAllowedOrigin(origin: string): boolean {
  if (env.NODE_ENV === "production") {
    return PRODUCTION_ORIGINS.includes(origin);
  }
  // Staging: allow custom staging domains, localhost, and temporary vercel.app preview URLs
  return (
    DEV_ORIGINS.includes(origin) ||
    STAGING_ORIGINS.includes(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
  );
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Cache-Control");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/admin", adminRouter);
app.use("/vendor", vendorRouter);
app.use("/account", accountRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);

// Health check — useful for deployment readiness probes
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// ── 404 handler ──────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────
// Express 5 passes async errors here automatically

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = (err as { status?: number }).status ?? 500;
  const message =
    env.NODE_ENV === "production" ? "Internal server error" : String(err);
  res.status(status).json({ error: message });
});

export default app;
