import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useCart } from '../../contexts/CartContext';

// Checkout page — static UI only, no real payment processing
export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);

  const tax = subtotal * 0.08;
  const shipping = subtotal >= 150 ? 0 : 12;
  const total = subtotal + tax + shipping;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearCart();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-4">
              Order Confirmed
            </p>
            <h1 className="text-2xl font-light text-brand-black mb-4">Thank You!</h1>
            <p className="text-sm text-brand-slate mb-8">
              Your order has been placed. A confirmation email will be sent shortly.
            </p>
            <Link
              to="/"
              className="inline-block px-10 py-3 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </>
    );
  }

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
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-light text-brand-black mb-10">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Contact */}
              <section>
                <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand-black font-semibold mb-4">
                  Contact
                </h2>
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  className="w-full border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black"
                />
              </section>

              {/* Shipping */}
              <section>
                <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand-black font-semibold mb-4">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="text" placeholder="First name" className="border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                  <input required type="text" placeholder="Last name" className="border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                </div>
                <input required type="text" placeholder="Address" className="mt-4 w-full border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input required type="text" placeholder="City" className="border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                  <input required type="text" placeholder="ZIP code" className="border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                </div>
              </section>

              {/* Payment */}
              <section>
                <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand-black font-semibold mb-4">
                  Payment
                </h2>
                <input required type="text" placeholder="Card number" className="w-full border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input required type="text" placeholder="MM / YY" className="border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                  <input required type="text" placeholder="CVV" className="border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black" />
                </div>
              </section>

              <button
                type="submit"
                className="w-full py-4 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200"
              >
                Place Order — ${total.toFixed(2)}
              </button>
            </form>

            {/* Order summary */}
            <aside className="bg-brand-surface p-6 h-fit">
              <p className="text-[10px] tracking-[0.25em] uppercase text-brand-black font-semibold mb-5">
                Your Order
              </p>
              <ul className="space-y-4 mb-6">
                {items.map(({ productId, name, bg, size, quantity, price }) => (
                  <li key={`${productId}-${size}`} className="flex gap-3">
                    <div className="w-12 h-16 flex-shrink-0" style={{ backgroundColor: bg }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-black truncate">{name}</p>
                      <p className="text-[10px] text-brand-slate">Size: {size} · Qty: {quantity}</p>
                      <p className="text-xs text-brand-black mt-1">${price * quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <hr className="border-brand-surface mb-4" />
              <ul className="space-y-2 text-xs text-brand-slate mb-2">
                <li className="flex justify-between"><span>Subtotal</span><span className="text-brand-black">${subtotal.toFixed(2)}</span></li>
                <li className="flex justify-between"><span>Shipping</span><span className={shipping === 0 ? 'text-brand-gold' : 'text-brand-black'}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></li>
                <li className="flex justify-between"><span>Tax</span><span className="text-brand-black">${tax.toFixed(2)}</span></li>
              </ul>
              <div className="flex justify-between text-sm font-semibold text-brand-black mt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </aside>

          </div>
        </div>
      </main>
    </>
  );
}
