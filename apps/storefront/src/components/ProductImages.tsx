import { useState } from 'react';

// Generates two lighter tonal variations of a hex color for the placeholder swatch strip
function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

type Props = {
  name: string;
  bg: string;       // fallback placeholder color when images is empty
  images?: string[]; // real product images from Cloudflare R2
};

export default function ProductImages({ name, bg, images }: Props) {
  const [active, setActive] = useState(0);
  const hasImages = images && images.length > 0;

  // ── Real images path ───────────────────────────────────────────────────────
  if (hasImages) {
    return (
      <div className="flex gap-4">
        {/* Thumbnail strip */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-16 h-20 border-2 transition-colors duration-150 overflow-hidden ${
                active === i ? 'border-brand-black' : 'border-transparent hover:border-brand-surface'
              }`}
              aria-label={`View image ${i + 1} of ${name}`}
            >
              <img src={src} alt={`${name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className="flex-1 aspect-[3/4] overflow-hidden">
          <img
            src={images[active]}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  // ── Placeholder path (no images yet) ──────────────────────────────────────
  const thumbnails = [bg, lighten(bg, 20), lighten(bg, 40)];

  return (
    <div className="flex gap-4">
      {/* Color swatch strip */}
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

      {/* Main placeholder */}
      <div
        className="flex-1 aspect-[3/4]"
        style={{ backgroundColor: thumbnails[active] }}
        role="img"
        aria-label={name}
      />
    </div>
  );
}
