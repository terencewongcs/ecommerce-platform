import { Link } from 'react-router-dom';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useCart } from '../contexts/CartContext';

const NAV_LINKS = [
  { label: 'Women', to: '/women' },
  { label: 'Men', to: '/men' },
  { label: 'Accessories', to: '/accessories' },
  { label: 'Sale', to: '/sale' },
];

export default function Navbar() {
  const { totalItems } = useCart();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-brand-ivory/95 backdrop-blur-sm border-b border-brand-surface">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-baseline">
          <span className="text-xl font-light tracking-[0.15em] text-brand-black">Trendy</span>
          <span className="text-xl font-semibold tracking-[0.15em] text-brand-gold">Unique</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="text-xs tracking-[0.2em] uppercase text-brand-slate hover:text-brand-black transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            aria-label="My account"
            className="p-1 text-brand-slate hover:text-brand-black transition-colors duration-200"
          >
            <PersonOutlineIcon fontSize="small" />
          </Link>
          <Link
            to="/cart"
            aria-label="Shopping bag"
            className="relative p-1 text-brand-slate hover:text-brand-black transition-colors duration-200"
          >
            <ShoppingBagOutlinedIcon fontSize="small" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-gold text-brand-black text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  );
}
