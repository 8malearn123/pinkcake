import { forwardRef } from 'react';
import { Check, ChevronLeft, Gift, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { Stars } from '@/components/store/Reviews';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, amountToFreeDelivery, freeDeliveryPct, hasFreeDelivery } from '@/lib/delivery';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface ProductBuyPanelProps {
  product: StoreProduct;
  rating?: { average_rating: number; review_count: number };
  discount: number;
  savings: number;
  soldOut: boolean;
  qty: number;
  added: boolean;
  /** Live cart total, so the free-delivery nudge can be honest about what's left. */
  cartTotal: number;
  onQtyChange: (next: number) => void;
  onAdd: () => void;
  onBuyNow: () => void;
  onSeeReviews: () => void;
  onOccasion: (occasion: string) => void;
  onCustomize: () => void;
}

const TRUST = [
  { icon: Truck, title: 'توصيل مبرّد', note: 'داخل جازان في يومك' },
  { icon: ShieldCheck, title: 'دفع آمن', note: 'مدى · فيزا · آبل باي' },
  { icon: Gift, title: 'تغليف هدايا', note: 'وبطاقة تهنئة مجاناً' },
];

/**
 * The buy panel — everything between "I like this" and "it's in my cart".
 *
 * Ordered as the decision actually runs: identity (name, real rating), then
 * price with the honest saving, then availability, then the single berry CTA,
 * and only afterwards the reassurance (delivery progress, trust, custom-cake
 * escape hatch). Every number shown is real catalogue or cart data — the
 * free-delivery line reads the same `lib/delivery` rules as the cart drawer and
 * checkout, so the three can't drift apart.
 *
 * `ref` lands on the CTA row: the page watches it to know when the desktop
 * sticky buy bar should take over.
 */
export const ProductBuyPanel = forwardRef<HTMLDivElement, ProductBuyPanelProps>(function ProductBuyPanel(
  {
    product,
    rating,
    discount,
    savings,
    soldOut,
    qty,
    added,
    cartTotal,
    onQtyChange,
    onAdd,
    onBuyNow,
    onSeeReviews,
    onOccasion,
    onCustomize,
  },
  ref,
) {
  const lineTotal = product.price * qty;
  const reviews = rating?.review_count ?? 0;
  const stock = product.stock ?? null;
  const lowStock = stock != null && stock > 0 && stock <= 8;
  const occasions = product.occasions ?? [];

  // Free-delivery nudge: what the basket looks like *after* this add — the only
  // framing that answers the question the shopper is actually asking.
  const projected = cartTotal + lineTotal;
  const unlocksNow = !hasFreeDelivery(cartTotal) && hasFreeDelivery(projected);
  const remaining = amountToFreeDelivery(projected);

  return (
    <div>
      {/* Eyebrow */}
      <div className="flex flex-wrap items-center gap-2">
        {product.category && (
          <span className="rounded-full bg-[#f6ecef] px-3 py-1 text-[11px] font-bold text-[#9e3a5c]">
            {product.category}
          </span>
        )}
        {product.season && (
          <span className="rounded-full bg-[#e8942f]/10 px-3 py-1 text-[11px] font-bold text-[#c97a1f]">
            🥭 تشكيلة {product.season}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#8a6570]">
          <span className="size-1.5 rounded-full bg-[#ddbd75]" /> تُخبز في جازان
        </span>
      </div>

      <h1 className="mt-4 text-[2rem] font-black leading-[1.15] tracking-[-.03em] text-[#2c2226] sm:text-[2.6rem] lg:text-[3rem]">
        {product.name}
      </h1>

      {/* Real social proof only — no invented star counts */}
      <button
        type="button"
        onClick={onSeeReviews}
        className="mt-3 flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
      >
        <Stars rating={rating?.average_rating ?? 0} size={16} />
        {reviews > 0 && rating ? (
          <span className="text-[#7d6870]">
            <b className="font-black text-[#2c2226]">{toArabicDigits(rating.average_rating)}</b> ·{' '}
            <span className="underline decoration-[#ddbd75] decoration-2 underline-offset-4">
              {toArabicDigits(reviews)} تقييم
            </span>
          </span>
        ) : (
          <span className="text-[#7d6870] underline decoration-[#ddbd75] decoration-2 underline-offset-4">
            كوني أول من يقيّمها
          </span>
        )}
      </button>

      {product.description && (
        <p className="mt-5 max-w-prose text-[15px] leading-8 text-[#5f4d54]">{product.description}</p>
      )}

      {/* Fading-gold hairline: story zone → buy zone (same cue as the cards) */}
      <div className="my-6 h-px bg-gradient-to-r from-[#ddbd75]/70 via-[#ddbd75]/25 to-transparent" />

      {/* Price */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <span className="flex items-baseline gap-1.5 text-[2.75rem] font-black leading-none text-[#9e3a5c]">
          {toArabicDigits(product.price)} <RiyalSymbol className="text-2xl" />
        </span>
        {discount > 0 && (
          <>
            <span className="flex items-baseline gap-1 pb-1 text-lg text-[#a49d97] line-through">
              {toArabicDigits(product.compare_at_price ?? 0)} <RiyalSymbol className="text-sm" />
            </span>
            <span className="mb-1 flex items-baseline gap-1 rounded-full bg-[#ddbd75]/20 px-3 py-1 text-xs font-black text-[#9a7a2c]">
              وفّرت {toArabicDigits(savings)} <RiyalSymbol className="text-[11px]" />
            </span>
          </>
        )}
      </div>

      {/* Availability — one honest line */}
      <p className="mt-3 flex items-center gap-2 text-[13px] font-bold">
        {soldOut ? (
          <span className="flex items-center gap-2 text-[#9e3a5c]">
            <span className="size-2 rounded-full bg-[#9e3a5c]" /> نفدت الكمية — جرّبي تشكيلتنا المشابهة أدناه
          </span>
        ) : lowStock ? (
          <span className="flex items-center gap-2 text-[#e8942f]">
            <span className="size-2 animate-pulse rounded-full bg-[#e8942f]" /> بقي {toArabicDigits(stock ?? 0)} قطع فقط لهذا اليوم
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[#2c7a5f]">
            <span className="size-2 rounded-full bg-[#2c7a5f]" /> متوفّرة الآن · تُحضّر طازجة عند الطلب
          </span>
        )}
        <span className="text-[#a49d97]">|</span>
        <span className="text-[#7d6870]">تكفي ٨–١٢ شخصاً</span>
      </p>

      {/* Occasions — real catalogue tags, each one a way back into the shop */}
      {occasions.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-bold tracking-[.08em] text-[#b0506e]">مناسبة لـ</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {occasions.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => onOccasion(o)}
                className="rounded-full border border-[#9e3a5c]/20 px-3.5 py-1.5 text-xs font-bold text-[#8a6570] transition-colors hover:border-[#9e3a5c] hover:bg-[#fbeef2] hover:text-[#9e3a5c]"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + CTA */}
      <div ref={ref} className="mt-7 flex flex-wrap items-center gap-3">
        {/* Full width on phones, where it wraps onto its own row and a
            start-hugging pill would read as an orphan next to the CTA. */}
        {!soldOut && (
          <div className="flex h-[58px] w-full items-center justify-between rounded-2xl border-2 border-[#9e3a5c]/15 bg-[#fffdfa] px-1.5 sm:w-auto sm:justify-start">
            <button
              type="button"
              onClick={() => onQtyChange(Math.max(1, qty - 1))}
              disabled={qty <= 1}
              aria-label="إنقاص الكمية"
              className="grid size-11 place-items-center rounded-xl text-[#9e3a5c] transition-colors hover:bg-[#fbeef2] disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <Minus size={17} strokeWidth={2.5} />
            </button>
            <span className="w-11 text-center text-lg font-black text-[#2c2226]">{toArabicDigits(qty)}</span>
            <button
              type="button"
              onClick={() => onQtyChange(qty + 1)}
              aria-label="زيادة الكمية"
              className="grid size-11 place-items-center rounded-xl text-[#9e3a5c] transition-colors hover:bg-[#fbeef2]"
            >
              <Plus size={17} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onAdd}
          disabled={soldOut}
          className={`flex h-[58px] min-w-[220px] flex-1 items-center justify-center gap-2.5 rounded-2xl text-base font-black text-white shadow-[0_16px_34px_-14px_rgba(158,58,92,0.8)] transition-all duration-200 active:scale-[.98] ${
            soldOut
              ? 'cursor-not-allowed bg-[#c3adb5] shadow-none'
              : added
                ? 'bg-[#2c7a5f]'
                : 'bg-gradient-to-t from-[#8a3251] to-[#9e3a5c] hover:from-[#9e3a5c] hover:to-[#b0506e] hover:shadow-[0_22px_40px_-14px_rgba(176,80,110,0.85)]'
          }`}
        >
          {soldOut ? (
            'نفدت الكمية'
          ) : added ? (
            <>
              <Check size={19} strokeWidth={3} /> تمت الإضافة إلى السلة
            </>
          ) : (
            <>
              <ShoppingBag size={19} /> أضف إلى السلة ·{' '}
              <span className="flex items-baseline gap-1">
                {toArabicDigits(lineTotal)} <RiyalSymbol className="text-sm" />
              </span>
            </>
          )}
        </button>
      </div>

      {!soldOut && (
        <button
          type="button"
          onClick={onBuyNow}
          className="mt-3 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#9e3a5c]/25 text-sm font-black text-[#9e3a5c] transition-colors hover:border-[#9e3a5c] hover:bg-[#fbeef2] active:scale-[.99]"
        >
          اشترِ الآن وأكمل الطلب
          <ChevronLeft size={17} />
        </button>
      )}

      {/* Free-delivery progress — the same rule the cart and checkout use */}
      {!soldOut && (
        <div className="mt-5 rounded-2xl border border-[#ddbd75]/40 bg-[#fffaf0] p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold text-[#7a5f2a]">
            <Truck size={16} className="shrink-0 text-[#c9a55e]" />
            {unlocksNow ? (
              <span>هذي الإضافة تخلّي توصيلك مجاني 🎉</span>
            ) : remaining === 0 ? (
              <span className="flex items-baseline gap-1">
                توصيلك مجاني — تجاوزت {toArabicDigits(FREE_DELIVERY_THRESHOLD)} <RiyalSymbol className="text-[11px]" />
              </span>
            ) : (
              <span>
                باقي{' '}
                <b className="text-[#9e3a5c]">
                  {toArabicDigits(remaining)} <RiyalSymbol className="text-[11px]" />
                </b>{' '}
                على التوصيل المجاني — بدلاً من {toArabicDigits(DELIVERY_FEE)} <RiyalSymbol className="text-[11px]" />
              </span>
            )}
          </p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#ddbd75]/25">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ddbd75] to-[#c9a55e] transition-[width] duration-700"
              style={{ width: `${freeDeliveryPct(projected)}%` }}
            />
          </div>
        </div>
      )}

      {/* Trust trio */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {TRUST.map(({ icon: Icon, title, note }) => (
          <div key={title} className="rounded-2xl bg-[#f6ecef]/70 px-3 py-3.5 text-center">
            <Icon size={18} className="mx-auto text-[#9e3a5c]" />
            <p className="mt-2 text-[12px] font-black text-[#2c2226]">{title}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-[#8a6570]">{note}</p>
          </div>
        ))}
      </div>

      {/* Custom-cake escape hatch — for the shopper this one isn't quite right for */}
      <button
        type="button"
        onClick={onCustomize}
        className="group/custom mt-4 flex w-full items-center gap-3.5 rounded-2xl border border-[#9e3a5c]/15 bg-gradient-to-l from-[#fbeef2] to-[#fffdfa] p-4 text-start transition-colors hover:border-[#9e3a5c]/40"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#9e3a5c] text-white">
          <Sparkles size={19} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-black text-[#2c2226]">تبين تصميماً خاصاً بك؟</span>
          <span className="mt-0.5 block text-xs leading-5 text-[#7d6870]">
            اختاري الشكل والنكهة والرسالة — ونجهّزها لمناسبتك.
          </span>
        </span>
        <ChevronLeft size={18} className="shrink-0 text-[#9e3a5c] transition-transform duration-300 group-hover/custom:-translate-x-1" />
      </button>
    </div>
  );
});
