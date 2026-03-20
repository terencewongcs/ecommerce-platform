import { Link } from 'react-router-dom';

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  to: string;
  bg: string;
  tag: 'New' | 'Sale' | 'Bestseller' | null;
};

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Structured Blazer',
    brand: 'TU Studio',
    price: 189,
    to: '/products/structured-blazer',
    bg: '#D4C4B5',
    tag: 'Bestseller',
  },
  {
    id: '2',
    name: 'Silk Slip Dress',
    brand: 'TU Studio',
    price: 124,
    to: '/products/silk-slip-dress',
    bg: '#C8B0B5',
    tag: 'New',
  },
  {
    id: '3',
    name: 'Wide Leg Trousers',
    brand: 'Essentials',
    price: 98,
    to: '/products/wide-leg-trousers',
    bg: '#B5BFC8',
    tag: null,
  },
  {
    id: '4',
    name: 'Cashmere Knit',
    brand: 'Essentials',
    price: 156,
    to: '/products/cashmere-knit',
    bg: '#B5C4B8',
    tag: 'New',
  },
  {
    id: '5',
    name: 'Leather Crossbody',
    brand: 'Accents',
    price: 215,
    to: '/products/leather-crossbody',
    bg: '#C4BA98',
    tag: null,
  },
  {
    id: '6',
    name: 'Linen Shirt',
    brand: 'Essentials',
    price: 78,
    to: '/products/linen-shirt',
    bg: '#C8C4B5',
    tag: 'Sale',
  },
];

const TAG_STYLES: Record<NonNullable<Product['tag']>, string> = {
  New: 'bg-brand-black text-brand-ivory',
  Sale: 'bg-brand-rose text-white',
  Bestseller: 'bg-brand-gold text-brand-black',
};

export default function FeaturedProducts() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">Hand-Picked</p>
          <h2 className="text-3xl font-light text-brand-black">Featured Products</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
          {PRODUCTS.map(({ id, name, brand, price, to, bg, tag }) => (
            <Link key={id} to={to} className="group">

              {/* Image placeholder */}
              <div className="relative aspect-[3/4] overflow-hidden mb-4">
                <div
                  className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundColor: bg }}
                />
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
              <p className="text-sm text-brand-black">${price}</p>

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
