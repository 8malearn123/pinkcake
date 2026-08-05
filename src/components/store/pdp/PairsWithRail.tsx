import { Cake, Check, Plus } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface PairsWithRailProps {
  items: StoreProduct[];
  /** Quantity of each suggestion already in the cart, so the row can confirm. */
  inCart: (id: string) => number;
  onAdd: (product: StoreProduct) => void;
  onView: (product: StoreProduct) => void;
}

/**
 * "Goes well with it" — a slim add-on rail directly under the buy panel, where
 * basket-building actually happens.
 *
 * Suggestions come from `useComplementSuggestions` (shared category/occasion,
 * then real rating) — an honest attribute match, not a fabricated
 * "frequently bought together" claim, because no co-purchase data exists.
 * Adding never leaves the page: the row confirms in place.
 */
export function PairsWithRail({ items, inCart, onAdd, onView }: PairsWithRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-3xl border border-[#f3e8ec] bg-[#fffdfa] p-5 shadow-[0_18px_50px_-38px_rgba(158,58,92,0.5)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="h-px w-6 bg-[#ddbd75]" />
        <p className="text-xs font-bold tracking-[.08em] text-[#b0506e]">تمام معها</p>
      </div>
      <h2 className="mt-2 text-xl font-black tracking-[-.01em] text-[#2c2226] sm:text-2xl">
        أضيفيها للطلب وخلّي السفرة كاملة
      </h2>

      <ul className="mt-5 space-y-3">
        {items.map((item) => {
          const qty = inCart(item.id);
          return (
            <li
              key={item.id}
              className="flex items-center gap-3.5 rounded-2xl border border-[#f6ecef] bg-[#fffdfa] p-2.5 transition-colors hover:border-[#e8d3db]"
            >
              <button
                type="button"
                onClick={() => onView(item)}
                aria-label={`عرض ${item.name}`}
                className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#fbeef2]"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center">
                    <Cake size={22} className="text-[#b0506e]/40" />
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onView(item)}
                  className="block w-full truncate text-start text-sm font-black text-[#2c2226] transition-opacity hover:opacity-60"
                >
                  {item.name}
                </button>
                {item.category && <p className="mt-0.5 text-[11px] text-[#8a6570]">{item.category}</p>}
                <p className="mt-1 flex items-baseline gap-1 text-sm font-black text-[#9e3a5c]">
                  {toArabicDigits(item.price)} <RiyalSymbol className="text-xs" />
                </p>
              </div>

              <button
                type="button"
                onClick={() => onAdd(item)}
                aria-label={qty > 0 ? `${item.name} في السلة، أضف المزيد` : `أضف ${item.name} إلى السلة`}
                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-black transition-all duration-200 active:scale-95 ${
                  qty > 0
                    ? 'bg-[#2c7a5f] text-white'
                    : 'border-2 border-[#9e3a5c]/25 text-[#9e3a5c] hover:border-[#9e3a5c] hover:bg-[#fbeef2]'
                }`}
              >
                {qty > 0 ? (
                  <>
                    <Check size={14} strokeWidth={3} /> {toArabicDigits(qty)}
                  </>
                ) : (
                  <>
                    <Plus size={14} strokeWidth={3} /> أضف
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
