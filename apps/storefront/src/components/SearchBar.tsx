import { useNavigate } from 'react-router-dom';
import {Search as SearchIcon} from '@mui/icons-material';

export default function SearchBar() {
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <section className="bg-brand-surface py-10">
      <div className="max-w-2xl mx-auto px-6">

        <p className="text-center text-xs tracking-[0.25em] uppercase text-brand-slate mb-5">
          Discover Your Style
        </p>

        <form onSubmit={handleSubmit} className="flex">
          <input
            name="q"
            type="search"
            placeholder="Search for products, brands, styles..."
            aria-label="Search products"
            className="flex-1 h-14 px-5 bg-white border border-transparent text-sm text-brand-black placeholder:text-brand-slate/60 focus:outline-none focus:border-brand-gold transition-colors duration-200"
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="w-14 h-14 flex items-center justify-center bg-brand-black text-brand-ivory hover:bg-brand-gold hover:text-brand-black transition-colors duration-200 shrink-0"
          >
            <SearchIcon fontSize="small" />
          </button>
        </form>

      </div>
    </section>
  );
}
