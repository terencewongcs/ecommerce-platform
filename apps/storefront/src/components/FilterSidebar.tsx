// Static filter sidebar — no actual filtering logic yet, UI only

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PRICE_RANGES = [
  { label: 'Under $50', value: 'under-50' },
  { label: '$50 – $100', value: '50-100' },
  { label: '$100 – $150', value: '100-150' },
  { label: '$150+', value: '150-plus' },
];

type Props = {
  selectedSizes: string[];
  selectedPriceRange: string | null;
  onSizeToggle: (size: string) => void;
  onPriceRangeSelect: (range: string | null) => void;
};

export default function FilterSidebar({
  selectedSizes,
  selectedPriceRange,
  onSizeToggle,
  onPriceRangeSelect,
}: Props) {
  return (
    <aside className="w-52 flex-shrink-0">

      {/* Size filter */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.25em] uppercase text-brand-black font-semibold mb-4">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <button
                key={size}
                onClick={() => onSizeToggle(size)}
                className={`w-10 h-10 text-xs border transition-colors duration-150 ${
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

      {/* Price range filter */}
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-brand-black font-semibold mb-4">
          Price
        </p>
        <ul className="space-y-2">
          {PRICE_RANGES.map(({ label, value }) => {
            const active = selectedPriceRange === value;
            return (
              <li key={value}>
                <button
                  onClick={() => onPriceRangeSelect(active ? null : value)}
                  className={`text-xs transition-colors duration-150 ${
                    active
                      ? 'text-brand-black font-semibold'
                      : 'text-brand-slate hover:text-brand-black'
                  }`}
                >
                  {active && <span className="mr-1">✓</span>}
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

    </aside>
  );
}
