import { Plus, Star, Cake } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { LowStockBadge } from '@/components/store/LowStockBadge';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface QuickAddRailProps {
  title: string;
  subtitle?: string;
  products: StoreProduct[];
  ratingsMap?: Record<string, { average_rating: number; review_count: number }>;
  onAdd: (p: StoreProduct) => void;
  onView: (p: StoreProduct) => void;
}

/**
 * Reusable RTL horizontal snap-scroll rail of compact product cards with a
 * one-tap quick-add — keeps genuinely relevant items (top-rated, complements)
 * shoppable without leaving the page. Real ratings + honest low-stock only.
 */
export function QuickAddRail({ title, subtitle, products, ratingsMap, onAdd, onView }: QuickAddRailProps) {
  if (!products || products.length === 0) return null;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl leading-none">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x scrollbar-none -mx-4 px-4 scroll-ps-4 pb-2">
        {products.map((p) => {
          const r = ratingsMap?.[p.id];
          return (
            <article
              key={p.id}
              className="snap-start shrink-0 w-[220px] bg-card rounded-3xl overflow-hidden border border-border/60 hover:border-primary/40 shadow-soft-lift transition-colors"
            >
              <button
                onClick={() => onView(p)}
                aria-label={`عرض ${p.name}`}
                className="block w-full aspect-[5/4] relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--secondary)))' }}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center"><Cake className="w-10 h-10 text-primary/30" /></span>
                )}
                <span className="absolute top-2 start-2"><LowStockBadge stock={p.stock} /></span>
              </button>
              <div className="p-3">
                <button onClick={() => onView(p)} className="block text-start w-full press">
                  <h3 className="font-display text-base leading-tight line-clamp-1 hover:text-primary transition-colors">{p.name}</h3>
                </button>
                {r && r.review_count > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span className="font-medium text-foreground">{r.average_rating}</span>
                    <span>({r.review_count})</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="font-display text-lg text-primary leading-none">
                    {p.price} <RiyalSymbol className="text-sm text-muted-foreground" />
                  </div>
                  <button
                    onClick={() => onAdd(p)}
                    aria-label={`أضف ${p.name} إلى العربة`}
                    className="press rounded-full h-9 w-9 shrink-0 bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center shadow-rose-glow"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
