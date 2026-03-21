import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductGrid from '../../components/ProductGrid';
import { searchProducts } from '../../data/products';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const results = useMemo(() => (query.trim() ? searchProducts(query) : []), [query]);

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
                {results.length === 0
                  ? `No results for "${query}"`
                  : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
              </p>
              {results.length === 0 ? (
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
