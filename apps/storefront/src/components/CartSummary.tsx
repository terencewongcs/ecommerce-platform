import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const TAX_RATE = 0.08; // 8% tax for display purposes
const FREE_SHIPPING_THRESHOLD = 150;
const SHIPPING_COST = 12;

export default function CartSummary() {
  const { subtotal, items } = useCart();

  if (items.length === 0) return null;

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-brand-surface p-6">
      <p className="text-xs tracking-[0.25em] uppercase text-brand-black font-semibold mb-5">
        Order Summary
      </p>

      <ul className="space-y-3 text-sm mb-5">
        <li className="flex justify-between text-brand-slate">
          <span>Subtotal</span>
          <span className="text-brand-black">${subtotal.toFixed(2)}</span>
        </li>
        <li className="flex justify-between text-brand-slate">
          <span>Shipping</span>
          <span className={shipping === 0 ? 'text-brand-gold' : 'text-brand-black'}>
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </li>
        <li className="flex justify-between text-brand-slate">
          <span>Estimated Tax</span>
          <span className="text-brand-black">${tax.toFixed(2)}</span>
        </li>
      </ul>

      {shipping > 0 && (
        <p className="text-[10px] text-brand-slate mb-4">
          Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping
        </p>
      )}

      <hr className="border-brand-surface mb-5" />

      <div className="flex justify-between text-sm font-semibold text-brand-black mb-6">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <Link
        to="/checkout"
        className="block w-full text-center py-4 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
