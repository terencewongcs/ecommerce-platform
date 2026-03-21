import type { StaticProduct, Category, ProductTag } from '../data/products';

// Full shape of a product as returned by the API.
// The shared @trendyuniquellc/types Product type is incomplete (missing brand, category, etc.)
export type ApiProduct = {
  _id?: string;
  id?: string;
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

// Placeholder background color per category (used until real product images are set up)
const CATEGORY_BG: Record<string, string> = {
  women: '#D4BFB5',
  men: '#B0BEC8',
  accessories: '#C8BFA5',
  'new-arrivals': '#B5C4B5',
  sale: '#C4B0B5',
};

/** Maps an API product to the StaticProduct shape expected by UI components */
export function toStaticProduct(p: ApiProduct): StaticProduct {
  const firstCategory = p.category?.[0] ?? '';
  return {
    id: String(p._id ?? p.id ?? p.slug),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    description: p.description,
    price: p.price,
    // exactOptionalPropertyTypes: only include when the value is present
    ...(p.originalPrice !== undefined ? { originalPrice: p.originalPrice } : {}),
    category: p.category as Category[],
    sizes: p.sizes,
    bg: CATEGORY_BG[firstCategory] ?? '#D4C4B5',
    tag: p.tag as ProductTag,
  };
}
