import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PersonOutline as PersonOutlineIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await logout();
    navigate('/');
  }

  // Not logged in — plain link to login page
  if (!user) {
    return (
      <Link
        to="/auth/login"
        aria-label="My account"
        className="p-1 text-brand-slate hover:text-brand-black transition-colors duration-200"
      >
        <PersonOutlineIcon fontSize="small" />
      </Link>
    );
  }

  // Logged in — person icon opens a small dropdown
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account menu"
        aria-expanded={open}
        className="p-1 text-brand-slate hover:text-brand-black transition-colors duration-200"
      >
        <PersonOutlineIcon fontSize="small" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-brand-surface shadow-md z-50">
          {/* User name */}
          <div className="px-4 py-3 border-b border-brand-surface">
            <p className="text-[10px] tracking-[0.2em] uppercase text-brand-slate">Signed in as</p>
            <p className="text-sm text-brand-black font-medium truncate mt-0.5">
              {user.firstName} {user.lastName}
            </p>
          </div>

          {/* My account */}
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-xs tracking-[0.15em] uppercase text-brand-slate hover:text-brand-black hover:bg-brand-surface/40 transition-colors duration-150"
          >
            My Account
          </Link>

          {/* My orders */}
          <Link
            to="/account/orders"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-xs tracking-[0.15em] uppercase text-brand-slate hover:text-brand-black hover:bg-brand-surface/40 transition-colors duration-150"
          >
            My Orders
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-xs tracking-[0.15em] uppercase text-brand-slate hover:text-brand-black hover:bg-brand-surface/40 transition-colors duration-150"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
