import { Resend } from "resend";
import { env } from "./env.js";

/**
 * Sends a password reset email via Resend.
 * If RESEND_API_KEY is not set (local dev), logs the reset URL instead.
 */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send. Reset URL: ${resetUrl}`);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Reset your TrendyUnique password",
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family: Georgia, serif; background: #faf8f5; padding: 40px 20px; margin: 0;">
    <div style="max-width: 480px; margin: 0 auto; background: white; padding: 48px; border: 1px solid #e8e4df;">
      <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #c5973e; margin: 0 0 24px;">
        TrendyUnique
      </p>
      <h1 style="font-size: 22px; font-weight: 300; color: #1a1a1a; margin: 0 0 24px; letter-spacing: 0.05em;">
        Password Reset Request
      </h1>
      <p style="font-size: 14px; line-height: 1.7; color: #6b6b6b; margin: 0 0 16px;">
        Hi ${firstName},
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #6b6b6b; margin: 0 0 32px;">
        You requested a password change for your TrendyUnique account. Click the button below to set a new password. This link expires in <strong style="color: #1a1a1a;">1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #1a1a1a; color: #faf8f5; text-decoration: none;
                padding: 14px 36px; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;">
        Set New Password
      </a>
      <p style="font-size: 12px; line-height: 1.6; color: #9b9b9b; margin: 32px 0 0;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    </div>
  </body>
</html>`,
  });
}
