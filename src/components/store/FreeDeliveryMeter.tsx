import { Truck, Check } from 'lucide-react';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { RiyalSymbol } from '@/components/ui/riyal';
import { amountToFreeDelivery, hasFreeDelivery, freeDeliveryPct } from '@/lib/delivery';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { cn } from '@/lib/utils';

/**
 * Free-delivery progress toward the real 200-﷼ threshold — the strongest honest
 * AOV nudge. Reads the live cart total; returns null when the cart is empty.
 * Reused under the header (sticky sub-bar), inside the cart drawer, and in the
 * mobile sticky bar. The saving it promises (the real 25-﷼ fee) is genuine.
 */
export function FreeDeliveryMeter({ variant = 'bar', className }: { variant?: 'bar' | 'compact'; className?: string }) {
  const { total } = useStoreCart();
  if (total <= 0) return null;

  const remaining = amountToFreeDelivery(total);
  const free = hasFreeDelivery(total);
  const pct = freeDeliveryPct(total);

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex items-center gap-2', variant === 'compact' ? 'text-[12px]' : 'text-xs sm:text-sm')}>
        {free ? <Check className="w-4 h-4 text-primary shrink-0" /> : <Truck className="w-4 h-4 text-primary shrink-0" />}
        <span className={free ? 'text-primary font-medium' : 'text-foreground/80'}>
          {free ? (
            'حصلت على التوصيل المجاني ✓'
          ) : (
            <>أضِف <b className="text-foreground">{toArabicDigits(remaining)} <RiyalSymbol /></b> لتحصل على التوصيل المجاني</>
          )}
        </span>
      </div>
      <div className={cn('h-1.5 rounded-full bg-secondary overflow-hidden', variant === 'compact' ? 'mt-1' : 'mt-1.5')}>
        <div className="h-full rounded-full gradient-pink transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
