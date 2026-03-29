import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/apiClient';
import type { ApiOrder } from '@trendyuniquellc/types';

// Maps order status to a colored dot color
const STATUS_DOT: Record<ApiOrder['status'], string> = {
  pending_payment:  'bg-yellow-400',
  paid:             'bg-blue-400',
  shipped:          'bg-indigo-500',
  delivered:        'bg-green-500',
  cancelled:        'bg-red-400',
  refund_requested: 'bg-orange-400',
  refunded:         'bg-gray-400',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login');
    }
  }, [authLoading, user, navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiFetch<{ orders: ApiOrder[] }>('/orders?limit=20'),
    enabled: !!user,
  });

  if (authLoading || !user) return null;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-brand-ivory">
        <div className="max-w-xl mx-auto px-6 py-16">

          {/* Page header */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-brand-gold mb-2">My Account</p>
            <h1 className="text-2xl font-light text-brand-black">My Orders</h1>
          </div>

          {isLoading && (
            <p className="text-sm text-brand-slate">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-brand-rose">Failed to load orders. Please try again.</p>
          )}

          {data && data.orders.length === 0 && (
            <p className="text-sm text-brand-slate">No orders yet.</p>
          )}

          {data && data.orders.length > 0 && (
            <div className="divide-y divide-brand-surface border border-brand-surface bg-white">
              {data.orders.map((order) => (
                <Link
                  key={order._id}
                  to={`/account/orders/${order._id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-brand-surface/30 transition-colors duration-150"
                >
                  {/* Left: order # and date */}
                  <div>
                    <p className="text-sm text-brand-black font-medium">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-brand-slate mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Right: status + total */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[order.status]}`} />
                      <span className="text-[11px] tracking-[0.1em] uppercase text-brand-slate">
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-brand-black font-medium">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Link
              to="/account"
              className="text-[11px] tracking-[0.2em] uppercase text-brand-slate hover:text-brand-black transition-colors duration-150"
            >
              ← Back to Account
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
