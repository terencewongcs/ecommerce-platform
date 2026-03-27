import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { apiFetch } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { loadGuestCart, saveGuestCart, clearGuestCart } from '../lib/cartStorage';
import type { AuthUser } from '../hooks/useAuth';

// ── Types ────────────────────────────────────────────────────────────────────

// Flat shape — all display fields stored directly so we don't need the full
// StaticProduct object in localStorage or the database.
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  bg: string;
  size: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; productId: string; size: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; size: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; items: CartItem[] }; // full replace, used for DB sync and init

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (i) => i.productId === action.item.productId && i.size === action.item.size,
      );
      if (existingIndex >= 0) {
        // Item already exists — increment quantity
        const updated = [...state.items];
        const existing = updated[existingIndex] as CartItem;
        updated[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.productId === action.productId && i.size === action.size),
        ),
      };

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        // Treat 0 or below as removal
        return {
          ...state,
          items: state.items.filter(
            (i) => !(i.productId === action.productId && i.size === action.size),
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId && i.size === action.size
            ? { ...i, quantity: action.quantity }
            : i,
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'SET_CART':
      return { ...state, items: action.items };

    default:
      return state;
  }
}

// ── Context value type ────────────────────────────────────────────────────────

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// ── Merge helper ─────────────────────────────────────────────────────────────

/** Merge guest items on top of DB items. Adds quantities for matching productId+size. */
function mergeItems(dbItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const merged = [...dbItems];
  for (const guestItem of guestItems) {
    const idx = merged.findIndex(
      (i) => i.productId === guestItem.productId && i.size === guestItem.size,
    );
    if (idx >= 0) {
      merged[idx] = { ...merged[idx]!, quantity: merged[idx]!.quantity + guestItem.quantity };
    } else {
      merged.push(guestItem);
    }
  }
  return merged;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { user, isLoading } = useAuth();

  // Tracks the previous user value to detect login/logout transitions.
  // Initialized to `undefined` as a sentinel meaning "not yet seen any value".
  const prevUserRef = useRef<AuthUser | null | undefined>(undefined);

  // ── Cart initialisation & auth-transition handler ─────────────────────────
  useEffect(() => {
    if (isLoading) return; // wait for auth to resolve before touching cart

    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    if (prevUser === undefined) {
      // First time auth resolves — load the appropriate cart
      if (user) {
        // Logged in: fetch from DB
        void apiFetch<{ items: CartItem[] }>('/cart')
          .then((data) => dispatch({ type: 'SET_CART', items: data.items }))
          .catch(() => {
            // DB unreachable — start with an empty cart; next mutation will retry
          });
      } else {
        // Guest: load from localStorage
        const guestItems = loadGuestCart();
        if (guestItems.length > 0) {
          dispatch({ type: 'SET_CART', items: guestItems });
        }
      }
      return;
    }

    if (prevUser === null && user !== null) {
      // User just logged in — merge guest cart into DB cart
      void (async () => {
        const guestItems = loadGuestCart();

        let dbItems: CartItem[] = [];
        try {
          const data = await apiFetch<{ items: CartItem[] }>('/cart');
          dbItems = data.items;
        } catch {
          // DB fetch failed — treat DB as empty; don't lose local guest items
        }

        const merged = mergeItems(dbItems, guestItems);

        try {
          await apiFetch<{ items: CartItem[] }>('/cart', {
            method: 'PUT',
            body: JSON.stringify({ items: merged }),
          });
        } catch {
          // Save failed — still show merged items in UI; next mutation will retry
        }

        clearGuestCart();
        dispatch({ type: 'SET_CART', items: merged });
      })();
    } else if (prevUser !== null && user === null) {
      // User just logged out — clear the in-memory cart
      dispatch({ type: 'SET_CART', items: [] });
    }
  }, [isLoading, user]);

  // ── Optimistic sync helper ────────────────────────────────────────────────

  // Persists cart changes:
  //   - Logged in: PUT /cart; rolls back to prevItems on failure
  //   - Guest:     write to localStorage (synchronous, no rollback needed)
  function syncCart(nextItems: CartItem[], prevItems: CartItem[]) {
    if (user) {
      void apiFetch<{ items: CartItem[] }>('/cart', {
        method: 'PUT',
        body: JSON.stringify({ items: nextItems }),
      }).catch(() => {
        // API call failed — roll back the optimistic UI update
        dispatch({ type: 'SET_CART', items: prevItems });
      });
    } else {
      saveGuestCart(nextItems);
    }
  }

  // ── Action handlers (optimistic: update UI first, then persist) ───────────

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const prev = state.items;
    const action: CartAction = { type: 'ADD_ITEM', item };
    const next = cartReducer(state, action).items;
    dispatch(action);
    syncCart(next, prev);
  };

  const removeItem = (productId: string, size: string) => {
    const prev = state.items;
    const action: CartAction = { type: 'REMOVE_ITEM', productId, size };
    const next = cartReducer(state, action).items;
    dispatch(action);
    syncCart(next, prev);
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    const prev = state.items;
    const action: CartAction = { type: 'UPDATE_QUANTITY', productId, size, quantity };
    const next = cartReducer(state, action).items;
    dispatch(action);
    syncCart(next, prev);
  };

  const clearCart = () => {
    const prev = state.items;
    dispatch({ type: 'CLEAR_CART' });
    syncCart([], prev);
  };

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
