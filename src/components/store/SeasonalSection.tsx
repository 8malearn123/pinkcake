import { Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import { Reveal } from '@/components/Reveal';
import { CardRail } from '@/components/store/CardRail';
import { useStorefrontPromos } from '@/hooks/useStorefrontPromos';

// Faithful clone of the design's SeasonalCollection header + the shared card grid.
//
// عناوين الشريط تُحرَّر من «التسويق» ← خانة «شريط الموسم». الموسم يتغيّر أربع
// مرّات في السنة على الأقل، فتثبيت «موسم المنجا» في الشيفرة يعني نشراً كل مرّة.
export function SeasonalSection({
  products,
  renderCard,
}: {
  products: StoreProduct[];
  renderCard: (p: StoreProduct) => ReactNode;
}) {
  const { slot } = useStorefrontPromos();
  const promo = slot('seasonal_band');

  // القسم مربوط بوجود منتجات موسمية فعلاً — عنوان موسم بلا منتجات وعدٌ فارغ.
  if (products.length === 0 || !promo) return null;

  return (
    <section id="seasonal" className="bg-gradient-to-b from-seasonal-wash to-background px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1500px]">
        <Reveal className="flex flex-col justify-between gap-5 border-b border-seasonal/30 pb-6 sm:flex-row sm:items-end">
          <div>
            {promo.eyebrow && (
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-[.08em] text-seasonal">
                <Sun size={15} /> {promo.eyebrow}
              </p>
            )}
            <h2 className="mt-2 text-3xl font-black tracking-[-.01em] text-foreground sm:text-4xl">
              {promo.title}
            </h2>
            {promo.subtitle && (
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                {promo.subtitle}
              </p>
            )}
          </div>
          {promo.ctaLabel && (
            <span className="self-start rounded-full bg-seasonal px-4 py-2 text-xs font-bold text-white sm:self-auto">
              {promo.ctaLabel}
            </span>
          )}
        </Reveal>
        <CardRail className="mt-8 sm:mt-9 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
          {products.map((p) => renderCard(p))}
        </CardRail>
      </div>
    </section>
  );
}
