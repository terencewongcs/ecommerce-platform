import { Router, type Router as RouterType, type Request, type Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { requireVendor } from "../middleware/auth.js";
import { stripe } from "../lib/stripe.js";
import { sendRefundConfirmationEmail } from "../lib/email.js";

const router: RouterType = Router();

// ── Shared pagination schema ──────────────────────────────────────────────────

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Product validation schema (no vendorId — taken from JWT) ─────────────────

const ProductBodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  images: z.array(z.string()).default([]),
  stock: z.number().int().min(0),
  category: z.array(z.enum(["women", "men", "accessories", "new-arrivals", "sale"])),
  sizes: z.array(z.string()).default([]),
  tag: z.enum(["New", "Sale", "Bestseller"]).nullable().default(null),
  isPublished: z.boolean().default(false),
});

// ── GET /vendor/products ──────────────────────────────────────────────────────

router.get("/products", requireVendor, async (req: Request, res: Response) => {
  const parsed = PaginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  // vendorId is auto-populated from the verified JWT — vendor cannot access other vendors' products
  const vendorId = req.user!.sub;

  const [products, total] = await Promise.all([
    Product.find({ vendorId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments({ vendorId }),
  ]);

  res.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ── POST /vendor/products ─────────────────────────────────────────────────────

router.post("/products", requireVendor, async (req: Request, res: Response) => {
  const parsed = ProductBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const product = await Product.create({
    ...parsed.data,
    vendorId: new mongoose.Types.ObjectId(req.user!.sub),
  });
  res.status(201).json({ product });
});

// ── GET /vendor/products/:id ──────────────────────────────────────────────────

router.get("/products/:id", requireVendor, async (req: Request, res: Response) => {
  // Scoped to this vendor's products only
  const product = await Product.findOne({
    _id: req.params.id,
    vendorId: req.user!.sub,
  }).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});

// ── PUT /vendor/products/:id ──────────────────────────────────────────────────

router.put("/products/:id", requireVendor, async (req: Request, res: Response) => {
  const parsed = ProductBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user!.sub },
    parsed.data,
    { new: true, runValidators: true },
  ).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});

// ── DELETE /vendor/products/:id ───────────────────────────────────────────────

router.delete("/products/:id", requireVendor, async (req: Request, res: Response) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    vendorId: req.user!.sub,
  });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ message: "Product deleted" });
});

// ── GET /vendor/orders ────────────────────────────────────────────────────────
// Returns orders that contain at least one item from this vendor's products

router.get("/orders", requireVendor, async (req: Request, res: Response) => {
  const parsed = PaginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const vendorProductIds = await Product.find({
    vendorId: new mongoose.Types.ObjectId(req.user!.sub),
  }).distinct("_id");

  const filter = { "items.productId": { $in: vendorProductIds } };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ── PATCH /vendor/orders/:id/status ──────────────────────────────────────────

const UpdateOrderStatusSchema = z
  .object({
    // Vendors can only move orders forward; cancellation and refund approval have dedicated routes
    status: z.enum(["processing", "shipped", "delivered", "refunded"]),
    // Required when status is "shipped"
    trackingNumber: z.string().min(1).optional(),
    carrier: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      data.status !== "shipped" || (Boolean(data.trackingNumber) && Boolean(data.carrier)),
    { message: "trackingNumber and carrier are required when status is shipped" },
  );

router.patch("/orders/:id/status", requireVendor, async (req: Request, res: Response) => {
  const parsed = UpdateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  // Verify this order contains at least one of the vendor's products
  const vendorProductIds = await Product.find({
    vendorId: new mongoose.Types.ObjectId(req.user!.sub),
  }).distinct("_id");

  const order = await Order.findOne({
    _id: req.params.id,
    "items.productId": { $in: vendorProductIds },
  });

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const { status, trackingNumber, carrier } = parsed.data;

  // ── refunded: call Stripe Refund API before updating DB ──────────────────
  if (status === "refunded") {
    if (order.status !== "refund_requested") {
      res.status(409).json({ error: "Order must be in refund_requested status to approve refund" });
      return;
    }

    try {
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
    } catch (stripeErr) {
      console.error("[vendor] Stripe refund creation failed:", stripeErr);
      res.status(502).json({ error: "Stripe refund failed" });
      return;
    }

    order.status = "refunded";
    await order.save();

    try {
      const user = await User.findById(order.userId).lean();
      if (user) {
        await sendRefundConfirmationEmail(
          user.email,
          user.firstName,
          order._id.toString(),
          order.refundReason ?? "",
        );
      }
    } catch (emailErr) {
      console.error("[vendor] Failed to send refund confirmation email:", emailErr);
    }

    res.json({ order });
    return;
  }

  // ── shipped: write tracking info + shippedAt ─────────────────────────────
  const update: Record<string, unknown> = { status };
  if (status === "shipped") {
    update.trackingNumber = trackingNumber;
    update.carrier = carrier;
    update.shippedAt = new Date();
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true },
  ).lean();

  res.json({ order: updatedOrder });
});

export default router;
