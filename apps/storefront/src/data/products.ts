// Static product data used across the storefront
// In a real app, this would come from an API

export type Category = 'women' | 'men' | 'accessories' | 'new-arrivals' | 'sale';

export type ProductTag = 'New' | 'Sale' | 'Bestseller' | null;

export type StaticProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number; // shown when tag is 'Sale'
  category: Category[];
  sizes: string[];
  bg: string; // placeholder color
  tag: ProductTag;
};

export const PRODUCTS: StaticProduct[] = [
  {
    id: '1',
    slug: 'structured-blazer',
    name: 'Structured Blazer',
    brand: 'TU Studio',
    description:
      'A timeless structured blazer cut from premium Italian wool. Tailored silhouette with notched lapels and a single-button closure. Wear open over a slip dress or belted for a sharper look.',
    price: 189,
    category: ['women'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    bg: '#D4C4B5',
    tag: 'Bestseller',
  },
  {
    id: '2',
    slug: 'silk-slip-dress',
    name: 'Silk Slip Dress',
    brand: 'TU Studio',
    description:
      'Effortlessly elegant slip dress crafted from pure silk charmeuse. Bias-cut for a fluid drape that skims the body. Features adjustable spaghetti straps and a delicate lace trim.',
    price: 124,
    category: ['women', 'new-arrivals'],
    sizes: ['XS', 'S', 'M', 'L'],
    bg: '#C8B0B5',
    tag: 'New',
  },
  {
    id: '3',
    slug: 'wide-leg-trousers',
    name: 'Wide Leg Trousers',
    brand: 'Essentials',
    description:
      'Relaxed wide-leg trousers in a soft crepe fabric. High-waisted with a flat front and side pockets. Pairs equally well with tucked-in blouses or oversized knits.',
    price: 98,
    category: ['women', 'men'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    bg: '#B5BFC8',
    tag: null,
  },
  {
    id: '4',
    slug: 'cashmere-knit',
    name: 'Cashmere Knit',
    brand: 'Essentials',
    description:
      'Luxuriously soft sweater knitted from Grade-A Mongolian cashmere. Relaxed fit with dropped shoulders and ribbed cuffs. A wardrobe staple that gets better with every wear.',
    price: 156,
    category: ['women', 'men', 'new-arrivals'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    bg: '#B5C4B8',
    tag: 'New',
  },
  {
    id: '5',
    slug: 'leather-crossbody',
    name: 'Leather Crossbody',
    brand: 'Accents',
    description:
      'Compact crossbody bag crafted from full-grain vegetable-tanned leather. Features a main zip compartment, interior card slots, and an adjustable strap. Ages beautifully with use.',
    price: 215,
    category: ['accessories'],
    sizes: ['One Size'],
    bg: '#C4BA98',
    tag: null,
  },
  {
    id: '6',
    slug: 'linen-shirt',
    name: 'Linen Shirt',
    brand: 'Essentials',
    description:
      'Lightweight oversized shirt in 100% European linen. Relaxed boxy fit with a classic collar, chest pocket, and pearlescent buttons. Perfect for layering or wearing open as a cover-up.',
    price: 58,
    originalPrice: 78,
    category: ['women', 'men', 'sale'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    bg: '#C8C4B5',
    tag: 'Sale',
  },
  {
    id: '7',
    slug: 'merino-turtleneck',
    name: 'Merino Turtleneck',
    brand: 'Essentials',
    description:
      'Slim-fit turtleneck knitted from fine Merino wool. Smooth ribbed texture with a double-layered neck for extra warmth. A minimalist essential that layers seamlessly under blazers.',
    price: 112,
    category: ['men', 'new-arrivals'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    bg: '#BCC0C8',
    tag: 'New',
  },
  {
    id: '8',
    slug: 'canvas-tote',
    name: 'Canvas Tote',
    brand: 'Accents',
    description:
      'Sturdy everyday tote in heavyweight organic canvas. Reinforced handles, a zip inner pocket, and a magnetic snap closure. Holds a 15" laptop with room to spare.',
    price: 68,
    category: ['accessories'],
    sizes: ['One Size'],
    bg: '#D0CCBF',
    tag: null,
  },
  {
    id: '9',
    slug: 'tailored-chinos',
    name: 'Tailored Chinos',
    brand: 'TU Studio',
    description:
      'Slim-straight chinos cut from stretch-cotton twill. Clean front with minimal seaming and a tapered leg that sits just above the ankle. Versatile enough for desk or weekend.',
    price: 88,
    originalPrice: 118,
    category: ['men', 'sale'],
    sizes: ['28', '30', '32', '34', '36'],
    bg: '#C5BFB0',
    tag: 'Sale',
  },
  {
    id: '10',
    slug: 'silk-scarf',
    name: 'Silk Scarf',
    brand: 'Accents',
    description:
      'Hand-rolled silk twill scarf printed with an abstract botanical motif. 90×90cm square — wear as a neck scarf, head wrap, or tied to a bag handle. Each piece is individually numbered.',
    price: 95,
    category: ['accessories', 'new-arrivals'],
    sizes: ['One Size'],
    bg: '#C8B8C0',
    tag: 'New',
  },
  {
    id: '11',
    slug: 'relaxed-blazer',
    name: 'Relaxed Blazer',
    brand: 'TU Studio',
    description:
      'Unstructured single-breasted blazer in a soft wool-cotton blend. Unlined for a lighter feel with patch pockets and a subtle herringbone texture. Wear it thrown over a tee for effortless polish.',
    price: 165,
    category: ['men'],
    sizes: ['S', 'M', 'L', 'XL'],
    bg: '#C0C4BE',
    tag: 'Bestseller',
  },
  {
    id: '12',
    slug: 'leather-belt',
    name: 'Leather Belt',
    brand: 'Accents',
    description:
      'Sleek belt in full-grain calf leather with a polished silver-tone buckle. 3cm width. Available in Black and Tan. A finishing touch that elevates any outfit.',
    price: 72,
    originalPrice: 96,
    category: ['accessories', 'sale'],
    sizes: ['S', 'M', 'L'],
    bg: '#C2B8A8',
    tag: 'Sale',
  },
];

export const TAG_STYLES: Record<NonNullable<ProductTag>, string> = {
  New: 'bg-brand-black text-brand-ivory',
  Sale: 'bg-brand-rose text-white',
  Bestseller: 'bg-brand-gold text-brand-black',
};

/** Return products that belong to the given category slug */
export function getProductsByCategory(category: string): StaticProduct[] {
  if (category === 'new-arrivals') {
    return PRODUCTS.filter((p) => p.category.includes('new-arrivals'));
  }
  if (category === 'sale') {
    return PRODUCTS.filter((p) => p.tag === 'Sale');
  }
  return PRODUCTS.filter((p) => p.category.includes(category as Category));
}

/** Return a single product by slug, or undefined if not found */
export function getProductBySlug(slug: string): StaticProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/** Return products whose name or brand matches the query (case-insensitive) */
export function searchProducts(query: string): StaticProduct[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}
