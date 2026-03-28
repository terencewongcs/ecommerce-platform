import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  price: z.number().positive(),
  bg: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().min(1),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const UpdateCartSchema = z.object({
  items: z.array(CartItemSchema),
});

export type UpdateCartInput = z.infer<typeof UpdateCartSchema>;
