import { Router, type Router as RouterType, type Request, type Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import type Stripe from "stripe";
import { stripe } from "../lib/stripe.js";
import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendOrderConfirmationEmail } from "../lib/email.js";
import { CreateOrderSchema } from "@trendyuniquellc/types";
import { env } from "../lib/env.js";

const router: RouterType = Router();

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const RefundRequestSchema = z.object({
  reason: z.string().min(1).max(500),
});

// ── POST /orders/webhook ──────────────────────────────────────────────────────
// MUST be defined before /:id routes so "webhook" is not matched as an order ID.
// req.body is a raw Buffer here — express.raw() is applied in app.ts before express.json().

router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing Stripe signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid Stripe signature" });
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    try {
      // Idempotency guard: only update if order is still pending_payment.
      // If the order is already paid (duplicate webhook), findOneAndUpdate returns null and we skip.
      const order = await Order.findOneAndUpdate(
        { stripePaymentIntentId: pi.id, status: "pending_payment" },
        { $set: { status: "paid" } },
        { new: true },
      ).lean();

      if (order) {
        const user = await User.findById(order.userId).lean();
        if (user) {
          try {
            await sendOrderConfirmationEmail(user.email, user.firstName, {
              id: order._id.toString(),
              items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
              subtotal: order.subtotal,
              tax: order.tax,
              shippingCost: order.shippingCost,
              total: order.total,
            });
          } catch (emailErr) {
            console.error("[webhook] Failed to send order confirmation email:", emailErr);
          }
        }
      }
    } catch (dbErr) {
      // Return 500 so Stripe retries the webhook
      console.error("[webhook] DB error on payment_intent.succeeded:", dbErr);
      res.status(500).json({ error: "Internal error" });
      return;
    }
  }

  // Return 200 for all events (including unhandled types and duplicate events)
  res.json({ received: true });
});

// ── POST /orders ──────────────────────────────────────────────────────────────

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { shippingAddress, idempotencyKey } = parsed.data;

  // Step 1: Load cart from DB
  const cart = await Cart.findOne({ userId: req.user!.sub }).lean();
  if (!cart || cart.items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  // Step 2: Validate all cart products exist and are published; use real DB prices
  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isPublished: true,
  }).lean();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const item of cart.items) {
    if (!productMap.has(item.productId)) {
      res.status(400).json({ error: `Product ${item.productId} is unavailable` });
      return;
    }
  }

  // Step 3: Calculate totals using authoritative DB prices (not cart's potentially stale prices)
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + productMap.get(item.productId)!.price * item.quantity;
  }, 0);
  const subtotalRounded = Math.round(subtotal * 100) / 100;
  const tax = Math.round(subtotalRounded * 0.08 * 100) / 100;
  const shippingCost = subtotalRounded >= 150 ? 0 : 12;
  const total = Math.round((subtotalRounded + tax + shippingCost) * 100) / 100;

  // Step 4: Create Stripe PaymentIntent (external call — must be outside the DB transaction)
  // The idempotencyKey from the client ensures a retry returns the same PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: Math.round(total * 100), // Stripe requires integer cents
      currency: "usd",
      metadata: { userId: req.user!.sub },
    },
    { idempotencyKey },
  );

  // Step 5: MongoDB transaction — atomic stock deduction + order creation
  const session = await mongoose.startSession();
  let createdOrderId: string | undefined;

  try {
    await session.withTransaction(async () => {
      // Deduct stock for each item atomically.
      // The $gte condition on stock acts as the guard against overselling.
      for (const item of cart.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session, new: true },
        );
        if (!updated) {
          const err = new Error(`Insufficient stock for ${item.name}`) as Error & { status: number };
          err.status = 409;
          throw err;
        }
      }

      const orderItems = cart.items.map((item) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        size: item.size,
        quantity: item.quantity,
        unitPrice: productMap.get(item.productId)!.price,
      }));

      // Order.create with a session requires the array form
      const docs = await Order.create(
        [
          {
            userId: new mongoose.Types.ObjectId(req.user!.sub),
            items: orderItems,
            status: "pending_payment",
            shippingAddress,
            subtotal: subtotalRounded,
            tax,
            shippingCost,
            total,
            stripePaymentIntentId: paymentIntent.id,
          },
        ],
        { session },
      );
      createdOrderId = docs[0]!._id.toString();
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    if (e.status === 409) {
      res.status(409).json({ error: e.message });
      return;
    }
    throw err;
  } finally {
    await session.endSession();
  }

  // Step 6: Clear cart after order is safely persisted (outside transaction — harmless if this fails)
  await Cart.findOneAndUpdate({ userId: req.user!.sub }, { $set: { items: [] } });

  res.status(201).json({
    clientSecret: paymentIntent.client_secret,
    orderId: createdOrderId,
  });
});

// ── GET /orders ───────────────────────────────────────────────────────────────

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = PaginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const userId = new mongoose.Types.ObjectId(req.user!.sub);

  const [orders, total] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments({ userId }),
  ]);

  res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ── GET /orders/:id ───────────────────────────────────────────────────────────

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  // userId in the filter prevents a user from reading another user's order by guessing an ObjectId
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user!.sub,
  }).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
});

// ── POST /orders/:id/cancel ───────────────────────────────────────────────────

router.post("/:id/cancel", requireAuth, async (req: Request, res: Response) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user!.sub,
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "pending_payment") {
    res.status(409).json({ error: "Only pending_payment orders can be cancelled" });
    return;
  }

  // Restore stock and update status atomically — if status update fails, stock restore rolls back
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { session },
        );
      }
      order.status = "cancelled";
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.json({ order });
});

// ── POST /orders/:id/refund-request ──────────────────────────────────────────

router.post("/:id/refund-request", requireAuth, async (req: Request, res: Response) => {
  const parsed = RefundRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  // Atomic guard: only allows transition from "processing" (per state machine)
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user!.sub,
      status: "processing",
    },
    {
      $set: { status: "refund_requested", refundReason: parsed.data.reason },
    },
    { new: true },
  ).lean();

  if (!order) {
    res.status(404).json({ error: "Order not found or not eligible for refund request" });
    return;
  }
  res.json({ order });
});

// ── PATCH /orders/:id/deliver ─────────────────────────────────────────────────

router.patch("/:id/deliver", requireAuth, async (req: Request, res: Response) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub, status: "shipped" },
    { $set: { status: "delivered" } },
    { new: true },
  ).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found or not in shipped status" });
    return;
  }
  res.json({ order });
});

// ── PATCH /orders/:id/complete ────────────────────────────────────────────────

router.patch("/:id/complete", requireAuth, async (req: Request, res: Response) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub, status: "delivered" },
    { $set: { status: "completed" } },
    { new: true },
  ).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found or not in delivered status" });
    return;
  }
  res.json({ order });
});

export default router;
