import { TAG_STYLES } from '../data/products';
import type { StaticProduct } from '../data/products';

type Props = {
  product: StaticProduct;
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
};

export default function ProductInfo({ product, selectedSize, onSizeSelect }: Props) {
  const { name, brand, price, originalPrice, description, sizes, tag } = product;

  return (
    <div>
      {/* Brand */}
      <p className="text-[10px] tracking-[0.3em] uppercase text-brand-slate mb-2">{brand}</p>

      {/* Name */}
      <h1 className="text-2xl font-light text-brand-black mb-4">{name}</h1>

      {/* Price */}
      <div className="flex items-center gap-3 mb-2">
        <p className="text-lg text-brand-black">${price}</p>
        {originalPrice && (
          <p className="text-sm text-brand-slate line-through">${originalPrice}</p>
        )}
        {tag && (
          <span
            className={`text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 font-semibold ${TAG_STYLES[tag]}`}
          >
            {tag}
          </span>
        )}
      </div>

      <hr className="border-brand-surface my-6" />

      {/* Description */}
      <p className="text-sm text-brand-slate leading-relaxed mb-8">{description}</p>

      {/* Size selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-[0.25em] uppercase text-brand-black font-semibold">
            Size
          </p>
          {!selectedSize && (
            <p className="text-[10px] text-brand-rose tracking-wide">Please select a size</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const active = selectedSize === size;
            return (
              <button
                key={size}
                onClick={() => onSizeSelect(size)}
                className={`min-w-[2.5rem] h-10 px-2 text-xs border transition-colors duration-150 ${
                  active
                    ? 'bg-brand-black text-brand-ivory border-brand-black'
                    : 'bg-white text-brand-slate border-brand-surface hover:border-brand-black'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
