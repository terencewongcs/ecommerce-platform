import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiClient';
import type { Product } from '@trendyuniquellc/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsApiResponse {
  products: Product[];
  pagination: Pagination;
}

interface ProductApiResponse {
  product: Product;
}

interface UseProductsParams {
  category?: string;
  page?: number;
  limit?: number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of published products.
 * Accepts optional category, page, and limit filters.
 */
export function useProducts(params: UseProductsParams = {}) {
  const { category, page = 1, limit = 24 } = params;

  return useQuery({
    queryKey: ['products', { category, page, limit }],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (category) qs.set('category', category);
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      return apiFetch<ProductsApiResponse>(`/products?${qs.toString()}`);
    },
  });
}

/**
 * Fetches a single published product by its URL slug.
 * The query is disabled when slug is empty.
 */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiFetch<ProductApiResponse>(`/products/${slug}`),
    enabled: slug.length > 0,
  });
}
