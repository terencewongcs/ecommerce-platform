import { Router, type Router as RouterType, type Request, type Response } from "express";
import { z } from "zod";
import { Cart } from "../models/Cart.js";
import { requireAuth } from "../middleware/auth.js";

const router: RouterType = Router();

// Validates each item in the cart payload
const CartItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  price: z.number().positive(),
  bg: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().min(1),
});

const PutCartSchema = z.object({
  items: z.array(CartItemSchema),
});

// ── GET /cart ────────────────────────────────────────────────────────────────
// Returns the current user's cart. Returns empty items array if no cart exists yet.

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ userId: req.user!.sub });
  res.json({ items: cart?.items ?? [] });
});

// ── PUT /cart ────────────────────────────────────────────────────────────────
// Full replace — client sends the entire desired cart state.
// Upserts so the first save creates the document.

router.put("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = PutCartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const cart = await Cart.findOneAndUpdate(
    { userId: req.user!.sub },
    { items: parsed.data.items },
    { upsert: true, new: true },
  );

  res.json({ items: cart.items });
});

// ── DELETE /cart ─────────────────────────────────────────────────────────────
// Clears all items from the cart (keeps the document, sets items to []).

router.delete("/", requireAuth, async (req: Request, res: Response) => {
  await Cart.findOneAndUpdate(
    { userId: req.user!.sub },
    { items: [] },
    { upsert: true },
  );
  res.json({ items: [] });
});

export default router;
