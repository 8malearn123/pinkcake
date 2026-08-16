import { Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import { Reveal } from '@/components/Reveal';
import { CardRail } from '@/components/store/CardRail';

// Faithful clone of the design's SeasonalCollection header + the shared card grid.
export function SeasonalSection({
  products,
  renderCard,
}: {
  products: StoreProduct[];
  renderCard: (p: StoreProduct) => ReactNode;
}) {
  if (products.length === 0) return null;
  return (
    <section id="seasonal" className="bg-gradient-to-b from-seasonal-wash to-background px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1500px]">
        <Reveal className="flex flex-col justify-between gap-5 border-b border-seasonal/30 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-[.08em] text-seasonal">
              <Sun size={15} /> تشكيلة الصيف · لفترة محدودة
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.01em] text-foreground sm:text-4xl">
              موسم المنجا الجازانية 🥭
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
              من مزارع جازان مباشرةً — منجا طبيعية طازجة في تورتات وتشيز كيك بنكهة الصيف. متوفرة ما دام الموسم مستمر.
            </p>
          </div>
          <span className="self-start rounded-full bg-seasonal px-4 py-2 text-xs font-bold text-white sm:self-auto">
            نفاد سريع — احجز الآن
          </span>
        </Reveal>
        <CardRail className="mt-8 sm:mt-9 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
          {products.map((p) => renderCard(p))}
        </CardRail>
      </div>
    </section>
  );
}
