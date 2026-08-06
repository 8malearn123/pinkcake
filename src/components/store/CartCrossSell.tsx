import { useMemo } from 'react';
import { Plus, Cake } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useComplementSuggestions } from '@/hooks/useComplementSuggestions';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { productImageUrl } from '@/lib/productImages';

/**
 * In-drawer cross-sell — "أضِف لطلبك" at peak purchase intent. Suggests 2–3
 * REAL products that pair (shared category/occasion + rating) with what's
 * already in the cart, each a one-tap add that never leaves checkout. Opt-in
 * only, never pre-selected. Renders nothing when there are no suggestions.
 */
export function CartCrossSell() {
  const { cart, addToCart } = useStoreCart();
  const context = useMemo(() => cart.map((c) => c.product), [cart]);
  const excludeIds = useMemo(() => new Set(cart.map((c) => c.product.id)), [cart]);
  const suggestions = useComplementSuggestions({ context, excludeIds, limit: 3 });

  if (cart.length === 0 || suggestions.length === 0) return null;

  return (
    <div className="border-t pt-4">
      <div className="text-sm font-bold mb-2.5">أضِف لطلبك</div>
      <div className="space-y-2">
        {suggestions.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border/60 p-2">
            {p.image_url ? (
              <img src={productImageUrl(p.image_url, 'thumb')} alt={p.name} loading="lazy" decoding="async" className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-secondary grid place-items-center shrink-0">
                <Cake className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium line-clamp-1">{p.name}</div>
              <div className="text-primary font-display text-sm mt-0.5">
                {toArabicDigits(p.price)} <RiyalSymbol className="text-[11px] text-muted-foreground" />
              </div>
            </div>
            <button
              onClick={() => addToCart(p)}
              aria-label={`أضف ${p.name} إلى الطلب`}
              className="press rounded-full h-9 w-9 shrink-0 bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
