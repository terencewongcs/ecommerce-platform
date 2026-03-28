import { Router, type Router as RouterType, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { RegisterSchema, LoginSchema } from "@trendyuniquellc/types";
import { User } from "../models/User.js";
import { env } from "../lib/env.js";
import type { JwtAccessPayload } from "../middleware/auth.js";

const router: RouterType = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const REFRESH_COOKIE = "refreshToken";

function signAccessToken(payload: JwtAccessPayload): string {
  // Cast to `any` to avoid exactOptionalPropertyTypes conflicts in @types/jsonwebtoken
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as any, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

function signRefreshToken(userId: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ sub: userId } as any, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

/** Parse "7d" → milliseconds so we can set cookie maxAge */
function parseDurationMs(duration: string): number {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "m") return value * 60 * 1000;
  return value * 1000;
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,           // JS cannot read this cookie
    secure: env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
    path: "/auth",            // only sent to /auth/* endpoints
  });
}

// ── POST /auth/register ──────────────────────────────────────────────────────

router.post("/register", async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { email, password, firstName, lastName } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ email, passwordHash, firstName, lastName });

  const accessPayload: JwtAccessPayload = {
    sub: user.id as string,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(user.id as string);

  // Store a hash of the refresh token so we can validate it later
  const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(user.id, { $push: { refreshTokenHashes: refreshHash } });

  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
});

// ── POST /auth/login ─────────────────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).select("+passwordHash +refreshTokenHashes");
  if (!user) {
    // Same response as wrong password to avoid user enumeration
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const accessPayload: JwtAccessPayload = {
    sub: user.id as string,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(user.id as string);

  const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(user.id, { $push: { refreshTokenHashes: refreshHash } });

  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

// ── POST /auth/refresh ───────────────────────────────────────────────────────

router.post("/refresh", async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  // Verify signature and expiry
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  // Load user and check that this specific token is on record
  const user = await User.findById(payload.sub).select("+refreshTokenHashes");
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Check the token against all stored hashes
  let matchedHash: string | null = null;
  for (const hash of user.refreshTokenHashes) {
    if (await bcrypt.compare(token, hash)) {
      matchedHash = hash;
      break;
    }
  }

  if (!matchedHash) {
    // Token not on record — possible reuse attack; revoke all tokens
    await User.findByIdAndUpdate(user.id, { $set: { refreshTokenHashes: [] } });
    res.status(401).json({ error: "Refresh token reuse detected" });
    return;
  }

  // Rotate: remove old hash, issue new token pair
  const newRefreshToken = signRefreshToken(user.id as string);
  const newRefreshHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);

  // MongoDB does not allow $pull and $push on the same field in one operation — split into two
  await User.findByIdAndUpdate(user.id, { $pull: { refreshTokenHashes: matchedHash } });
  await User.findByIdAndUpdate(user.id, { $push: { refreshTokenHashes: newRefreshHash } });

  const accessPayload: JwtAccessPayload = {
    sub: user.id as string,
    email: user.email,
    role: user.role,
  };

  setRefreshCookie(res, newRefreshToken);
  res.json({ accessToken: signAccessToken(accessPayload), user });
});

// ── POST /auth/logout ────────────────────────────────────────────────────────

router.post("/logout", async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];

  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
      const user = await User.findById(payload.sub).select("+refreshTokenHashes");
      if (user) {
        // Remove only the matching hash so other devices stay logged in
        for (const hash of user.refreshTokenHashes) {
          if (await bcrypt.compare(token, hash)) {
            await User.findByIdAndUpdate(user.id, { $pull: { refreshTokenHashes: hash } });
            break;
          }
        }
      }
    } catch {
      // Token is invalid/expired — nothing to revoke, just clear the cookie
    }
  }

  res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  res.json({ message: "Logged out" });
});

export default router;
