import { useState } from 'react';
import { Cake, Plus, Check, Star, Heart } from 'lucide-react';
import { StoreProduct } from '@/hooks/useCustomerStore';
import { isSoldOut } from '@/hooks/usePublicStore';
import { cn } from '@/lib/utils';

interface ProductCardRefinedProps {
  product: StoreProduct;
  rating?: { average_rating: number; review_count: number };
  onAddToCart: () => void;
  onViewDetails?: () => void;
  onOpenReviews?: () => void;
  /** Controlled wishlist state. When omitted the heart falls back to local state. */
  isFav?: boolean;
  onToggleFav?: () => void;
}

export function ProductCardRefined({
  product,
  rating,
  onAddToCart,
  onViewDetails,
  onOpenReviews,
  isFav,
  onToggleFav,
}: ProductCardRefinedProps) {
  const [favLocal, setFavLocal] = useState(false);
  const fav = isFav ?? favLocal;
  const toggleFav = onToggleFav ?? (() => setFavLocal((f) => !f));
  const [added, setAdded] = useState(false);
  const soldOut = isSoldOut(product);

  const handleAdd = () => {
    if (soldOut) return;
    onAddToCart();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <article className="product-card group relative bg-card rounded-3xl overflow-hidden border border-border/60 hover:border-primary/40 shadow-soft-lift">
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

        {product.category && (
          <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-background/85 backdrop-blur text-[10px] font-medium text-foreground tracking-wide">
            {product.category}
          </span>
        )}

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
        {rating && rating.review_count > 0 && (
          <button onClick={onOpenReviews} className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="font-medium text-foreground">{rating.average_rating}</span>
            <span>· تقييم</span>
          </button>
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

        <div className="flex items-end justify-between mt-4 gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">السعر</div>
            <div className="font-display text-2xl text-primary leading-none mt-1">
              {product.price} <span className="text-xs text-muted-foreground font-sans">ر.س</span>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={soldOut ? 'نفد المخزون' : 'أضف إلى العربة'}
            className={cn(
              'add-btn press relative rounded-full h-11 w-11 shrink-0 shadow-rose-glow bg-foreground text-background',
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
    </article>
  );
}
