import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Navbar from '../../components/Navbar';
import CheckoutForm from '../../components/CheckoutForm';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { clientEnv } from '../../lib/env';

// Module-level singleton — loadStripe must not be called inside a component render
// to avoid recreating the Stripe instance on every re-render.
const stripePromise = loadStripe(clientEnv.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const { user, isLoading } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  // Auth guard — POST /orders requires authentication
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) return null;

  // Empty cart guard
  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-brand-slate text-sm tracking-widest uppercase mb-4">
              Your bag is empty
            </p>
            <Link
              to="/women"
              className="text-xs tracking-[0.25em] uppercase border border-brand-black px-8 py-3 hover:bg-brand-black hover:text-brand-ivory transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white">
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </main>
    </>
  );
}
