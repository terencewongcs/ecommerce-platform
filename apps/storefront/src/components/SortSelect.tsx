export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

type Props = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export default function SortSelect({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-[0.2em] uppercase text-brand-slate">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="text-xs text-brand-black border border-brand-surface bg-white px-3 py-2 focus:outline-none focus:border-brand-black cursor-pointer"
      >
        {OPTIONS.map(({ value: v, label }) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
