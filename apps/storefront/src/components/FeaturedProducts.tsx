import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { TAG_STYLES } from '../data/products';
import type { ApiProduct } from '../lib/apiTypes';

export default function FeaturedProducts() {
  const { data, isLoading, isError } = useProducts({ limit: 6 });

  // Silently hide the section if the API errors
  if (isError) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">Hand-Picked</p>
          <h2 className="text-3xl font-light text-brand-black">Featured Products</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-brand-surface mb-4" />
                  <div className="h-2 bg-brand-surface rounded w-1/3 mb-2" />
                  <div className="h-3 bg-brand-surface rounded w-2/3 mb-2" />
                  <div className="h-2 bg-brand-surface rounded w-1/4" />
                </div>
              ))
            : (data?.products as ApiProduct[] ?? []).map((p) => (
                <Link key={String(p._id ?? p.slug)} to={`/products/${p.slug}`} className="group">

                  {/* Image placeholder */}
                  <div className="relative aspect-[3/4] overflow-hidden mb-4">
                    <div
                      className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundColor: '#D4C4B5' }}
                    />
                    {p.tag && (
                      <span
                        className={`absolute top-3 left-3 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 font-semibold ${TAG_STYLES[p.tag]}`}
                      >
                        {p.tag}
                      </span>
                    )}
                  </div>

                  {/* Product info */}
                  <p className="text-[10px] tracking-[0.2em] uppercase text-brand-slate mb-1">{p.brand}</p>
                  <p className="text-sm font-medium text-brand-black group-hover:text-brand-gold transition-colors duration-200 mb-1">
                    {p.name}
                  </p>
                  <p className="text-sm text-brand-black">${p.price}</p>

                </Link>
              ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-14">
          <Link
            to="/products"
            className="inline-block px-12 py-4 border border-brand-black text-brand-black text-xs tracking-[0.25em] uppercase hover:bg-brand-black hover:text-brand-ivory transition-colors duration-200"
          >
            View All Products
          </Link>
        </div>

      </div>
    </section>
  );
}
