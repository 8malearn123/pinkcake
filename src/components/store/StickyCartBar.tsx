import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { RiyalSymbol } from '@/components/ui/riyal';
import { amountToFreeDelivery, hasFreeDelivery } from '@/lib/delivery';

/**
 * Mobile-only bottom cart bar — a persistent one-tap path to checkout where
 * abandonment is highest. Shows the live count + total + the real free-delivery
 * nudge. Visible only when the cart has items.
 */
const toAr = (n: number) => n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);

export function StickyCartBar() {
  const { count, total, open, isOpen } = useStoreCart();
  // Hide when the cart sheet is open; the z-index sits below modal overlays (z-50)
  // so it never paints over the cart sheet or the checkout dialog's confirm button.
  if (count === 0 || isOpen) return null;

  const remaining = amountToFreeDelivery(total);
  const free = hasFreeDelivery(total);

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pt-2 bg-background/95 backdrop-blur-xl border-t border-border/60"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.6rem)' }}
    >
      <button
        onClick={open}
        className="press w-full rounded-full gradient-pink text-primary-foreground shadow-rose-glow h-14 ps-2 pe-5 flex items-center gap-3"
      >
        <span className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white/20 shrink-0">
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-1 -start-1 min-w-[18px] h-[18px] px-1 bg-background text-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {toAr(count)}
          </span>
        </span>
        <span className="flex-1 text-start min-w-0">
          <span className="block text-sm font-bold leading-tight">عرض السلة</span>
          <span className="block text-[11px] text-primary-foreground/85 leading-tight truncate">
            {free ? 'حصلت على التوصيل المجاني ✓' : <>أضِف {toAr(remaining)} <RiyalSymbol /> للتوصيل المجاني</>}
          </span>
        </span>
        <span className="font-display text-lg shrink-0">
          {toAr(total)} <RiyalSymbol className="text-sm" />
        </span>
        <ArrowLeft className="w-4 h-4 shrink-0" />
      </button>
    </div>
  );
}
