import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export type AdminStats = {
  products: { total: number; published: number };
  orders: { total: number };
  users: { total: number };
  revenue: { total: number };
  ordersByStatus: Array<{ _id: string; count: number }>;
  dailyRevenue: Array<{ _id: string; revenue: number; orders: number }>;
};
