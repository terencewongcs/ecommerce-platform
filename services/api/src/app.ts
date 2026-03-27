import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { env } from "./lib/env.js";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import adminRouter from "./routes/admin.js";
import vendorRouter from "./routes/vendor.js";
import accountRouter from "./routes/account.js";
import cartRouter from "./routes/cart.js";

const app: Express = express();

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

const ALLOWED_ORIGINS =
  env.NODE_ENV === "production"
    ? ["https://trendyunique.com"] // replace with real domain at launch
    : ["http://localhost:3000", "http://localhost:5173", "http://localhost:3002"];

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
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
