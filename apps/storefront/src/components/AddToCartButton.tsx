import { useState } from 'react';
import {ShoppingBagOutlined as ShoppingBagOutlinedIcon} from '@mui/icons-material';
import {Check as CheckIcon} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import type { StaticProduct } from '../data/products';

type Props = {
  product: StaticProduct;
  selectedSize: string | null;
  onNoSizeSelected: () => void;
};

export default function AddToCartButton({ product, selectedSize, onNoSizeSelected }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    if (!selectedSize) {
      onNoSizeSelected();
      return;
    }
    // Build the flat cart item from the product and selected size
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      bg: product.bg,
      size: selectedSize,
    });
    setAdded(true);
    // Reset the "Added" state after 2 seconds
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full py-4 flex items-center justify-center gap-3 text-xs tracking-[0.25em] uppercase transition-all duration-300 ${
        added
          ? 'bg-brand-gold text-brand-black border border-brand-gold scale-[0.98]'
          : 'bg-brand-black text-brand-ivory hover:bg-brand-black/90 border border-brand-black'
      }`}
    >
      {added ? (
        <>
          <CheckIcon fontSize="small" />
          Added to Bag
        </>
      ) : (
        <>
          <ShoppingBagOutlinedIcon fontSize="small" />
          Add to Bag
        </>
      )}
    </button>
  );
}
