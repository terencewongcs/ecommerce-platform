import type { CartItem } from '../contexts/CartContext';

const CART_KEY = 'tu_guest_cart';

/** Load guest cart from localStorage. Returns [] if nothing stored or parse fails. */
export function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

/** Persist the current cart items to localStorage. */
export function saveGuestCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

/** Remove the guest cart from localStorage (called after post-login merge). */
export function clearGuestCart(): void {
  localStorage.removeItem(CART_KEY);
}
