import { Cake, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreProduct } from '@/hooks/useCustomerStore';
import { cn } from '@/lib/utils';

interface ProductCardRefinedProps {
  product: StoreProduct;
  rating?: { average_rating: number; review_count: number };
  onAddToCart: () => void;
  onViewDetails?: () => void;
  onOpenReviews?: () => void;
}

export function ProductCardRefined({
  product,
  rating,
  onAddToCart,
  onViewDetails,
  onOpenReviews,
}: ProductCardRefinedProps) {
  return (
    <article className="group relative bg-card rounded-3xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 shadow-soft-lift">
      {/* Image */}
      <button
        onClick={onViewDetails}
        className="block aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-blush to-secondary w-full"
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

        {rating && rating.review_count > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenReviews?.();
            }}
            className="absolute top-3 end-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background/85 backdrop-blur text-[11px] font-medium"
          >
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span>{rating.average_rating}</span>
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/95 via-card/30 to-transparent pointer-events-none" />
      </button>

      {/* Content */}
      <div className="p-4 -mt-6 relative z-10">
        <h3 className="font-display text-xl leading-tight line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-end justify-between mt-4 gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">السعر</div>
            <div className="font-display text-2xl text-primary leading-none mt-1">
              {product.price} <span className="text-xs text-muted-foreground font-sans">ر.س</span>
            </div>
          </div>
          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className={cn(
              'rounded-full h-11 w-11 shrink-0 shadow-rose-glow',
              'bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform'
            )}
            aria-label="أضف للسلة"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
