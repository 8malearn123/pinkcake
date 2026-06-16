import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { toast } from '@/hooks/use-toast';
import type { CartItem, StoreProduct } from '@/hooks/useCustomerStore';

/**
 * Shared storefront cart. Lifts the cart that used to live as local state inside
 * `Store.tsx` into a context so it can be shared across the storefront routes —
 * notably the product details page (`/product/:id`). Frontend-only: the cart is
 * in-memory React state; order submission still goes through
 * `useCreateCustomerOrder` (the backend seam stays untouched).
 *
 * The API mirrors the original Store handlers 1:1 so consuming code is unchanged.
 */
interface StoreCartContextValue {
  cart: CartItem[];
  /** Add a product (merging quantity into an existing line). */
  addToCart: (product: StoreProduct, quantity?: number) => void;
  /** Nudge a line's quantity by `delta`; drops the line at zero. */
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  clear: () => void;
  count: number;
  total: number;
  /** Cart sheet open state — the sheet is rendered once globally (CartSheet). */
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  open: () => void;
  close: () => void;
}

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const addToCart = useCallback((product: StoreProduct, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity }];
    });
    toast({ title: 'تمت الإضافة', description: `${product.name} تمت إضافته للسلة` });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

  const value = useMemo(
    () => ({ cart, addToCart, updateQuantity, removeFromCart, setCart, clear, count, total, isOpen, setOpen, open, close }),
    [cart, addToCart, updateQuantity, removeFromCart, clear, count, total, isOpen, open, close],
  );

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStoreCart() {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error('useStoreCart must be used within a StoreCartProvider');
  return ctx;
}
