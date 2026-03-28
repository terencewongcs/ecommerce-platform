import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().min(1),
  brand: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  images: z.array(z.string().url()),
  stock: z.number().int().nonnegative(),
  category: z.array(z.enum(["women", "men", "accessories", "new-arrivals", "sale"])),
  sizes: z.array(z.string()),
  tag: z.enum(["New", "Sale", "Bestseller"]).nullable().optional(),
  vendorId: z.string(),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
