import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { StaticProduct } from '../data/products';

// A single line item in the cart
export type CartItem = {
  product: StaticProduct;
  size: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; product: StaticProduct; size: string }
  | { type: 'REMOVE_ITEM'; productId: string; size: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; size: string; quantity: number }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === action.product.id && item.size === action.size,
      );
      if (existingIndex >= 0) {
        // Item already exists — increment quantity
        const updated = [...state.items];
        const existing = updated[existingIndex] as CartItem;
        updated[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return { ...state, items: updated };
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, size: action.size, quantity: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) => !(item.product.id === action.productId && item.size === action.size),
        ),
      };

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        // Treat quantity 0 or below as a removal
        return {
          ...state,
          items: state.items.filter(
            (item) => !(item.product.id === action.productId && item.size === action.size),
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.productId && item.size === action.size
            ? { ...item, quantity: action.quantity }
            : item,
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: StaticProduct, size: string) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const addItem = (product: StaticProduct, size: string) =>
    dispatch({ type: 'ADD_ITEM', product, size });

  const removeItem = (productId: string, size: string) =>
    dispatch({ type: 'REMOVE_ITEM', productId, size });

  const updateQuantity = (productId: string, size: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', productId, size, quantity });

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider
      value={{ items: state.items, totalItems, subtotal, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

/** Must be used inside CartProvider */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
