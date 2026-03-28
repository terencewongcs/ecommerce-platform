import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { apiFetch, ApiError } from '../lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckoutState =
  | { status: 'idle' }
  | { status: 'creating_intent' }
  | { status: 'confirming_payment' }
  | { status: 'succeeded'; orderId: string }
  | { status: 'failed'; message: string }
  | { status: 'timeout' };

interface CreateOrderResponse {
  clientSecret: string;
  orderId: string;
}

// ── Stripe CardElement styling ────────────────────────────────────────────────

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily: 'inherit',
      fontSize: '14px',
      color: '#111111',             // brand-black
      '::placeholder': { color: '#6C6C7A' }, // brand-slate
      iconColor: '#6C6C7A',
    },
    invalid: {
      color: '#C47D8F',             // brand-rose
      iconColor: '#C47D8F',
    },
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [state, setState] = useState<CheckoutState>({ status: 'idle' });

  // Generated once per checkout session — reused on retry so Stripe returns the same PaymentIntent
  const idempotencyKey = useRef(crypto.randomUUID());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount (e.g. user navigates away mid-payment)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Redirect to order confirmation page on success
  useEffect(() => {
    if (state.status === 'succeeded') {
      // replace: true prevents "Back" returning to the payment form
      navigate(`/orders/${state.orderId}`, { replace: true });
    }
  }, [state, navigate]);

  // Derived values — kept consistent with CheckoutPage's order summary display
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 150 ? 0 : 12;
  const total = subtotal + tax + shipping;

  const isSubmitting =
    state.status === 'creating_intent' || state.status === 'confirming_payment';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Double-submit guard
    if (isSubmitting) return;
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setState({ status: 'creating_intent' });

    const form = e.currentTarget;
    const data = new FormData(form);
    const shippingAddress = {
      firstName: data.get('firstName') as string,
      lastName: data.get('lastName') as string,
      address: data.get('address') as string,
      city: data.get('city') as string,
      zip: data.get('zip') as string,
    };

    // Step 1: Create order on our backend and receive the Stripe clientSecret
    let clientSecret: string;
    let orderId: string;
    try {
      const result = await apiFetch<CreateOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({ shippingAddress, idempotencyKey: idempotencyKey.current }),
      });
      clientSecret = result.clientSecret;
      orderId = result.orderId;
    } catch (err) {
      let message = 'Something went wrong. Please try again.';
      if (err instanceof ApiError) {
        const body = err.body as { error?: string };
        if (err.status === 409) message = body.error ?? 'This order was already submitted.';
        else if (body.error) message = body.error;
      }
      setState({ status: 'failed', message });
      return;
    }

    setState({ status: 'confirming_payment' });

    // Start a 30-second timeout — if Stripe takes too long, show a gentle message
    timeoutRef.current = setTimeout(() => {
      setState({ status: 'timeout' });
    }, 30_000);

    // Step 2: Confirm the payment with Stripe using the card element
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        },
      },
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (error) {
      setState({ status: 'failed', message: error.message ?? 'Payment failed. Please try again.' });
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      clearCart();
      setState({ status: 'succeeded', orderId });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputClass =
    'border border-brand-surface px-4 py-3 text-sm text-brand-black placeholder:text-brand-slate focus:outline-none focus:border-brand-black';

  function buttonLabel() {
    if (state.status === 'creating_intent') return 'Processing…';
    if (state.status === 'confirming_payment') return 'Confirming Payment…';
    return `Place Order — $${total.toFixed(2)}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-light text-brand-black mb-10">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">

          {/* Contact */}
          <section>
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand-black font-semibold mb-4">
              Contact
            </h2>
            <input
              required
              type="email"
              name="email"
              placeholder="Email address"
              defaultValue={user?.email ?? ''}
              className={`w-full ${inputClass}`}
            />
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand-black font-semibold mb-4">
              Shipping Address
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" name="firstName" placeholder="First name" defaultValue={user?.firstName ?? ''} className={inputClass} />
              <input required type="text" name="lastName" placeholder="Last name" defaultValue={user?.lastName ?? ''} className={inputClass} />
            </div>
            <input required type="text" name="address" placeholder="Address" className={`mt-4 w-full ${inputClass}`} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input required type="text" name="city" placeholder="City" className={inputClass} />
              <input required type="text" name="zip" placeholder="ZIP code" className={inputClass} />
            </div>
          </section>

          {/* Payment — Stripe CardElement replaces the old fake card inputs */}
          <section>
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand-black font-semibold mb-4">
              Payment
            </h2>
            {/* CardElement is in an iframe — Tailwind classes have no effect inside it.
                focus-within on the wrapper replicates focus:border-brand-black from native inputs. */}
            <div className="border border-brand-surface px-4 py-3 focus-within:border-brand-black transition-colors">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </section>

          {/* Error / timeout message */}
          {state.status === 'failed' && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}
          {state.status === 'timeout' && (
            <p className="text-sm text-brand-slate">
              This is taking longer than expected. Please check your{' '}
              <a href="/orders" className="underline">orders page</a> or try again.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-black text-brand-ivory text-xs tracking-[0.25em] uppercase hover:bg-brand-black/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLabel()}
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
  );
}
