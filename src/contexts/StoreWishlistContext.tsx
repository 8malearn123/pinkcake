import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from '@/hooks/use-toast';
import type { StoreProduct } from '@/hooks/useCustomerStore';

/**
 * Shared storefront wishlist (favourites). Frontend-only: persisted to
 * localStorage so saved items survive navigation and refresh. When the backend
 * is wired this becomes a server-side list keyed by product_id (see HANDOFF) —
 * the UI contract stays the same.
 */
interface StoreWishlistContextValue {
  items: StoreProduct[];
  has: (id: string) => boolean;
  toggle: (product: StoreProduct) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
}

const StoreWishlistContext = createContext<StoreWishlistContextValue | null>(null);
const STORAGE_KEY = 'pinkcake:wishlist:v1';

function loadInitial(): StoreProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoreProduct[]) : [];
  } catch {
    return [];
  }
}

export function StoreWishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoreProduct[]>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }, [items]);

  const has = useCallback((id: string) => items.some((p) => p.id === id), [items]);

  const toggle = useCallback((product: StoreProduct) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        toast({ title: 'أُزيلت من المفضلة', description: product.name });
        return prev.filter((p) => p.id !== product.id);
      }
      toast({ title: 'أُضيفت إلى المفضلة', description: product.name });
      return [product, ...prev];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, has, toggle, remove, clear, count: items.length }),
    [items, has, toggle, remove, clear],
  );

  return <StoreWishlistContext.Provider value={value}>{children}</StoreWishlistContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStoreWishlist() {
  const ctx = useContext(StoreWishlistContext);
  if (!ctx) throw new Error('useStoreWishlist must be used within a StoreWishlistProvider');
  return ctx;
}
