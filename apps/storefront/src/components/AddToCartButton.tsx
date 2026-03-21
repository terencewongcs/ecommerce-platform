import { useState } from 'react';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import CheckIcon from '@mui/icons-material/Check';
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
    addItem(product, selectedSize);
    setAdded(true);
    // Reset the "Added" state after 2 seconds
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full py-4 flex items-center justify-center gap-3 text-xs tracking-[0.25em] uppercase transition-colors duration-200 ${
        added
          ? 'bg-brand-gold text-brand-black border border-brand-gold'
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
