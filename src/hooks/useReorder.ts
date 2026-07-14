import { useNavigate } from 'react-router-dom';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import { CART_STORAGE_KEY } from '@/contexts/StoreCartContext';
import type { CartItem } from '@/hooks/useCustomerStore';
import { toast } from '@/hooks/use-toast';

type ReorderItem = { product_name: string; quantity: number };

/**
 * "أعد الطلب" — repopulate the storefront cart from a past order's items and send
 * the customer to the store with the cart open.
 *
 * Order items only carry `product_name` (no product_id), so we match by name
 * against the live catalogue. `/my-orders` lives OUTSIDE StoreCartProvider, so we
 * merge into the persisted cart (localStorage, key CART_STORAGE_KEY) which the
 * provider re-reads on mount — rather than the in-memory cart context.
 */
export function useReorder() {
  const { data: products } = usePublicStoreProducts();
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

    // Merge into the persisted cart (StoreCartProvider re-reads this on mount).
    let existing: CartItem[] = [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) existing = JSON.parse(raw) as CartItem[];
    } catch {
      existing = [];
    }
    const merged = existing.map((c) => ({ ...c }));
    for (const m of matched) {
      const found = merged.find((c) => c.product.id === m.product.id);
      if (found) found.quantity += m.quantity;
      else merged.push(m);
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* storage unavailable — nothing else we can do here */
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
