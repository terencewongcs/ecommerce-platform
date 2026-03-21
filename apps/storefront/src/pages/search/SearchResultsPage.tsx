import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductGrid from '../../components/ProductGrid';
import { useProducts } from '../../hooks/useProducts';
import { toStaticProduct, type ApiProduct } from '../../lib/apiTypes';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  // Fetch all products and filter client-side (backend has no search endpoint yet)
  const { data, isLoading } = useProducts({ limit: 100 });

  const results = useMemo(() => {
    if (!query.trim() || !data) return [];
    const q = query.toLowerCase();
    return (data.products as ApiProduct[])
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
      .map(toStaticProduct);
  }, [query, data]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const value = (form.elements.namedItem('q') as HTMLInputElement).value.trim();
    setSearchParams(value ? { q: value } : {});
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white">

        {/* Search header */}
        <div className="bg-brand-surface py-10">
          <div className="max-w-xl mx-auto px-6">
            <form onSubmit={handleSubmit} className="flex border border-brand-black bg-white">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search products…"
                className="flex-1 px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 text-[10px] tracking-[0.25em] uppercase text-brand-black hover:bg-brand-black hover:text-brand-ivory transition-colors duration-200"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {query ? (
            <>
              <p className="text-xs text-brand-slate tracking-wide mb-8">
                {isLoading
                  ? 'Searching…'
                  : results.length === 0
                  ? `No results for "${query}"`
                  : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
              </p>

              {isLoading ? (
                // Loading skeleton
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-brand-surface mb-4" />
                      <div className="h-2 bg-brand-surface rounded w-1/3 mb-2" />
                      <div className="h-3 bg-brand-surface rounded w-2/3 mb-2" />
                      <div className="h-2 bg-brand-surface rounded w-1/4" />
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-brand-slate text-sm tracking-widest uppercase mb-6">
                    We couldn't find what you're looking for
                  </p>
                  <Link
                    to="/women"
                    className="text-xs tracking-[0.25em] uppercase border border-brand-black px-8 py-3 hover:bg-brand-black hover:text-brand-ivory transition-colors duration-200"
                  >
                    Browse All Products
                  </Link>
                </div>
              ) : (
                <ProductGrid products={results} />
              )}
            </>
          ) : (
            <p className="text-xs text-brand-slate text-center py-16 tracking-widest uppercase">
              Enter a search term above
            </p>
          )}
        </div>

      </main>
      <Footer />
    </>
  );
}
