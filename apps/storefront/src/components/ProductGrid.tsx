import { Link } from 'react-router-dom';
import type { StaticProduct } from '../data/products';
import { TAG_STYLES } from '../data/products';

type Props = {
  products: StaticProduct[];
};

export default function ProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-brand-slate text-sm tracking-widest uppercase mb-2">No products found</p>
        <p className="text-brand-black/40 text-xs">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
      {products.map(({ id, slug, name, brand, price, originalPrice, bg, images, tag }) => (
        <Link key={id} to={`/products/${slug}`} className="group">

          {/* Product image — real photo if available, color placeholder otherwise */}
          <div className="relative aspect-[3/4] overflow-hidden mb-4">
            {images?.[0] ? (
              <img
                src={images[0]}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundColor: bg }}
              />
            )}
            {tag && (
              <span
                className={`absolute top-3 left-3 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 font-semibold ${TAG_STYLES[tag]}`}
              >
                {tag}
              </span>
            )}
          </div>

          {/* Product info */}
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand-slate mb-1">{brand}</p>
          <p className="text-sm font-medium text-brand-black group-hover:text-brand-gold transition-colors duration-200 mb-1">
            {name}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-brand-black">${price}</p>
            {originalPrice && (
              <p className="text-sm text-brand-slate line-through">${originalPrice}</p>
            )}
          </div>

        </Link>
      ))}
    </div>
  );
}
