import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="bg-brand-black min-h-[88vh] flex items-center justify-center relative overflow-hidden pt-16">

      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #C8A96E 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">

        <p className="text-xs tracking-[0.45em] uppercase text-brand-gold mb-8">
          New Collection · 2025
        </p>

        <h1 className="text-5xl md:text-7xl font-light text-brand-ivory leading-[1.1] mb-6">
          Discover What's{' '}
          <em className="not-italic font-semibold text-brand-gold">Uniquely</em>{' '}
          You
        </h1>

        <p className="text-brand-slate text-lg md:text-xl font-light max-w-xl mx-auto mb-12 leading-relaxed">
          Curated fashion for the bold and discerning.
          Find pieces that define your story.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/women"
            className="px-10 py-4 bg-brand-gold text-brand-black text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#B8935A] transition-colors duration-200"
          >
            Shop Now
          </Link>
          <Link
            to="/new-arrivals"
            className="px-10 py-4 border border-brand-ivory/30 text-brand-ivory text-xs tracking-[0.2em] uppercase font-semibold hover:border-brand-gold hover:text-brand-gold transition-colors duration-200"
          >
            New Arrivals
          </Link>
        </div>

      </div>
    </section>
  );
}
