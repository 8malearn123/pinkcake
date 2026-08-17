import { Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import { Reveal } from '@/components/Reveal';
import { CardRail } from '@/components/store/CardRail';
import { SECTION_DEFAULTS, type SectionContent } from '@/lib/homepage/schema';

// Faithful clone of the design's SeasonalCollection header + the shared card grid.
export function SeasonalSection({
  content = SECTION_DEFAULTS.seasonal,
  products,
  renderCard,
}: {
  content?: SectionContent['seasonal'];
  products: StoreProduct[];
  renderCard: (p: StoreProduct) => ReactNode;
}) {
  if (products.length === 0) return null;
  return (
    <section id="seasonal" className="bg-gradient-to-b from-seasonal-wash to-background px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1500px]">
        <Reveal className="flex flex-col justify-between gap-5 border-b border-seasonal/30 pb-6 sm:flex-row sm:items-end">
          <div>
            {content.eyebrow && (
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-[.08em] text-seasonal">
                <Sun size={15} /> {content.eyebrow}
              </p>
            )}
            <h2 className="mt-2 text-3xl font-black tracking-[-.01em] text-foreground sm:text-4xl">
              {content.title}
            </h2>
            {content.lede && (
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{content.lede}</p>
            )}
          </div>
          {content.badge && (
            <span className="self-start rounded-full bg-seasonal px-4 py-2 text-xs font-bold text-white sm:self-auto">
              {content.badge}
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
