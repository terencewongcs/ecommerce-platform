import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { loadGuestCart, saveGuestCart, clearGuestCart } from '../lib/cartStorage';
import type { AuthUser } from '../hooks/useAuth';
import type { CartItem } from '@trendyuniquellc/types';

// Re-export so existing imports from this file continue to work.
export type { CartItem };

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; productId: string; size: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; size: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; items: CartItem[] }; // full replace, used for DB sync and init

// Pure reducer — used only to compute next state, not as a React state manager.
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
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Tracks the previous user value to detect login/logout transitions.
  // Initialized to `undefined` as a sentinel meaning "not yet seen any value".
  const prevUserRef = useRef<AuthUser | null | undefined>(undefined);

  // Guest cart — only active when the user is not logged in.
  const [guestItems, setGuestItems] = useState<CartItem[]>([]);

  // ── Authenticated cart query ──────────────────────────────────────────────
  // Only fires when auth has resolved and a user is logged in.
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiFetch<{ items: CartItem[] }>('/cart'),
    enabled: !!user && !isLoading,
  });

  // ── Mutation for any authenticated cart change ────────────────────────────
  // onMutate:   optimistically write to cache before the request
  // onError:    roll back to previous cache if request fails
  // onSettled:  re-fetch to guarantee server/client sync
  const updateCartMutation = useMutation({
    mutationFn: (items: CartItem[]) =>
      apiFetch<{ items: CartItem[] }>('/cart', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }),
    onMutate: async (newItems) => {
      // Cancel any in-flight refetch so it doesn't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const prev = queryClient.getQueryData<{ items: CartItem[] }>(['cart']);
      queryClient.setQueryData(['cart'], { items: newItems });
      return { prev }; // returned as `context` to onError
    },
    onError: (_, __, ctx) => {
      // Restore previous cart if the server rejects the mutation
      queryClient.setQueryData(['cart'], ctx?.prev);
    },
    onSettled: () => {
      // Always re-fetch to confirm actual server state
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // ── Cart initialisation & auth-transition handler ─────────────────────────
  useEffect(() => {
    if (isLoading) return; // wait for auth to resolve before touching cart

    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    if (prevUser === undefined) {
      // First time auth resolves
      if (!user) {
        // Guest: load from localStorage
        setGuestItems(loadGuestCart());
      }
      // Authenticated: cartQuery above handles fetching automatically
      return;
    }

    if (prevUser === null && user !== null) {
      // User just logged in — merge guest cart into DB cart
      void (async () => {
        const currentGuestItems = loadGuestCart();

        // fetchQuery uses cache if fresh, otherwise fetches from server
        let dbItems: CartItem[] = [];
        try {
          const data = await queryClient.fetchQuery({
            queryKey: ['cart'],
            queryFn: () => apiFetch<{ items: CartItem[] }>('/cart'),
          });
          dbItems = data.items;
        } catch {
          // DB fetch failed — merge guest items into empty DB cart
        }

        const merged = mergeItems(dbItems, currentGuestItems);

        // Immediately update cache for instant UI response
        queryClient.setQueryData(['cart'], { items: merged });

        // Persist merged cart to server
        updateCartMutation.mutate(merged);

        clearGuestCart();
        setGuestItems([]);
      })();
    } else if (prevUser !== null && user === null) {
      // User just logged out — clear server cache and switch to guest mode
      queryClient.removeQueries({ queryKey: ['cart'] });
      setGuestItems([]);
    }
  }, [isLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive current items from auth state ──────────────────────────────────
  // Authenticated: read from TanStack Query cache (auto-updated after mutations)
  // Guest:         read from local state (backed by localStorage)
  const items = user ? (cartQuery.data?.items ?? []) : guestItems;

  // Helper: compute next items by running an action through the pure reducer
  function computeNext(action: CartAction): CartItem[] {
    return cartReducer({ items }, action).items;
  }

  // ── Action handlers ───────────────────────────────────────────────────────

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const next = computeNext({ type: 'ADD_ITEM', item });
    if (user) {
      updateCartMutation.mutate(next);
    } else {
      setGuestItems(next);
      saveGuestCart(next);
    }
  };

  const removeItem = (productId: string, size: string) => {
    const next = computeNext({ type: 'REMOVE_ITEM', productId, size });
    if (user) {
      updateCartMutation.mutate(next);
    } else {
      setGuestItems(next);
      saveGuestCart(next);
    }
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    const next = computeNext({ type: 'UPDATE_QUANTITY', productId, size, quantity });
    if (user) {
      updateCartMutation.mutate(next);
    } else {
      setGuestItems(next);
      saveGuestCart(next);
    }
  };

  const clearCart = () => {
    if (user) {
      updateCartMutation.mutate([]);
    } else {
      setGuestItems([]);
      saveGuestCart([]);
    }
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalItems, subtotal, addItem, removeItem, updateQuantity, clearCart }}
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
