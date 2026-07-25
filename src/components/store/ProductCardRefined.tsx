import { useState } from 'react';
import { Cake, Plus, Minus, Check, Star, Heart, Sparkles } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { LowStockBadge } from '@/components/store/LowStockBadge';
import { StoreProduct } from '@/hooks/useCustomerStore';
import { isSoldOut } from '@/hooks/usePublicStore';
import { cn } from '@/lib/utils';

interface ProductCardRefinedProps {
  product: StoreProduct;
  rating?: { average_rating: number; review_count: number };
  onAddToCart: (quantity?: number) => void;
  onViewDetails?: () => void;
  onOpenReviews?: () => void;
  /** Controlled wishlist state. When omitted the heart falls back to local state. */
  isFav?: boolean;
  onToggleFav?: () => void;
  /** Marks the card as a curated "signature" pick — adds a rose توقيع pill + subtle ring. */
  featured?: boolean;
}

export function ProductCardRefined({
  product,
  rating,
  onAddToCart,
  onViewDetails,
  onOpenReviews,
  isFav,
  onToggleFav,
  featured = false,
}: ProductCardRefinedProps) {
  const [favLocal, setFavLocal] = useState(false);
  const fav = isFav ?? favLocal;
  const toggleFav = onToggleFav ?? (() => setFavLocal((f) => !f));
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const soldOut = isSoldOut(product);
  const hasDiscount = !!product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.compare_at_price as number)) * 100)
    : 0;

  const handleAdd = () => {
    if (soldOut) return;
    onAddToCart(qty);
    setAdded(true);
    setQty(1);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <article
      className={cn(
        'product-card group relative bg-card rounded-xl overflow-hidden border border-border/60 hover:border-primary/40 shadow-soft-lift',
        featured && 'ring-1 ring-primary/20'
      )}
    >
      {/* Image */}
      <div
        className="block aspect-[4/5] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--secondary)))' }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Cake className="w-16 h-16 text-primary/30" strokeWidth={1.25} />
          </div>
        )}

        <div className="absolute top-3 start-3 z-[2] flex flex-col items-start gap-1.5">
          {hasDiscount && (
            <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wide">
              خصم {toArabicDigits(discountPct)}٪
            </span>
          )}
          {product.season && (
            <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold tracking-wide">
              ☀︎ {product.season}
            </span>
          )}
          {product.category && (
            <span className="px-2.5 py-1 rounded-full bg-background/85 backdrop-blur text-[10px] font-medium text-foreground tracking-wide">
              {product.category}
            </span>
          )}
          {!soldOut && <LowStockBadge stock={product.stock} />}
        </div>

        {soldOut && (
          <div className="absolute inset-0 z-[2] bg-background/45 flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1.5 rounded-full bg-foreground/85 text-background text-xs font-bold backdrop-blur">نفد المخزون</span>
          </div>
        )}

        <button
          onClick={toggleFav}
          aria-label={fav ? 'إزالة من المفضلة' : 'أضِف للمفضلة'}
          aria-pressed={fav}
          className={cn(
            'fav-btn press absolute top-3 end-3 z-[2] w-9 h-9 rounded-full bg-background/85 backdrop-blur flex items-center justify-center',
            fav && 'is-fav'
          )}
        >
          <Heart className={cn('w-4 h-4 transition-colors', fav ? 'fill-primary text-primary' : 'text-foreground/70')} />
        </button>

        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(var(--card)/0.95), transparent)' }}
        />

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            aria-label={`عرض تفاصيل ${product.name}`}
            className="absolute inset-0 z-[1] cursor-pointer"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4 -mt-6 relative z-10">
        {featured && (
          <span className="inline-flex items-center gap-1 mb-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium tracking-wide">
            <Sparkles className="w-3 h-3" />
            توقيع
          </span>
        )}

        {onViewDetails ? (
          <button onClick={onViewDetails} className="block text-start w-full press">
            <h3 className="font-display text-xl leading-tight line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
          </button>
        ) : (
          <h3 className="font-display text-xl leading-tight line-clamp-1">{product.name}</h3>
        )}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">{product.description}</p>
        )}

        {/* Social proof placed at the add-to-cart decision point (real ratings only). */}
        {rating && rating.review_count > 0 && (
          <button onClick={onOpenReviews} className="flex items-center gap-1 text-[11px] text-muted-foreground mt-3">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="font-medium text-foreground">{toArabicDigits(rating.average_rating)}</span>
            <span>· {toArabicDigits(rating.review_count)} تقييم</span>
          </button>
        )}

        <div className="flex items-end justify-between mt-2 gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">السعر</div>
            <div className="flex items-baseline gap-2 mt-1">
              <div className="font-display text-2xl text-primary leading-none">
                {toArabicDigits(product.price)} <RiyalSymbol className="text-lg text-muted-foreground" />
              </div>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">{toArabicDigits(product.compare_at_price ?? 0)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!soldOut && (
              <div className="flex items-center rounded-full border border-border h-9 bg-card">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="إنقاص الكمية"
                  className="w-7 h-9 flex items-center justify-center text-foreground/70 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-medium tabular-nums">{toArabicDigits(qty)}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="زيادة الكمية"
                  className="w-7 h-9 flex items-center justify-center text-foreground/70"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={handleAdd}
              disabled={soldOut}
              aria-label={soldOut ? 'نفد المخزون' : 'أضف إلى العربة'}
              className={cn(
                'add-btn press relative rounded-full h-11 w-11 shadow-rose-glow bg-foreground text-background',
                'hover:bg-foreground/90 hover:scale-105 transition-transform flex items-center justify-center overflow-hidden',
                added && 'added',
                soldOut && 'opacity-40 cursor-not-allowed hover:scale-100 shadow-none'
              )}
            >
              <Plus className="icon-plus w-5 h-5" />
              <Check className="icon-check w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
