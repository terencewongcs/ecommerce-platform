import { Router, type Router as RouterType, type Request, type Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { requireAdmin } from "../middleware/auth.js";

const router: RouterType = Router();

// ── Shared pagination schema ──────────────────────────────────────────────────

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── GET /admin/stats ──────────────────────────────────────────────────────────

router.get("/stats", requireAdmin, async (_req: Request, res: Response) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    publishedProducts,
    totalOrders,
    totalUsers,
    revenueResult,
    ordersByStatus,
    dailyRevenue,
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isPublished: true }),
    Order.countDocuments({}),
    User.countDocuments({}),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    products: { total: totalProducts, published: publishedProducts },
    orders: { total: totalOrders },
    users: { total: totalUsers },
    revenue: { total: (revenueResult[0]?.total as number | undefined) ?? 0 },
    ordersByStatus: ordersByStatus as Array<{ _id: string; count: number }>,
    dailyRevenue: dailyRevenue as Array<{ _id: string; revenue: number; orders: number }>,
  });
});

// ── Product validation schema ─────────────────────────────────────────────────

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
  vendorId: z.string().min(1),
});

// ── GET /admin/products ───────────────────────────────────────────────────────

router.get("/products", requireAdmin, async (req: Request, res: Response) => {
  const parsed = PaginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments({}),
  ]);

  res.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ── POST /admin/products ──────────────────────────────────────────────────────

router.post("/products", requireAdmin, async (req: Request, res: Response) => {
  const parsed = ProductBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { vendorId, ...rest } = parsed.data;
  const product = await Product.create({
    ...rest,
    vendorId: new mongoose.Types.ObjectId(vendorId),
  });
  res.status(201).json({ product });
});

// ── GET /admin/products/:id ───────────────────────────────────────────────────

router.get("/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});

// ── PUT /admin/products/:id ───────────────────────────────────────────────────

router.put("/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const parsed = ProductBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { vendorId, ...rest } = parsed.data;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { ...rest, vendorId: new mongoose.Types.ObjectId(vendorId) },
    { new: true, runValidators: true },
  ).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});

// ── DELETE /admin/products/:id ────────────────────────────────────────────────

router.delete("/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ message: "Product deleted" });
});

// ── GET /admin/orders ─────────────────────────────────────────────────────────

const ListOrdersQuerySchema = PaginationSchema.extend({
  status: z
    .enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
    .optional(),
});

router.get("/orders", requireAdmin, async (req: Request, res: Response) => {
  const parsed = ListOrdersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit, status } = parsed.data;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ── GET /admin/orders/:id ─────────────────────────────────────────────────────

router.get("/orders/:id", requireAdmin, async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
});

// ── PATCH /admin/orders/:id/status ────────────────────────────────────────────

const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "pending_payment", "paid", "processing", "shipped",
    "delivered", "completed", "cancelled",
    "refund_requested", "refunded",
  ]),
});

router.patch("/orders/:id/status", requireAdmin, async (req: Request, res: Response) => {
  const parsed = UpdateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: parsed.data.status },
    { new: true },
  ).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
});

// ── GET /admin/users ──────────────────────────────────────────────────────────

router.get("/users", requireAdmin, async (req: Request, res: Response) => {
  const parsed = PaginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({}),
  ]);

  res.json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ── PATCH /admin/users/:id/role ───────────────────────────────────────────────

const UpdateUserRoleSchema = z.object({
  role: z.enum(["customer", "admin", "vendor"]),
});

router.patch("/users/:id/role", requireAdmin, async (req: Request, res: Response) => {
  const parsed = UpdateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: parsed.data.role },
    { new: true },
  ).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
