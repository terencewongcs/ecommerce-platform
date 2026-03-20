import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    label: 'Women',
    to: '/women',
    bg: '#D4BFB5',
    description: 'Effortless elegance',
  },
  {
    label: 'Men',
    to: '/men',
    bg: '#B0BEC8',
    description: 'Sharp & refined',
  },
  {
    label: 'Accessories',
    to: '/accessories',
    bg: '#C8BFA5',
    description: 'The finishing touch',
  },
  {
    label: 'New Arrivals',
    to: '/new-arrivals',
    bg: '#B5C4B5',
    description: 'Fresh this season',
  },
  {
    label: 'Sale',
    to: '/sale',
    bg: '#C4B0B5',
    description: 'Up to 50% off',
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-20 bg-brand-ivory">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">Browse By</p>
          <h2 className="text-3xl font-light text-brand-black">Categories</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map(({ label, to, bg, description }) => (
            <Link key={label} to={to} className="group">

              {/* Color block — placeholder for category image */}
              <div
                className="aspect-[3/4] w-full overflow-hidden"
                style={{ backgroundColor: bg }}
              >
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-105" style={{ backgroundColor: bg }} />
              </div>

              {/* Label */}
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-black">{label}</p>
                  <p className="text-xs text-brand-slate mt-0.5">{description}</p>
                </div>
                <span
                  className="text-brand-gold opacity-0 translate-x-[-6px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mt-0.5 text-sm"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>

            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
