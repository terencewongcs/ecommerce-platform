import { Router, type Router as RouterType, type Request, type Response } from "express";
import { UpdateProfileSchema, ConfirmPasswordSchema } from "@trendyuniquellc/types";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import { env } from "../lib/env.js";

const router: RouterType = Router();

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ── PATCH /account/profile ────────────────────────────────────────────────────

router.patch("/profile", requireAuth, async (req: Request, res: Response) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user!.sub,
    { firstName: parsed.data.firstName, lastName: parsed.data.lastName },
    { new: true },
  ).lean();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

// ── POST /account/change-password/request ─────────────────────────────────────
// Authenticated user requests a password reset email

router.post("/change-password/request", requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Generate a cryptographically random token and hash it for storage
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await user.save();

  const resetUrl = `${env.STOREFRONT_URL}/account/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.firstName, resetUrl);

  res.json({ message: "Reset link sent. Check your inbox — it expires in 1 hour." });
});

// ── POST /account/change-password/confirm ─────────────────────────────────────
// Public endpoint — user arrives via email link, may not have an active session

router.post("/change-password/confirm", async (req: Request, res: Response) => {
  const parsed = ConfirmPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Find the user whose stored hash matches and whose token hasn't expired
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiry: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpiry");

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
    return;
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // Invalidate the used token immediately
  user.passwordResetTokenHash = null;
  user.passwordResetExpiry = null;
  // Log out all devices as a security measure after password change
  user.refreshTokenHashes = [];
  await user.save();

  res.json({ message: "Password updated successfully. Please log in with your new password." });
});

export default router;
