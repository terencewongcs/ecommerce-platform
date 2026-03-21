import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductImages from '../../components/ProductImages';
import ProductInfo from '../../components/ProductInfo';
import AddToCartButton from '../../components/AddToCartButton';
import ProductGrid from '../../components/ProductGrid';
import { useProduct, useProducts } from '../../hooks/useProducts';
import { toStaticProduct, type ApiProduct } from '../../lib/apiTypes';

// Sub-component: fetches and renders related products from the same category
function RelatedProducts({ category, excludeSlug }: { category: string; excludeSlug: string }) {
  const { data } = useProducts({ category, limit: 4 });
  const related = (data?.products as ApiProduct[] ?? [])
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, 3)
    .map(toStaticProduct);

  if (related.length === 0) return null;

  return (
    <section className="bg-brand-surface py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-2">You May Also Like</p>
          <h2 className="text-2xl font-light text-brand-black">Related Products</h2>
        </div>
        <ProductGrid products={related} />
      </div>
    </section>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useProduct(slug ?? '');

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    setShowSizeError(false);
  }

  function handleNoSizeSelected() {
    setShowSizeError(true);
    document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 bg-white animate-pulse">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="h-2 bg-brand-surface rounded w-48" />
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="aspect-[3/4] bg-brand-surface" />
              <div className="space-y-4 pt-4">
                <div className="h-2 bg-brand-surface rounded w-1/4" />
                <div className="h-6 bg-brand-surface rounded w-3/4" />
                <div className="h-4 bg-brand-surface rounded w-1/3" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Not found or error state
  if (isError || !data?.product) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-brand-slate text-sm tracking-widest uppercase mb-4">
              Product not found
            </p>
            <Link
              to="/women"
              className="text-xs tracking-[0.25em] uppercase border border-brand-black px-8 py-3 hover:bg-brand-black hover:text-brand-ivory transition-colors duration-200"
            >
              Back to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const product = toStaticProduct(data.product as ApiProduct);
  const relatedCategory = product.category[0] ?? 'women';

  return (
    <>
      <Navbar />
      <main className="pt-16 bg-white">

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-brand-slate">
            <Link to="/" className="hover:text-brand-black transition-colors duration-150">Home</Link>
            <span>/</span>
            <Link
              to={`/${relatedCategory}`}
              className="hover:text-brand-black transition-colors duration-150 capitalize"
            >
              {relatedCategory.replace('-', ' ')}
            </Link>
            <span>/</span>
            <span className="text-brand-black">{product.name}</span>
          </nav>
        </div>

        {/* Product layout */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Left: images */}
            <ProductImages name={product.name} bg={product.bg} />

            {/* Right: info + actions */}
            <div id="size-selector">
              <ProductInfo
                product={product}
                selectedSize={selectedSize}
                onSizeSelect={handleSizeSelect}
              />
              {showSizeError && (
                <p className="text-xs text-brand-rose mb-4">Please select a size before adding to bag.</p>
              )}
              <AddToCartButton
                product={product}
                selectedSize={selectedSize}
                onNoSizeSelected={handleNoSizeSelected}
              />
            </div>

          </div>
        </div>

        {/* Related products */}
        <RelatedProducts category={relatedCategory} excludeSlug={slug ?? ''} />

      </main>
      <Footer />
    </>
  );
}
