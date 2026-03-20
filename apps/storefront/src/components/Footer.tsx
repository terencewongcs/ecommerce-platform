import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  {
    heading: 'Shop',
    links: [
      { label: 'Women', to: '/women' },
      { label: 'Men', to: '/men' },
      { label: 'Accessories', to: '/accessories' },
      { label: 'New Arrivals', to: '/new-arrivals' },
      { label: 'Sale', to: '/sale' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Shipping & Returns', to: '/returns' },
      { label: 'Size Guide', to: '/size-guide' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Sustainability', to: '/sustainability' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/press' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-brand-black text-brand-ivory">
      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand column */}
          <div>
            <div className="flex items-baseline mb-4">
              <span className="text-lg font-light tracking-[0.15em]">Trendy</span>
              <span className="text-lg font-semibold tracking-[0.15em] text-brand-gold">Unique</span>
            </div>
            <p className="text-brand-slate text-sm font-light leading-relaxed">
              Curated fashion for those who dare to be different.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-xs tracking-[0.25em] uppercase text-brand-gold mb-5">{heading}</p>
              <ul className="space-y-3">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-brand-slate hover:text-brand-ivory transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-slate">
            © {new Date().getFullYear()} TrendyUnique LLC. All rights reserved.
          </p>
          <p className="text-xs text-brand-slate">
            Made with care for the bold.
          </p>
        </div>

      </div>
    </footer>
  );
}
