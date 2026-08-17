import { Cake, Check, Flame, Heart, Minus, Plus, ShoppingBag, Zap } from 'lucide-react';
import { Stars } from '@/components/store/Reviews';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface StoreProductCardProps {
  product: StoreProduct;
  rating?: { average_rating: number; review_count: number };
  inCart: number;
  isFavorite: boolean;
  onAdd: () => void;
  onRemoveOne: () => void;
  onToggleFavorite: () => void;
  onView?: () => void;
}

/**
 * Pink Cake storefront product card — conversion-first, premium-boutique.
 *
 * Price + concrete savings are the hero; every decision cue (real stars,
 * honest low-stock urgency, savings) is clustered around a bold gradient-berry
 * "أضف إلى السلة" anchor CTA. A fading-gold hairline separates the browse zone
 * from the buy zone, and a hover quick-add pill (which confirms with a green
 * check once in cart) offers a frictionless shortcut for power users.
 *
 * Pure presentational: lucide-only icons, hardcoded hex, logical RTL utilities,
 * CSS/group-hover transitions (no framer-motion), TS-strict.
 */
export function StoreProductCard({
  product,
  rating,
  inCart,
  isFavorite,
  onAdd,
  onRemoveOne,
  onToggleFavorite,
  onView,
}: StoreProductCardProps) {
  const originalPrice = product.compare_at_price ?? undefined;
  const discount =
    originalPrice && originalPrice > product.price
      ? Math.round((1 - product.price / originalPrice) * 100)
      : 0;
  const reviews = rating?.review_count ?? 0;
  const lowStock =
    product.stock != null && product.stock > 0 && product.stock <= 8;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_12px_40px_-26px_hsl(var(--primary)/0.4)] transition-all duration-300 hover:-translate-y-1.5 hover:border-border hover:shadow-[0_26px_60px_-28px_hsl(var(--primary)/0.55)]">
      {/* Media */}
      <div className="relative aspect-[4/5] overflow-hidden bg-blush">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-b from-blush to-border">
            <Cake size={56} strokeWidth={1.25} className="text-rose/40" />
          </div>
        )}

        {/* Soft bottom scrim for chip legibility + editorial depth */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-foreground/30 to-transparent" />

        {/* Deal + seasonal badges (top-end) */}
        <div className="pointer-events-none absolute end-3 top-3 z-10 flex flex-col items-end gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
              خصم {toArabicDigits(discount)}٪
            </span>
          )}
          {product.season && (
            <span className="rounded-full bg-seasonal px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
              🥭 موسمي
            </span>
          )}
        </div>

        {/* Wishlist (top-start) */}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `إزالة ${product.name} من المفضلة`
              : `إضافة ${product.name} إلى المفضلة`
          }
          className="absolute start-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Heart
            size={17}
            className={`transition-all duration-300 ${
              isFavorite ? 'scale-110 fill-primary text-primary' : 'text-muted-foreground'
            }`}
          />
        </button>

        {/* Category chip over the scrim */}
        {product.category && (
          <span className="pointer-events-none absolute bottom-3 start-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm backdrop-blur">
            {product.category}
          </span>
        )}

        {/* Quick-add — a mouse-hover shortcut that duplicates the main CTA below,
            so it's taken out of the tab order (keyboard users get the visible CTA)
            to avoid an invisible (opacity-0) focus stop. */}
        <button
          type="button"
          onClick={onAdd}
          tabIndex={-1}
          aria-label={
            inCart > 0
              ? `${product.name} في السلة، أضف المزيد`
              : `إضافة ${product.name} بسرعة`
          }
          className={`pointer-events-none absolute inset-x-3 bottom-3 z-20 flex translate-y-3 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 ${
            inCart > 0 ? 'bg-success text-white' : 'bg-white/95 text-primary'
          }`}
        >
          {inCart > 0 ? (
            <>
              <Check size={14} strokeWidth={3} /> في السلة ({toArabicDigits(inCart)})
            </>
          ) : (
            <>
              <Zap size={14} className="fill-gold text-gold" /> أضف بسرعة
            </>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="flex grow flex-col p-4">
        {/* Title doubles as a stretched-link: one keyboard tab-stop + accessible
            name that opens the product across the whole card (media + body). */}
        <h3 className="text-base font-semibold leading-6 text-foreground">
          {onView ? (
            <button
              type="button"
              onClick={onView}
              className="line-clamp-1 block w-full text-start transition-opacity hover:opacity-60 after:absolute after:inset-0 after:z-0 after:content-['']"
            >
              {product.name}
            </button>
          ) : (
            <span className="line-clamp-1 block">{product.name}</span>
          )}
        </h3>

        {/* Real social proof only */}
        {reviews > 0 && rating && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Stars rating={rating.average_rating} />
            <span className="text-[11px] font-bold text-muted-foreground">({toArabicDigits(reviews)})</span>
          </div>
        )}

        {product.description && (
          <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Decision zone — anchored to the bottom for a tidy grid. `relative z-10`
            keeps the CTA/stepper clickable above the title's stretched-link overlay. */}
        <div className="relative z-10 mt-auto pt-3">
          {/* Fading-gold hairline: browse zone → buy zone */}
          <div className="mb-3 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

          {/* Price hero + concrete savings */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="flex items-baseline gap-1 text-2xl font-semibold leading-none text-primary">
              {toArabicDigits(product.price)} <RiyalSymbol className="text-lg" />
            </span>
            {discount > 0 && (
              <span className="flex items-baseline gap-1 text-sm text-muted-foreground line-through">
                {toArabicDigits(originalPrice ?? 0)} <RiyalSymbol className="text-xs" />
              </span>
            )}
          </div>

          {/* Honest low-stock urgency — last cue before the click */}
          {lowStock && (
            <p className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-seasonal/10 px-2 py-1 text-[11px] font-bold text-seasonal">
              <Flame size={13} className="fill-seasonal" /> بقي {toArabicDigits(product.stock ?? 0)} قطع فقط!
            </p>
          )}

          {/* CTA — the visual anchor */}
          {inCart > 0 ? (
            <div className="cz-step mt-3 flex h-[46px] items-center justify-between rounded-xl border-2 border-primary bg-primary/[0.06] px-2">
              <button
                type="button"
                onClick={onRemoveOne}
                aria-label={`إنقاص كمية ${product.name}`}
                className="grid size-9 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10 active:scale-95"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-bold text-primary">
                {toArabicDigits(inCart)} في السلة
              </span>
              <button
                type="button"
                onClick={onAdd}
                aria-label={`زيادة كمية ${product.name}`}
                className="grid size-9 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10 active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`أضف ${product.name} إلى السلة`}
              className="mt-3 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-t from-pink-dark to-primary text-sm font-bold text-white shadow-[0_10px_24px_-10px_hsl(var(--primary)/0.75)] transition-all duration-200 hover:from-primary hover:to-rose hover:shadow-[0_16px_30px_-10px_hsl(var(--rose)/0.8)] active:scale-[.98]"
            >
              <ShoppingBag size={17} /> أضف إلى السلة
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
