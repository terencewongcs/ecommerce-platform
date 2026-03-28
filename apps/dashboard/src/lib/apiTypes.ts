// Re-export all shared API types from the monorepo types package.
// Components should import from here rather than directly from @trendyuniquellc/types,
// so this file remains the single import point for the dashboard.
export type {
  UserRole,
  ApiUser,
  OrderStatus,
  ApiOrderItem,
  ApiShippingAddress,
  ApiOrder,
  Pagination,
  AdminStats,
} from "@trendyuniquellc/types";

// ApiProduct uses _id (raw Mongoose response) rather than the domain id field.
// Defined locally since it reflects the raw API wire format, not the shared domain type.
export type ApiProduct = {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  category: string[];
  sizes: string[];
  tag: 'New' | 'Sale' | 'Bestseller' | null;
  isPublished: boolean;
  vendorId: string;
  createdAt: string;
  updatedAt: string;
};
