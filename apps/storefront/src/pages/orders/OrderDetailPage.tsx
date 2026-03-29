import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/apiClient';
import type { ApiOrder } from '@trendyuniquellc/types';

const STATUS_DOT: Record<ApiOrder['status'], string> = {
  pending_payment:  'bg-yellow-400',
  paid:             'bg-blue-400',
  shipped:          'bg-indigo-500',
  delivered:        'bg-green-500',
  cancelled:        'bg-red-400',
  refund_requested: 'bg-orange-400',
  refunded:         'bg-gray-400',
};

export default function StorefrontOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login');
    }
  }, [authLoading, user, navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiFetch<{ order: ApiOrder }>(`/orders/${orderId!}`),
    enabled: !!user && !!orderId,
  });

  const deliverMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${orderId!}/deliver`, { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${orderId!}/refund-request`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancelOpen(false);
      setReason('');
      setCancelSuccess(true);
      setCancelError('');
    },
    onError: () => {
      setCancelError('Failed to submit cancellation. Please try again.');
    },
  });

  if (authLoading || !user) return null;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-brand-ivory">
          <div className="max-w-xl mx-auto px-6 py-16">
            <p className="text-sm text-brand-slate">Loading…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-brand-ivory">
          <div className="max-w-xl mx-auto px-6 py-16">
            <p className="text-sm text-brand-rose">Order not found.</p>
            <Link to="/account/orders" className="text-[11px] tracking-[0.2em] uppercase text-brand-slate hover:text-brand-black mt-4 inline-block">
              ← Back to Orders
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const order = data.order;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-brand-ivory">
        <div className="max-w-xl mx-auto px-6 py-16">

          {/* Breadcrumb */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-2">My Account</p>
            <div className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-brand-slate">
              <Link to="/account/orders" className="hover:text-brand-black transition-colors duration-150">
                My Orders
              </Link>
              <span>/</span>
              <span className="text-brand-black">#{order._id.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-8">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[order.status]}`} />
            <span className="text-xs tracking-[0.2em] uppercase text-brand-slate">
              {order.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-brand-slate ml-4">
              Placed {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

{/* Tracking info + confirm receipt — only for shipped orders */}
          {order.status === 'shipped' && (
            <section className="mb-8">
              <h2 className="text-xs tracking-[0.2em] uppercase text-brand-black mb-4 pb-3 border-b border-brand-surface">
                Shipment
              </h2>
              <div className="space-y-1 mb-5">
                {order.trackingNumber && (
                  <p className="text-sm text-brand-slate">
                    Tracking: <span className="text-brand-black font-medium">{order.trackingNumber}</span>
                  </p>
                )}
                {order.carrier && (
                  <p className="text-sm text-brand-slate">
                    Carrier: <span className="text-brand-black font-medium">{order.carrier}</span>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Items */}
          <section className="mb-8">
            <h2 className="text-xs tracking-[0.2em] uppercase text-brand-black mb-4 pb-3 border-b border-brand-surface">
              Items
            </h2>
            <div className="divide-y divide-brand-surface">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between py-3">
                  <div>
                    <p className="text-sm text-brand-black">{item.name}</p>
                    <p className="text-[11px] text-brand-slate mt-0.5">
                      {item.brand} · Size {item.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-brand-black">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Shipping address */}
          <section className="mb-8">
            <h2 className="text-xs tracking-[0.2em] uppercase text-brand-black mb-4 pb-3 border-b border-brand-surface">
              Shipping Address
            </h2>
            <p className="text-sm text-brand-slate">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="text-sm text-brand-slate">{order.shippingAddress.address}</p>
            <p className="text-sm text-brand-slate">
              {order.shippingAddress.city}, {order.shippingAddress.zip}
            </p>
          </section>

          {/* Order summary */}
          <section className="mb-8">
            <h2 className="text-xs tracking-[0.2em] uppercase text-brand-black mb-4 pb-3 border-b border-brand-surface">
              Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-brand-slate">Subtotal</span>
                <span className="text-sm text-brand-black">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-brand-slate">Tax</span>
                <span className="text-sm text-brand-black">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-brand-slate">Shipping</span>
                <span className="text-sm text-brand-black">${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-surface">
                <span className="text-sm font-medium text-brand-black">Total</span>
                <span className="text-sm font-medium text-brand-black">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* Tracking info + confirm receipt — only for shipped orders */}
          {order.status === 'shipped' && (
            <section className="mb-8">
              <button
                onClick={() => deliverMutation.mutate()}
                disabled={deliverMutation.isPending}
                className="py-2.5 px-6 bg-brand-black text-brand-ivory text-xs tracking-[0.2em] uppercase hover:bg-brand-black/90 transition-colors duration-200 disabled:opacity-50"
              >
                {deliverMutation.isPending ? 'Confirming…' : 'The Order Is Delivered'}
              </button>
            </section>
          )}

          {/* Cancel order — only for paid orders */}
          {order.status === 'paid' && (
            <section className="mb-8">
              <h2 className="text-xs tracking-[0.2em] uppercase text-brand-black mb-4 pb-3 border-b border-brand-surface">
                Cancel Order
              </h2>

              {cancelSuccess ? (
                <p className="text-sm text-green-700">
                  Cancellation request submitted. We'll process your refund shortly.
                </p>
              ) : (
                <>
                  {!cancelOpen && (
                    <button
                      onClick={() => setCancelOpen(true)}
                      className="py-2.5 px-6 border border-brand-rose text-brand-rose text-xs tracking-[0.2em] uppercase hover:bg-brand-rose hover:text-white transition-colors duration-200"
                    >
                      Cancel Order
                    </button>
                  )}

                  {cancelOpen && (
                    <div className="space-y-3">
                      <p className="text-sm text-brand-slate">
                        Please tell us why you'd like to cancel:
                      </p>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Reason for cancellation…"
                        className="w-full border border-brand-surface bg-white px-4 py-3 text-sm text-brand-black focus:outline-none focus:border-brand-black resize-none"
                      />
                      <p className="text-[11px] text-brand-slate text-right">{reason.length}/500</p>
                      {cancelError && (
                        <p className="text-xs text-brand-rose">{cancelError}</p>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => cancelMutation.mutate()}
                          disabled={!reason.trim() || cancelMutation.isPending}
                          className="py-2.5 px-6 bg-brand-black text-brand-ivory text-xs tracking-[0.2em] uppercase hover:bg-brand-black/90 transition-colors duration-200 disabled:opacity-50"
                        >
                          {cancelMutation.isPending ? 'Submitting…' : 'Confirm Cancellation'}
                        </button>
                        <button
                          onClick={() => { setCancelOpen(false); setReason(''); setCancelError(''); }}
                          className="py-2.5 px-6 border border-brand-surface text-brand-slate text-xs tracking-[0.2em] uppercase hover:border-brand-black hover:text-brand-black transition-colors duration-200"
                        >
                          Never Mind
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          <Link
            to="/account/orders"
            className="text-[11px] tracking-[0.2em] uppercase text-brand-slate hover:text-brand-black transition-colors duration-150"
          >
            ← Back to Orders
          </Link>

        </div>
      </main>
      <Footer />
    </>
  );
}
