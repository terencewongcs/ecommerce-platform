import { Router, type Router as RouterType, type Request, type Response } from "express";
import { z } from "zod";
import { Product } from "../models/Product.js";

const router: RouterType = Router();

// ── Query schema for GET /products ──────────────────────────────────────────

const ListProductsQuerySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

// ── GET /products ────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  const parsed = ListProductsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
    return;
  }

  const { category, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isPublished: true };
  if (category) {
    filter.category = category;
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ── GET /products/:slug ──────────────────────────────────────────────────────

router.get("/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isPublished: true }).lean();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ product });
});

export default router;
