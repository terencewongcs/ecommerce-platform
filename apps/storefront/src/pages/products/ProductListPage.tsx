import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductGrid from '../../components/ProductGrid';
import FilterSidebar from '../../components/FilterSidebar';
import SortSelect, { type SortOption } from '../../components/SortSelect';
import { getProductsByCategory } from '../../data/products';
import type { StaticProduct } from '../../data/products';

const CATEGORY_LABELS: Record<string, string> = {
  women: 'Women',
  men: 'Men',
  accessories: 'Accessories',
  'new-arrivals': 'New Arrivals',
  sale: 'Sale',
};

function applyFiltersAndSort(
  products: StaticProduct[],
  selectedSizes: string[],
  selectedPriceRange: string | null,
  sort: SortOption,
): StaticProduct[] {
  let result = [...products];

  // Filter by size
  if (selectedSizes.length > 0) {
    result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
  }

  // Filter by price range
  if (selectedPriceRange) {
    result = result.filter((p) => {
      if (selectedPriceRange === 'under-50') return p.price < 50;
      if (selectedPriceRange === '50-100') return p.price >= 50 && p.price <= 100;
      if (selectedPriceRange === '100-150') return p.price > 100 && p.price <= 150;
      if (selectedPriceRange === '150-plus') return p.price > 150;
      return true;
    });
  }

  // Sort
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  // 'newest' and 'featured' keep the default order from the data file

  return result;
}

export default function ProductListPage() {
  // Extract category from the URL path (e.g. "/women" → "women")
  const { pathname } = useLocation();
  const category = pathname.slice(1) || 'women';

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('featured');

  const base = useMemo(() => getProductsByCategory(category), [category]);

  const products = useMemo(
    () => applyFiltersAndSort(base, selectedSizes, selectedPriceRange, sort),
    [base, selectedSizes, selectedPriceRange, sort],
  );

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }

  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white">

        {/* Page header */}
        <div className="bg-brand-surface py-12 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-2">Collection</p>
          <h1 className="text-3xl font-light text-brand-black">{label}</h1>
          <p className="text-xs text-brand-slate mt-2">{products.length} items</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 flex gap-10">

          {/* Sidebar */}
          <FilterSidebar
            selectedSizes={selectedSizes}
            selectedPriceRange={selectedPriceRange}
            onSizeToggle={toggleSize}
            onPriceRangeSelect={setSelectedPriceRange}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-end mb-6">
              <SortSelect value={sort} onChange={setSort} />
            </div>
            <ProductGrid products={products} />
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
