import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-4">
            Order Confirmed
          </p>
          <h1 className="text-2xl font-light text-brand-black mb-4">Thank You!</h1>
          <p className="text-sm text-brand-slate mb-2">
            Your order has been placed successfully.
          </p>
          {orderId && (
            <p className="text-[10px] text-brand-slate tracking-widest uppercase mb-8">
              Order #{orderId.slice(-8).toUpperCase()}
            </p>
          )}
          <p className="text-sm text-brand-slate mb-10">
            A confirmation email will be sent shortly.
          </p>
          <Link
            to="/"
            className="inline-block px-10 py-3 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
