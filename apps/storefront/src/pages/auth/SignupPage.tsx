import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function SignupPage() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Auth not implemented yet — placeholder only
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-brand-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-3">Join Us</p>
            <h1 className="text-2xl font-light text-brand-black">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                type="text"
                placeholder="First name"
                className="border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
              />
              <input
                required
                type="text"
                placeholder="Last name"
                className="border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
              />
            </div>
            <input
              required
              type="email"
              placeholder="Email address"
              className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
            />
            <input
              required
              type="password"
              placeholder="Password"
              minLength={8}
              className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
            />
            <p className="text-[10px] text-brand-slate">Must be at least 8 characters.</p>
            <button
              type="submit"
              className="w-full py-4 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200 mt-2"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-xs text-brand-slate mt-6">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-brand-black font-semibold hover:text-brand-gold transition-colors duration-150"
            >
              Sign in
            </Link>
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}
