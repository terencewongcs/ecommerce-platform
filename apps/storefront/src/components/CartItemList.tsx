import { Link } from 'react-router-dom';
import {Close as CloseIcon} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';

export default function CartItemList() {
  const { items, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-brand-slate text-sm tracking-widest uppercase mb-4">Your bag is empty</p>
        <Link
          to="/women"
          className="text-xs tracking-[0.25em] uppercase border border-brand-black px-8 py-3 hover:bg-brand-black hover:text-brand-ivory transition-colors duration-200"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-brand-surface">
      {items.map(({ product, size, quantity }) => (
        <li key={`${product.id}-${size}`} className="py-6 flex gap-5">

          {/* Colour swatch as image placeholder */}
          <Link
            to={`/products/${product.slug}`}
            className="flex-shrink-0 w-24 h-32 block"
            style={{ backgroundColor: product.bg }}
            aria-label={product.name}
          />

          {/* Item details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-brand-slate mb-1">
                  {product.brand}
                </p>
                <Link
                  to={`/products/${product.slug}`}
                  className="text-sm font-medium text-brand-black hover:text-brand-gold transition-colors duration-150"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-brand-slate mt-1">Size: {size}</p>
              </div>
              <button
                onClick={() => removeItem(product.id, size)}
                aria-label={`Remove ${product.name}`}
                className="p-1 text-brand-slate hover:text-brand-black transition-colors duration-150"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              {/* Quantity stepper */}
              <div className="flex items-center border border-brand-surface">
                <button
                  onClick={() => updateQuantity(product.id, size, quantity - 1)}
                  className="w-8 h-8 text-brand-slate hover:text-brand-black transition-colors duration-150"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm text-brand-black">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, size, quantity + 1)}
                  className="w-8 h-8 text-brand-slate hover:text-brand-black transition-colors duration-150"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-brand-black">${product.price * quantity}</p>
            </div>
          </div>

        </li>
      ))}
    </ul>
  );
}
