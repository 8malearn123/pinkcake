import { Cake, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Stars } from '@/components/store/Reviews';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import { productImageUrl } from '@/lib/productImages';

interface StickyBuyBarProps {
  product: StoreProduct;
  rating?: { average_rating: number; review_count: number };
  qty: number;
  soldOut: boolean;
  added: boolean;
  /** Desktop bar only appears once the real CTA has scrolled out of view. */
  showDesktop: boolean;
  onQtyChange: (next: number) => void;
  onAdd: () => void;
}

/**
 * Buy affordance that follows the shopper.
 *
 * Phones always carry the bar (the CTA is far above the fold once the story
 * starts). Desktop only reveals it after the real CTA leaves the viewport, so
 * the fold isn't cluttered with two copies of the same button.
 */
export function StickyBuyBar({
  product,
  rating,
  qty,
  soldOut,
  added,
  showDesktop,
  onQtyChange,
  onAdd,
}: StickyBuyBarProps) {
  const lineTotal = product.price * qty;

  const ctaClass = `flex items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition-all duration-200 active:scale-[.98] ${
    soldOut
      ? 'cursor-not-allowed bg-muted-foreground'
      : added
        ? 'bg-success'
        : 'bg-gradient-to-t from-pink-dark to-primary shadow-[0_12px_26px_-12px_hsl(var(--primary)/0.85)] hover:from-primary hover:to-rose'
  }`;

  const ctaLabel = soldOut ? (
    'نفدت'
  ) : added ? (
    <>
      <Check size={17} strokeWidth={3} /> تمت الإضافة
    </>
  ) : (
    <>
      <ShoppingBag size={17} /> أضف إلى السلة
    </>
  );

  return (
    <>
      {/* Desktop takeover */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 hidden border-t border-primary/10 bg-background/95 backdrop-blur transition-transform duration-500 lg:block ${
          showDesktop ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-5 py-3.5 sm:px-8 lg:px-12">
          <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-blush">
            {product.image_url ? (
              <img
                src={productImageUrl(product.image_url, 'thumb')}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center">
                <Cake size={20} className="text-rose/40" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-foreground">
              {product.name}
            </p>
            {rating && rating.review_count > 0 && (
              <span className="mt-1 flex items-center gap-1.5">
                <Stars rating={rating.average_rating} size={12} />
                <span className="text-[11px] font-bold text-muted-foreground">
                  ({toArabicDigits(rating.review_count)})
                </span>
              </span>
            )}
          </div>

          <div className="ms-auto flex items-center gap-4">
            <span className="flex items-baseline gap-1.5 text-2xl font-black text-primary">
              {toArabicDigits(lineTotal)} <RiyalSymbol className="text-base" />
            </span>

            {!soldOut && (
              <div className="inline-flex h-12 items-center rounded-2xl border-2 border-primary/15 px-1">
                <button
                  type="button"
                  onClick={() => onQtyChange(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  aria-label="إنقاص الكمية"
                  className="grid size-9 place-items-center rounded-xl text-primary transition-colors hover:bg-blush disabled:opacity-35"
                >
                  <Minus size={15} strokeWidth={2.5} />
                </button>
                <span className="w-8 text-center text-sm font-black text-foreground">
                  {toArabicDigits(qty)}
                </span>
                <button
                  type="button"
                  onClick={() => onQtyChange(qty + 1)}
                  aria-label="زيادة الكمية"
                  className="grid size-9 place-items-center rounded-xl text-primary transition-colors hover:bg-blush"
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onAdd}
              disabled={soldOut}
              className={`${ctaClass} h-12 px-8`}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Phone bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[10px] font-bold tracking-[.08em] text-muted-foreground">
              الإجمالي
            </p>
            <p className="flex items-baseline gap-1 text-xl font-black leading-tight text-primary">
              {toArabicDigits(lineTotal)} <RiyalSymbol className="text-xs" />
            </p>
          </div>

          {!soldOut && (
            <div className="inline-flex h-12 shrink-0 items-center rounded-2xl border-2 border-primary/15 px-0.5">
              <button
                type="button"
                onClick={() => onQtyChange(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                aria-label="إنقاص الكمية"
                className="grid size-9 place-items-center rounded-xl text-primary disabled:opacity-35"
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>
              <span className="w-6 text-center text-sm font-black text-foreground">
                {toArabicDigits(qty)}
              </span>
              <button
                type="button"
                onClick={() => onQtyChange(qty + 1)}
                aria-label="زيادة الكمية"
                className="grid size-9 place-items-center rounded-xl text-primary"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onAdd}
            disabled={soldOut}
            className={`${ctaClass} h-12 flex-1`}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </>
  );
}
