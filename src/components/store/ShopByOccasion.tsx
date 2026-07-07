import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder occasion imagery (design phase). Swap for owned/CDN assets later.
const OCCASIONS = [
  { title: 'أعياد الميلاد', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=600&q=80' },
  { title: 'أعراس وخطوبة', img: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=600&q=80' },
  { title: 'تخرّج ونجاح', img: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=80' },
  { title: 'شكراً وامتنان', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80' },
];

// Bento layout: one large feature tile, one wide tile, two small tiles.
const BENTO = [
  'md:col-span-2 md:row-span-2',
  'md:col-span-2',
  'md:col-span-1',
  'md:col-span-1',
];

interface ShopByOccasionProps {
  onShop: () => void;
  onOccasion: (occasion: string) => void;
}

export function ShopByOccasion({ onShop, onOccasion }: ShopByOccasionProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-primary tracking-widest uppercase font-medium">تسوّق حسب المناسبة</div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl mt-1 leading-none">لكلِّ لحظة كيكتها</h2>
        </div>
        <button onClick={onShop} className="group text-sm text-primary font-medium inline-flex items-center gap-1.5">
          كل المناسبات <ArrowLeft className="cta-arrow w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2 md:h-[32rem] lg:h-[38rem]">
        {OCCASIONS.map((o, i) => {
          const featured = i === 0;
          return (
            <button
              key={o.title}
              onClick={() => onOccasion(o.title)}
              className={cn(
                'occasion group relative block overflow-hidden rounded-3xl shadow-soft-lift text-start aspect-[4/5] md:aspect-auto md:h-full',
                BENTO[i]
              )}
            >
              <img src={o.img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, hsl(var(--foreground)/.88), hsl(var(--foreground)/.05) 62%)' }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
                <div className={cn('font-display leading-tight', featured ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl')}>
                  {o.title}
                </div>
                <div className="go mt-1 inline-flex items-center gap-1 text-xs text-white/90">
                  تسوّق <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
