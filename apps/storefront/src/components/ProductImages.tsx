import { useState } from 'react';

// We use colour swatches as image placeholders since we have no real images yet.
// bg is the primary placeholder colour; the other two are lighter tonal variations.
type Props = {
  name: string;
  bg: string;
};

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function ProductImages({ name, bg }: Props) {
  const thumbnails = [bg, lighten(bg, 20), lighten(bg, 40)];
  const [active, setActive] = useState(0);

  return (
    <div className="flex gap-4">
      {/* Thumbnail strip */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        {thumbnails.map((color, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-16 h-20 border-2 transition-colors duration-150 ${
              active === i ? 'border-brand-black' : 'border-transparent hover:border-brand-surface'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`View image ${i + 1} of ${name}`}
          />
        ))}
      </div>

      {/* Main image */}
      <div
        className="flex-1 aspect-[3/4]"
        style={{ backgroundColor: thumbnails[active] }}
        role="img"
        aria-label={name}
      />
    </div>
  );
}
