import { Resend } from "resend";
import { env } from "./env.js";

// Minimal order shape needed to render confirmation emails — avoids coupling to Mongoose
interface OrderEmailSummary {
  id: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
}

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

/**
 * Sends an order confirmation email after successful payment.
 * Failures are logged but never thrown — email errors must not block the order flow.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  firstName: string,
  order: OrderEmailSummary,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping order confirmation for order ${order.id}`);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a;">${item.name}</td>
          <td style="padding: 8px 0; font-size: 13px; color: #6b6b6b; text-align: center;">×${item.quantity}</td>
          <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; text-align: right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Your TrendyUnique order has been placed",
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family: Georgia, serif; background: #faf8f5; padding: 40px 20px; margin: 0;">
    <div style="max-width: 520px; margin: 0 auto; background: white; padding: 48px; border: 1px solid #e8e4df;">
      <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #c5973e; margin: 0 0 24px;">
        TrendyUnique
      </p>
      <h1 style="font-size: 22px; font-weight: 300; color: #1a1a1a; margin: 0 0 8px; letter-spacing: 0.05em;">
        Order Confirmed
      </h1>
      <p style="font-size: 11px; letter-spacing: 0.15em; color: #9b9b9b; margin: 0 0 32px; text-transform: uppercase;">
        Order #${order.id.slice(-8).toUpperCase()}
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #6b6b6b; margin: 0 0 32px;">
        Hi ${firstName}, thank you for your order. We'll notify you when it ships.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tbody>${itemsHtml}</tbody>
      </table>
      <hr style="border: none; border-top: 1px solid #e8e4df; margin: 0 0 16px;" />
      <table style="width: 100%;">
        <tr>
          <td style="font-size: 12px; color: #6b6b6b; padding: 4px 0;">Subtotal</td>
          <td style="font-size: 12px; color: #1a1a1a; text-align: right; padding: 4px 0;">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-size: 12px; color: #6b6b6b; padding: 4px 0;">Shipping</td>
          <td style="font-size: 12px; color: #1a1a1a; text-align: right; padding: 4px 0;">${order.shippingCost === 0 ? "Free" : `$${order.shippingCost.toFixed(2)}`}</td>
        </tr>
        <tr>
          <td style="font-size: 12px; color: #6b6b6b; padding: 4px 0;">Tax</td>
          <td style="font-size: 12px; color: #1a1a1a; text-align: right; padding: 4px 0;">$${order.tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-size: 14px; font-weight: 600; color: #1a1a1a; padding: 12px 0 4px;">Total</td>
          <td style="font-size: 14px; font-weight: 600; color: #1a1a1a; text-align: right; padding: 12px 0 4px;">$${order.total.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </body>
</html>`,
  });
}

/**
 * Sends a refund confirmation email after a vendor approves a refund.
 * Failures are logged but never thrown.
 */
export async function sendRefundConfirmationEmail(
  to: string,
  firstName: string,
  orderId: string,
  refundReason: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping refund confirmation for order ${orderId}`);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Your TrendyUnique refund has been processed",
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family: Georgia, serif; background: #faf8f5; padding: 40px 20px; margin: 0;">
    <div style="max-width: 480px; margin: 0 auto; background: white; padding: 48px; border: 1px solid #e8e4df;">
      <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #c5973e; margin: 0 0 24px;">
        TrendyUnique
      </p>
      <h1 style="font-size: 22px; font-weight: 300; color: #1a1a1a; margin: 0 0 8px; letter-spacing: 0.05em;">
        Refund Processed
      </h1>
      <p style="font-size: 11px; letter-spacing: 0.15em; color: #9b9b9b; margin: 0 0 32px; text-transform: uppercase;">
        Order #${orderId.slice(-8).toUpperCase()}
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #6b6b6b; margin: 0 0 16px;">
        Hi ${firstName},
      </p>
      <p style="font-size: 14px; line-height: 1.7; color: #6b6b6b; margin: 0 0 16px;">
        Your refund has been approved and processed. The amount will be returned to your original payment method within 5–10 business days.
      </p>
      ${
        refundReason
          ? `<p style="font-size: 13px; line-height: 1.6; color: #9b9b9b; margin: 0 0 0; border-left: 2px solid #e8e4df; padding-left: 16px;">
        Reason: ${refundReason}
      </p>`
          : ""
      }
    </div>
  </body>
</html>`,
  });
}
