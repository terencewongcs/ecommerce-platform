import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CartItemList from '../../components/CartItemList';
import CartSummary from '../../components/CartSummary';
import { useCart } from '../../contexts/CartContext';

export default function CartPage() {
  const { totalItems } = useCart();

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white">

        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-light text-brand-black mb-1">Shopping Bag</h1>
          <p className="text-xs text-brand-slate tracking-wide mb-10">
            {totalItems === 0
              ? 'Your bag is empty'
              : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
            <CartItemList />
            <CartSummary />
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
