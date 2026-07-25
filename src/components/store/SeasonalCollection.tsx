import { Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface SeasonalCollectionProps {
  products: StoreProduct[];
  renderProduct: (p: StoreProduct) => ReactNode;
}

/**
 * Limited-time seasonal collection (products carrying a `season` tag). Warm
 * blush wash header + the shared product grid. Renders nothing when empty.
 */
export function SeasonalCollection({ products, renderProduct }: SeasonalCollectionProps) {
  if (products.length === 0) return null;
  const season = products[0].season;
  return (
    <section id="seasonal" className="rounded-[2rem] gradient-blush-warm border border-border/50 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-primary/20 pb-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-[.08em] text-primary">
            <Sun className="w-4 h-4" /> تشكيلة {season} · لفترة محدودة
          </p>
          <h2 className="font-display mt-2 text-3xl sm:text-4xl leading-tight text-foreground">أجواء {season} في كل قطعة ☀︎</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-foreground/70">
            نكهاتٌ منتقاة لهذا الموسم — طازجة ومتوفّرة ما دام الموسم مستمرّاً.
          </p>
        </div>
        <span className="self-start rounded-full gradient-pink px-4 py-2 text-xs font-bold text-primary-foreground sm:self-auto">
          نفادٌ سريع — احجزي الآن
        </span>
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {products.map((p) => renderProduct(p))}
      </div>
    </section>
  );
}
