import { useNavigate } from 'react-router-dom';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import { CART_STORAGE_KEY, useStoreCartOptional } from '@/contexts/StoreCartContext';
import type { CartItem } from '@/hooks/useCustomerStore';
import { toast } from '@/hooks/use-toast';

type ReorderItem = { product_name: string; quantity: number };

/**
 * "أعد الطلب" — repopulate the storefront cart from a past order's items and send
 * the customer to the store with the cart open.
 *
 * Order items only carry `product_name` (no product_id), so we match by name
 * against the live catalogue.
 *
 * ⚠ /track, /my-orders and /my-orders/:id all DO live inside StoreCartProvider
 * (App.tsx wraps them in StorefrontLayout). The provider seeds itself from
 * localStorage once via `useState(loadInitial)` and never remounts across those
 * routes, then writes the in-memory cart back on every change — so writing
 * storage and navigating silently lost the reorder. Go through the context when
 * it is there; keep the storage merge only for a consumer mounted outside it.
 */
export function useReorder() {
  const { data: products } = usePublicStoreProducts();
  const cart = useStoreCartOptional();
  const navigate = useNavigate();

  return (items: ReorderItem[] | null | undefined) => {
    if (!products) {
      toast({ title: 'يرجى المحاولة بعد لحظات', description: 'جاري تحميل المنتجات.' });
      return;
    }
    if (!items || items.length === 0) {
      toast({ title: 'لا يمكن إعادة الطلب', description: 'لا توجد أصناف في هذا الطلب.', variant: 'destructive' });
      return;
    }

    const byName = new Map(products.map((p) => [p.name.trim(), p]));
    const matched: CartItem[] = [];
    let skipped = 0;
    for (const it of items) {
      const product = byName.get(it.product_name.trim());
      // Honor the same availability guard as add-to-cart: skip products that are
      // gone from the catalogue OR now sold out (counted as "غير متوفّر").
      if (product && !isSoldOut(product)) matched.push({ product, quantity: it.quantity });
      else skipped += 1;
    }

    if (matched.length === 0) {
      toast({ title: 'تعذّرت إعادة الطلب', description: 'لم تعد أصناف هذا الطلب متوفرة في المتجر.', variant: 'destructive' });
      return;
    }

    const mergeInto = (existing: CartItem[]) => {
      const merged = existing.map((c) => ({ ...c }));
      for (const m of matched) {
        const found = merged.find((c) => c.product.id === m.product.id);
        if (found) found.quantity += m.quantity;
        else merged.push(m);
      }
      return merged;
    };

    if (cart) {
      cart.setCart(mergeInto);
      cart.open();
    } else {
      // Mounted outside StoreCartProvider — merge into the persisted cart, which
      // the provider seeds from on its next mount.
      let existing: CartItem[] = [];
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) existing = JSON.parse(raw) as CartItem[];
      } catch {
        existing = [];
      }
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mergeInto(existing)));
      } catch {
        /* storage unavailable — nothing else we can do here */
      }
    }

    toast({
      title: 'تمت إعادة الطلب',
      description: skipped > 0
        ? `أُضيفت ${matched.length} صنف إلى السلة؛ ${skipped} غير متوفّر حالياً.`
        : 'أُضيفت أصناف طلبك إلى السلة.',
    });
    navigate('/store', { state: { openCart: true } });
  };
}
