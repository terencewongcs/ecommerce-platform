// src/vercel.ts
import "dotenv/config";

// src/lib/mongoose.ts
import mongoose from "mongoose";

// src/lib/env.ts
import { z } from "zod";
var EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
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
  STOREFRONT_URL: z.string().url().default("http://localhost:3000")
});
var env = EnvSchema.parse(process.env);

// src/lib/mongoose.ts
async function connectDB() {
  if (global.__mongooseConn && mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(env.MONGODB_URI);
  global.__mongooseConn = mongoose;
}

// src/app.ts
import express from "express";

// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ../../packages/types/dist/product.js
import { z as z2 } from "zod";
var ProductSchema = z2.object({
  id: z2.string(),
  slug: z2.string(),
  name: z2.string().min(1),
  brand: z2.string().min(1),
  description: z2.string(),
  price: z2.number().positive(),
  originalPrice: z2.number().positive().optional(),
  images: z2.array(z2.string().url()),
  stock: z2.number().int().nonnegative(),
  category: z2.array(z2.enum(["women", "men", "accessories", "new-arrivals", "sale"])),
  sizes: z2.array(z2.string()),
  tag: z2.enum(["New", "Sale", "Bestseller"]).nullable().optional(),
  vendorId: z2.string(),
  isPublished: z2.boolean(),
  createdAt: z2.string().datetime(),
  updatedAt: z2.string().datetime()
});
var CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var UpdateProductSchema = CreateProductSchema.partial();

// ../../packages/types/dist/auth.js
import { z as z3 } from "zod";
var RegisterSchema = z3.object({
  email: z3.string().email("Please enter a valid email"),
  password: z3.string().min(8, "Password must be at least 8 characters"),
  firstName: z3.string().min(1, "First name is required"),
  lastName: z3.string().min(1, "Last name is required")
});
var LoginSchema = z3.object({
  email: z3.string().email("Please enter a valid email"),
  password: z3.string().min(1, "Password is required")
});
var VendorRegisterSchema = z3.object({
  email: z3.string().email("Please enter a valid email"),
  password: z3.string().min(8, "Password must be at least 8 characters"),
  firstName: z3.string().min(1, "First name is required"),
  lastName: z3.string().min(1, "Last name is required"),
  storeName: z3.string().min(1, "Store name is required")
});

// ../../packages/types/dist/account.js
import { z as z4 } from "zod";
var UpdateProfileSchema = z4.object({
  firstName: z4.string().min(1, "First name is required"),
  lastName: z4.string().min(1, "Last name is required")
});
var ConfirmPasswordSchema = z4.object({
  token: z4.string().min(1),
  newPassword: z4.string().min(8, "Password must be at least 8 characters")
});
var ResetPasswordFormSchema = z4.object({
  newPassword: z4.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z4.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// ../../packages/types/dist/cart.js
import { z as z5 } from "zod";
var CartItemSchema = z5.object({
  productId: z5.string().min(1),
  slug: z5.string().min(1),
  name: z5.string().min(1),
  brand: z5.string().min(1),
  price: z5.number().positive(),
  bg: z5.string().min(1),
  size: z5.string().min(1),
  quantity: z5.number().int().min(1)
});
var UpdateCartSchema = z5.object({
  items: z5.array(CartItemSchema)
});

// ../../packages/types/dist/user.js
import { z as z6 } from "zod";
var UserRoleSchema = z6.enum(["customer", "admin", "vendor"]);
var ApiUserSchema = z6.object({
  _id: z6.string(),
  email: z6.string().email(),
  firstName: z6.string(),
  lastName: z6.string(),
  role: UserRoleSchema,
  createdAt: z6.string().datetime(),
  updatedAt: z6.string().datetime()
});

// ../../packages/types/dist/order.js
import { z as z7 } from "zod";
var OrderStatusSchema = z7.enum([
  "pending_payment",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded"
]);
var ApiOrderItemSchema = z7.object({
  productId: z7.string(),
  slug: z7.string(),
  name: z7.string(),
  brand: z7.string(),
  size: z7.string(),
  quantity: z7.number().int().positive(),
  unitPrice: z7.number().positive()
});
var ApiShippingAddressSchema = z7.object({
  firstName: z7.string(),
  lastName: z7.string(),
  address: z7.string(),
  city: z7.string(),
  zip: z7.string()
});
var ApiOrderSchema = z7.object({
  _id: z7.string(),
  userId: z7.string(),
  items: z7.array(ApiOrderItemSchema),
  status: OrderStatusSchema,
  shippingAddress: ApiShippingAddressSchema,
  subtotal: z7.number(),
  tax: z7.number(),
  shippingCost: z7.number(),
  total: z7.number(),
  stripePaymentIntentId: z7.string(),
  trackingNumber: z7.string().optional(),
  carrier: z7.string().optional(),
  shippedAt: z7.string().datetime().optional(),
  refundReason: z7.string().optional(),
  createdAt: z7.string().datetime(),
  updatedAt: z7.string().datetime()
});
var CreateOrderSchema = z7.object({
  shippingAddress: ApiShippingAddressSchema,
  idempotencyKey: z7.string().uuid()
});

// ../../packages/types/dist/common.js
import { z as z8 } from "zod";
var PaginationSchema = z8.object({
  page: z8.number().int().positive(),
  limit: z8.number().int().positive(),
  total: z8.number().int().nonnegative(),
  totalPages: z8.number().int().nonnegative()
});

// src/models/User.ts
import mongoose2, { Schema } from "mongoose";
var UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["customer", "admin", "vendor"], default: "customer" },
    refreshTokenHashes: { type: [String], default: [] },
    // select: false — never returned in API responses unless explicitly requested
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiry: { type: Date, default: null, select: false }
  },
  { timestamps: true }
);
UserSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.refreshTokenHashes;
    delete ret.__v;
    return ret;
  }
});
var User = mongoose2.model("User", UserSchema);

// src/models/VendorProfile.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var VendorProfileSchema = new Schema2(
  {
    userId: {
      type: Schema2.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
      // one vendor profile per user
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);
var VendorProfile = mongoose3.model("VendorProfile", VendorProfileSchema);

// src/routes/auth.ts
var router = Router();
var BCRYPT_ROUNDS = 12;
var REFRESH_COOKIE = "refreshToken";
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
}
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
}
function parseDurationMs(duration) {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  if (unit === "d") return value * 24 * 60 * 60 * 1e3;
  if (unit === "h") return value * 60 * 60 * 1e3;
  if (unit === "m") return value * 60 * 1e3;
  return value * 1e3;
}
function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    // JS cannot read this cookie
    secure: env.NODE_ENV === "production",
    // HTTPS only in production
    sameSite: "strict",
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
    path: "/auth"
    // only sent to /auth/* endpoints
  });
}
router.post("/register", async (req, res) => {
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
  const accessPayload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };
  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(user.id);
  const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(user.id, { $push: { refreshTokenHashes: refreshHash } });
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
});
router.post("/vendor-register", async (req, res) => {
  const parsed = VendorRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { email, password, firstName, lastName, storeName } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const session = await User.startSession();
  let user;
  try {
    const created = await session.withTransaction(async () => {
      const docs = await User.create(
        [{ email, passwordHash, firstName, lastName, role: "vendor" }],
        { session }
      );
      const doc = docs[0];
      if (!doc) throw new Error("User creation returned empty array");
      await VendorProfile.create([{ userId: doc._id, storeName }], { session });
      return doc;
    });
    user = created;
  } finally {
    await session.endSession();
  }
  const accessPayload = {
    sub: user.id,
    email: user.email,
    role: "vendor"
  };
  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(user.id);
  const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(user.id, { $push: { refreshTokenHashes: refreshHash } });
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
});
router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).select("+passwordHash +refreshTokenHashes");
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const accessPayload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };
  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(user.id);
  const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(user.id, { $push: { refreshTokenHashes: refreshHash } });
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }
  const user = await User.findById(payload.sub).select("+refreshTokenHashes");
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  let matchedHash = null;
  for (const hash of user.refreshTokenHashes) {
    if (await bcrypt.compare(token, hash)) {
      matchedHash = hash;
      break;
    }
  }
  if (!matchedHash) {
    await User.findByIdAndUpdate(user.id, { $set: { refreshTokenHashes: [] } });
    res.status(401).json({ error: "Refresh token reuse detected" });
    return;
  }
  const newRefreshToken = signRefreshToken(user.id);
  const newRefreshHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(user.id, { $pull: { refreshTokenHashes: matchedHash } });
  await User.findByIdAndUpdate(user.id, { $push: { refreshTokenHashes: newRefreshHash } });
  const accessPayload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };
  setRefreshCookie(res, newRefreshToken);
  res.json({ accessToken: signAccessToken(accessPayload), user });
});
router.post("/logout", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
      const user = await User.findById(payload.sub).select("+refreshTokenHashes");
      if (user) {
        for (const hash of user.refreshTokenHashes) {
          if (await bcrypt.compare(token, hash)) {
            await User.findByIdAndUpdate(user.id, { $pull: { refreshTokenHashes: hash } });
            break;
          }
        }
      }
    } catch {
    }
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  res.json({ message: "Logged out" });
});
var auth_default = router;

// src/routes/products.ts
import { Router as Router2 } from "express";
import { z as z9 } from "zod";

// src/models/Product.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var ProductSchema2 = new Schema3(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: {
      type: [String],
      enum: ["women", "men", "accessories", "new-arrivals", "sale"],
      default: []
    },
    sizes: { type: [String], default: [] },
    tag: {
      type: String,
      enum: ["New", "Sale", "Bestseller", null],
      default: null
    },
    isPublished: { type: Boolean, default: false },
    vendorId: { type: Schema3.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);
ProductSchema2.index({ slug: 1 });
ProductSchema2.index({ category: 1, isPublished: 1 });
var Product = mongoose4.model("Product", ProductSchema2);

// src/routes/products.ts
var router2 = Router2();
var ListProductsQuerySchema = z9.object({
  category: z9.string().optional(),
  page: z9.coerce.number().int().positive().default(1),
  limit: z9.coerce.number().int().min(1).max(100).default(24)
});
router2.get("/", async (req, res) => {
  const parsed = ListProductsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
    return;
  }
  const { category, page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const filter = { isPublished: true };
  if (category) {
    filter.category = category;
  }
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter)
  ]);
  res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
router2.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug, isPublished: true }).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});
var products_default = router2;

// src/routes/admin.ts
import { Router as Router3 } from "express";
import { z as z10 } from "zod";
import mongoose6 from "mongoose";

// src/models/Order.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var OrderItemSchema = new Schema4(
  {
    productId: { type: Schema4.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
  // sub-documents don't need their own _id
);
var ShippingAddressSchema = new Schema4(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true }
  },
  { _id: false }
);
var OrderSchema = new Schema4(
  {
    userId: { type: Schema4.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    status: {
      type: String,
      enum: ["pending_payment", "paid", "shipped", "delivered", "cancelled", "refund_requested", "refunded"],
      default: "pending_payment"
    },
    stripePaymentIntentId: { type: String, required: true },
    trackingNumber: { type: String },
    carrier: { type: String },
    shippedAt: { type: Date },
    refundReason: { type: String },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ stripePaymentIntentId: 1 }, { unique: true });
var Order = mongoose5.model("Order", OrderSchema);

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt2.verify(token, env.JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}
function requireVendor(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "vendor") {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    next();
  });
}

// src/routes/admin.ts
var router3 = Router3();
var PaginationSchema2 = z10.object({
  page: z10.coerce.number().int().positive().default(1),
  limit: z10.coerce.number().int().min(1).max(100).default(20)
});
router3.get("/stats", requireAdmin, async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
  const [
    totalProducts,
    publishedProducts,
    totalOrders,
    totalUsers,
    revenueResult,
    ordersByStatus,
    dailyRevenue
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
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  res.json({
    products: { total: totalProducts, published: publishedProducts },
    orders: { total: totalOrders },
    users: { total: totalUsers },
    revenue: { total: revenueResult[0]?.total ?? 0 },
    ordersByStatus,
    dailyRevenue
  });
});
var ProductBodySchema = z10.object({
  slug: z10.string().min(1),
  name: z10.string().min(1),
  brand: z10.string().min(1),
  description: z10.string().min(1),
  price: z10.number().min(0),
  originalPrice: z10.number().min(0).optional(),
  images: z10.array(z10.string()).default([]),
  stock: z10.number().int().min(0),
  category: z10.array(z10.enum(["women", "men", "accessories", "new-arrivals", "sale"])),
  sizes: z10.array(z10.string()).default([]),
  tag: z10.enum(["New", "Sale", "Bestseller"]).nullable().default(null),
  isPublished: z10.boolean().default(false),
  vendorId: z10.string().min(1)
});
router3.get("/products", requireAdmin, async (req, res) => {
  const parsed = PaginationSchema2.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments({})
  ]);
  res.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
router3.post("/products", requireAdmin, async (req, res) => {
  const parsed = ProductBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { vendorId, ...rest } = parsed.data;
  const product = await Product.create({
    ...rest,
    vendorId: new mongoose6.Types.ObjectId(vendorId)
  });
  res.status(201).json({ product });
});
router3.get("/products/:id", requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});
router3.put("/products/:id", requireAdmin, async (req, res) => {
  const parsed = ProductBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { vendorId, ...rest } = parsed.data;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { ...rest, vendorId: new mongoose6.Types.ObjectId(vendorId) },
    { new: true, runValidators: true }
  ).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});
router3.delete("/products/:id", requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ message: "Product deleted" });
});
var ListOrdersQuerySchema = PaginationSchema2.extend({
  status: z10.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional()
});
router3.get("/orders", requireAdmin, async (req, res) => {
  const parsed = ListOrdersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit, status } = parsed.data;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);
  res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
router3.get("/orders/:id", requireAdmin, async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
});
var UpdateOrderStatusSchema = z10.object({
  status: z10.enum([
    "pending_payment",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
    "refund_requested",
    "refunded"
  ])
});
router3.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  const parsed = UpdateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: parsed.data.status },
    { new: true }
  ).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
});
router3.get("/users", requireAdmin, async (req, res) => {
  const parsed = PaginationSchema2.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({})
  ]);
  res.json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
var UpdateUserRoleSchema = z10.object({
  role: z10.enum(["customer", "admin", "vendor"])
});
router3.patch("/users/:id/role", requireAdmin, async (req, res) => {
  const parsed = UpdateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: parsed.data.role },
    { new: true }
  ).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});
var admin_default = router3;

// src/routes/vendor.ts
import { Router as Router4 } from "express";
import multer from "multer";
import { z as z11 } from "zod";
import mongoose7 from "mongoose";

// src/lib/stripe.ts
import Stripe from "stripe";
var stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true
});

// src/lib/email.ts
import { Resend } from "resend";
async function sendPasswordResetEmail(to, firstName, resetUrl) {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set \u2014 skipping send. Reset URL: ${resetUrl}`);
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
        If you didn't request this, you can safely ignore this email \u2014 your password won't change.
      </p>
    </div>
  </body>
</html>`
  });
}
async function sendOrderConfirmationEmail(to, firstName, order) {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set \u2014 skipping order confirmation for order ${order.id}`);
    return;
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const itemsHtml = order.items.map(
    (item) => `<tr>
          <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a;">${item.name}</td>
          <td style="padding: 8px 0; font-size: 13px; color: #6b6b6b; text-align: center;">\xD7${item.quantity}</td>
          <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; text-align: right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
        </tr>`
  ).join("");
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
</html>`
  });
}
async function sendRefundConfirmationEmail(to, firstName, orderId, refundReason) {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set \u2014 skipping refund confirmation for order ${orderId}`);
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
        Your refund has been approved and processed. The amount will be returned to your original payment method within 5\u201310 business days.
      </p>
      ${refundReason ? `<p style="font-size: 13px; line-height: 1.6; color: #9b9b9b; margin: 0 0 0; border-left: 2px solid #e8e4df; padding-left: 16px;">
        Reason: ${refundReason}
      </p>` : ""}
    </div>
  </body>
</html>`
  });
}

// src/lib/r2.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
var s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});
async function uploadProductImage(buffer, mimeType, originalName, vendorId) {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `products/${vendorId}/${randomUUID()}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType
    })
  );
  return `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}

// src/routes/vendor.ts
var router4 = Router4();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
var PaginationSchema3 = z11.object({
  page: z11.coerce.number().int().positive().default(1),
  limit: z11.coerce.number().int().min(1).max(100).default(20)
});
var ProductBodySchema2 = z11.object({
  slug: z11.string().min(1),
  name: z11.string().min(1),
  brand: z11.string().min(1),
  description: z11.string().min(1),
  price: z11.number().min(0),
  originalPrice: z11.number().min(0).optional(),
  images: z11.array(z11.string()).default([]),
  stock: z11.number().int().min(0),
  category: z11.array(z11.enum(["women", "men", "accessories", "new-arrivals", "sale"])),
  sizes: z11.array(z11.string()).default([]),
  tag: z11.enum(["New", "Sale", "Bestseller"]).nullable().default(null),
  isPublished: z11.boolean().default(false)
});
router4.get("/stats", requireVendor, async (req, res) => {
  const vendorId = new mongoose7.Types.ObjectId(req.user.sub);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
  const vendorProductIds = await Product.find({ vendorId }).distinct("_id");
  const orderFilter = { "items.productId": { $in: vendorProductIds } };
  const [totalProducts, publishedProducts, totalOrders, revenueResult, dailyRevenue] = await Promise.all([
    Product.countDocuments({ vendorId }),
    Product.countDocuments({ vendorId, isPublished: true }),
    Order.countDocuments(orderFilter),
    // Sum unitPrice * quantity for this vendor's items only
    Order.aggregate([
      { $match: orderFilter },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: vendorProductIds } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } } } }
    ]),
    // Daily revenue: group by date+orderId first to count distinct orders, then sum by date
    Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, ...orderFilter } },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: vendorProductIds } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orderId: "$_id"
          },
          revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          revenue: { $sum: "$revenue" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  res.json({
    products: { total: totalProducts, published: publishedProducts },
    orders: { total: totalOrders },
    revenue: { total: revenueResult[0]?.total ?? 0 },
    dailyRevenue
  });
});
router4.post(
  "/images/upload",
  requireVendor,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }
    const url = await uploadProductImage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.sub
    );
    res.json({ url });
  }
);
router4.get("/products", requireVendor, async (req, res) => {
  const parsed = PaginationSchema3.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const vendorId = req.user.sub;
  const [products, total] = await Promise.all([
    Product.find({ vendorId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments({ vendorId })
  ]);
  res.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
router4.post("/products", requireVendor, async (req, res) => {
  const parsed = ProductBodySchema2.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const product = await Product.create({
    ...parsed.data,
    vendorId: new mongoose7.Types.ObjectId(req.user.sub)
  });
  res.status(201).json({ product });
});
router4.get("/products/:id", requireVendor, async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    vendorId: req.user.sub
  }).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});
router4.put("/products/:id", requireVendor, async (req, res) => {
  const parsed = ProductBodySchema2.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user.sub },
    parsed.data,
    { new: true, runValidators: true }
  ).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});
router4.delete("/products/:id", requireVendor, async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    vendorId: req.user.sub
  });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ message: "Product deleted" });
});
router4.get("/orders", requireVendor, async (req, res) => {
  const parsed = PaginationSchema3.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const vendorProductIds = await Product.find({
    vendorId: new mongoose7.Types.ObjectId(req.user.sub)
  }).distinct("_id");
  const filter = { "items.productId": { $in: vendorProductIds } };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);
  res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
router4.get("/orders/:id", requireVendor, async (req, res) => {
  const vendorProductIds = await Product.find({
    vendorId: new mongoose7.Types.ObjectId(req.user.sub)
  }).distinct("_id");
  const order = await Order.findOne({
    _id: req.params.id,
    "items.productId": { $in: vendorProductIds }
  }).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
});
var UpdateOrderStatusSchema2 = z11.object({
  // Vendors can ship orders or approve refunds (cancelled = refund approved)
  status: z11.enum(["shipped", "cancelled"]),
  // Required when status is "shipped"
  trackingNumber: z11.string().min(1).optional(),
  carrier: z11.string().min(1).optional()
}).refine(
  (data) => data.status !== "shipped" || Boolean(data.trackingNumber) && Boolean(data.carrier),
  { message: "trackingNumber and carrier are required when status is shipped" }
);
router4.patch("/orders/:id/status", requireVendor, async (req, res) => {
  const parsed = UpdateOrderStatusSchema2.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const vendorProductIds = await Product.find({
    vendorId: new mongoose7.Types.ObjectId(req.user.sub)
  }).distinct("_id");
  const order = await Order.findOne({
    _id: req.params.id,
    "items.productId": { $in: vendorProductIds }
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const { status, trackingNumber, carrier } = parsed.data;
  if (status === "cancelled") {
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
    order.status = "cancelled";
    await order.save();
    try {
      const user = await User.findById(order.userId).lean();
      if (user) {
        await sendRefundConfirmationEmail(
          user.email,
          user.firstName,
          order._id.toString(),
          order.refundReason ?? ""
        );
      }
    } catch (emailErr) {
      console.error("[vendor] Failed to send refund confirmation email:", emailErr);
    }
    res.json({ order });
    return;
  }
  const update = { status };
  if (status === "shipped") {
    update.trackingNumber = trackingNumber;
    update.carrier = carrier;
    update.shippedAt = /* @__PURE__ */ new Date();
  }
  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true }
  ).lean();
  res.json({ order: updatedOrder });
});
var vendor_default = router4;

// src/routes/account.ts
import { Router as Router5 } from "express";
import crypto from "crypto";
import bcrypt2 from "bcrypt";
var router5 = Router5();
var BCRYPT_ROUNDS2 = 12;
var RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1e3;
router5.patch("/profile", requireAuth, async (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { firstName: parsed.data.firstName, lastName: parsed.data.lastName },
    { new: true }
  ).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});
router5.post("/change-password/request", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await user.save();
  const resetUrl = `${env.STOREFRONT_URL}/account/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
  res.json({ message: "Reset link sent. Check your inbox \u2014 it expires in 1 hour." });
});
router5.post("/change-password/confirm", async (req, res) => {
  const parsed = ConfirmPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { token, newPassword } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiry: { $gt: /* @__PURE__ */ new Date() }
  }).select("+passwordResetTokenHash +passwordResetExpiry");
  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
    return;
  }
  user.passwordHash = await bcrypt2.hash(newPassword, BCRYPT_ROUNDS2);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiry = null;
  user.refreshTokenHashes = [];
  await user.save();
  res.json({ message: "Password updated successfully. Please log in with your new password." });
});
var account_default = router5;

// src/routes/cart.ts
import { Router as Router6 } from "express";

// src/models/Cart.ts
import mongoose8, { Schema as Schema5 } from "mongoose";
var CartItemSchema2 = new Schema5(
  {
    productId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    bg: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
  // sub-documents don't need their own _id
);
var CartSchema = new Schema5(
  {
    userId: { type: Schema5.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema2], default: [] }
  },
  { timestamps: true }
);
var Cart = mongoose8.model("Cart", CartSchema);

// src/routes/cart.ts
var router6 = Router6();
router6.get("/", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.sub });
  res.json({ items: cart?.items ?? [] });
});
router6.put("/", requireAuth, async (req, res) => {
  const parsed = UpdateCartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const cart = await Cart.findOneAndUpdate(
    { userId: req.user.sub },
    { items: parsed.data.items },
    { upsert: true, new: true }
  );
  res.json({ items: cart.items });
});
router6.delete("/", requireAuth, async (req, res) => {
  await Cart.findOneAndUpdate(
    { userId: req.user.sub },
    { items: [] },
    { upsert: true }
  );
  res.json({ items: [] });
});
var cart_default = router6;

// src/routes/orders.ts
import { Router as Router7 } from "express";
import { z as z12 } from "zod";
import mongoose9 from "mongoose";
var router7 = Router7();
var PaginationSchema4 = z12.object({
  page: z12.coerce.number().int().positive().default(1),
  limit: z12.coerce.number().int().min(1).max(100).default(20)
});
var RefundRequestSchema = z12.object({
  reason: z12.string().min(1).max(500)
});
router7.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing Stripe signature" });
    return;
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid Stripe signature" });
    return;
  }
  console.log("!!!!!!event.type", event.type);
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    try {
      const order = await Order.findOneAndUpdate(
        { stripePaymentIntentId: pi.id, status: "pending_payment" },
        { $set: { status: "paid" } },
        { new: true }
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
                unitPrice: item.unitPrice
              })),
              subtotal: order.subtotal,
              tax: order.tax,
              shippingCost: order.shippingCost,
              total: order.total
            });
          } catch (emailErr) {
            console.error("[webhook] Failed to send order confirmation email:", emailErr);
          }
        }
      }
    } catch (dbErr) {
      console.error("[webhook] DB error on payment_intent.succeeded:", dbErr);
      res.status(500).json({ error: "Internal error" });
      return;
    }
  }
  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (paymentIntentId) {
      try {
        await Order.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntentId, status: "cancelled" },
          { $set: { status: "refunded" } }
        );
      } catch (dbErr) {
        console.error("[webhook] DB error on charge.refunded:", dbErr);
        res.status(500).json({ error: "Internal error" });
        return;
      }
    }
  }
  res.json({ received: true });
});
router7.post("/", requireAuth, async (req, res) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { shippingAddress, idempotencyKey } = parsed.data;
  const cart = await Cart.findOne({ userId: req.user.sub }).lean();
  if (!cart || cart.items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }
  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isPublished: true
  }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  for (const item of cart.items) {
    if (!productMap.has(item.productId)) {
      res.status(400).json({ error: `Product ${item.productId} is unavailable` });
      return;
    }
  }
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + productMap.get(item.productId).price * item.quantity;
  }, 0);
  const subtotalRounded = Math.round(subtotal * 100) / 100;
  const tax = Math.round(subtotalRounded * 0.08 * 100) / 100;
  const shippingCost = subtotalRounded >= 150 ? 0 : 12;
  const total = Math.round((subtotalRounded + tax + shippingCost) * 100) / 100;
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: Math.round(total * 100),
      // Stripe requires integer cents
      currency: "usd",
      metadata: { userId: req.user.sub }
    },
    { idempotencyKey }
  );
  const session = await mongoose9.startSession();
  let createdOrderId;
  try {
    await session.withTransaction(async () => {
      for (const item of cart.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );
        if (!updated) {
          const err = new Error(`Insufficient stock for ${item.name}`);
          err.status = 409;
          throw err;
        }
      }
      const orderItems = cart.items.map((item) => ({
        productId: new mongoose9.Types.ObjectId(item.productId),
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        size: item.size,
        quantity: item.quantity,
        unitPrice: productMap.get(item.productId).price
      }));
      const docs = await Order.create(
        [
          {
            userId: new mongoose9.Types.ObjectId(req.user.sub),
            items: orderItems,
            status: "pending_payment",
            shippingAddress,
            subtotal: subtotalRounded,
            tax,
            shippingCost,
            total,
            stripePaymentIntentId: paymentIntent.id
          }
        ],
        { session }
      );
      createdOrderId = docs[0]._id.toString();
    });
  } catch (err) {
    const e = err;
    if (e.status === 409) {
      res.status(409).json({ error: e.message });
      return;
    }
    throw err;
  } finally {
    await session.endSession();
  }
  await Cart.findOneAndUpdate({ userId: req.user.sub }, { $set: { items: [] } });
  res.status(201).json({
    clientSecret: paymentIntent.client_secret,
    orderId: createdOrderId
  });
});
router7.get("/", requireAuth, async (req, res) => {
  const parsed = PaginationSchema4.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const userId = new mongoose9.Types.ObjectId(req.user.sub);
  const [orders, total] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments({ userId })
  ]);
  res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
router7.get("/:id", requireAuth, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user.sub
  }).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
});
router7.post("/:id/cancel", requireAuth, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user.sub
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "pending_payment" && order.status !== "paid") {
    res.status(409).json({ error: "Only pending_payment or paid orders can be cancelled" });
    return;
  }
  const session = await mongoose9.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { session }
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
router7.post("/:id/refund-request", requireAuth, async (req, res) => {
  const parsed = RefundRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user.sub,
      status: "paid"
    },
    {
      $set: { status: "refund_requested", refundReason: parsed.data.reason }
    },
    { new: true }
  ).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found or not eligible for refund request" });
    return;
  }
  res.json({ order });
});
router7.patch("/:id/deliver", requireAuth, async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.sub, status: "shipped" },
    { $set: { status: "delivered" } },
    { new: true }
  ).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found or not in shipped status" });
    return;
  }
  res.json({ order });
});
var orders_default = router7;

// src/app.ts
var app = express();
app.use("/orders/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use((req, _res, next) => {
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
var ALLOWED_ORIGINS = env.NODE_ENV === "production" ? ["https://trendyunique.org", env.DASHBOARD_URL ?? ""].filter(Boolean) : ["http://localhost:3000", "http://localhost:5173", "http://localhost:3002"];
app.use((req, res, next) => {
  const origin = req.headers.origin ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
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
app.use("/auth", auth_default);
app.use("/products", products_default);
app.use("/admin", admin_default);
app.use("/vendor", vendor_default);
app.use("/account", account_default);
app.use("/cart", cart_default);
app.use("/orders", orders_default);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? 500;
  const message = env.NODE_ENV === "production" ? "Internal server error" : String(err);
  res.status(status).json({ error: message });
});
var app_default = app;

// src/vercel.ts
connectDB().catch(console.error);
var vercel_default = app_default;
export {
  vercel_default as default
};
