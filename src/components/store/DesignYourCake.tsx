import { useState, type CSSProperties } from 'react';
import { Wand2, Minus, Cherry, Flower2, Flame, ShoppingBag, ArrowLeft, BadgeCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_BASE = 120;

interface SizeOpt { val: string; label: string; add: number; note: string }
interface FlavorOpt { val: string; label: string; cake: string; frost: string; add: number }
interface ToppingOpt { val: string; label: string; add: number; icon: LucideIcon }

const SIZES: SizeOpt[] = [
  { val: 'small', label: 'صغيرة', add: 0, note: 'صغيرة · 8–10 أشخاص' },
  { val: 'medium', label: 'وسط', add: 60, note: 'وسط · 15–20 شخص' },
  { val: 'large', label: 'كبيرة', add: 140, note: 'كبيرة · 25–30 شخص' },
];

const FLAVORS: FlavorOpt[] = [
  { val: 'vanilla', label: 'فانيلا', cake: '40 58% 84%', frost: '40 55% 95%', add: 0 },
  { val: 'chocolate', label: 'شوكولاتة', cake: '25 36% 36%', frost: '28 30% 55%', add: 20 },
  { val: 'strawberry', label: 'فراولة', cake: '345 62% 80%', frost: '345 70% 92%', add: 15 },
  { val: 'redvelvet', label: 'ريد فيلفت', cake: '355 55% 46%', frost: '350 42% 92%', add: 25 },
  { val: 'lotus', label: 'لوتس', cake: '30 46% 58%', frost: '32 50% 80%', add: 30 },
];

const TOPPINGS: ToppingOpt[] = [
  { val: 'none', label: 'بدون', add: 0, icon: Minus },
  { val: 'berries', label: 'توت طازج', add: 25, icon: Cherry },
  { val: 'roses', label: 'ورد سكّري', add: 35, icon: Flower2 },
  { val: 'candles', label: 'شموع', add: 10, icon: Flame },
];

function Topping({ kind }: { kind: string }) {
  if (kind === 'berries') {
    const colors = ['355 60% 45%', '340 55% 55%', '355 60% 45%', '280 35% 55%', '355 60% 45%'];
    return (
      <>
        {colors.map((c, i) => (
          <span key={i} className="berry" style={{ background: `hsl(${c})`, marginBottom: i % 2 ? 6 : 0 }} />
        ))}
      </>
    );
  }
  if (kind === 'roses') {
    return (
      <>
        {['345 55% 72%', '350 50% 80%', '345 55% 72%'].map((c, i) => (
          <span
            key={i}
            className="berry"
            style={{ width: 15, height: 15, background: `radial-gradient(circle at 35% 30%, #fff6, transparent 60%), hsl(${c})` }}
          />
        ))}
      </>
    );
  }
  if (kind === 'candles') {
    return (
      <>
        {[0, 1, 2].map((i) => (
          <span key={i} className="candle"><span className="flame" /></span>
        ))}
      </>
    );
  }
  return null;
}

export function DesignYourCake({ onAddCustom }: { onAddCustom: (total: number) => void }) {
  const [size, setSize] = useState<SizeOpt>(SIZES[1]);
  const [flavor, setFlavor] = useState<FlavorOpt>(FLAVORS[1]);
  const [topping, setTopping] = useState<ToppingOpt>(TOPPINGS[0]);
  const total = SIZE_BASE + size.add + flavor.add + topping.add;

  const cakeStyle = { '--cake': flavor.cake, '--frost': flavor.frost } as CSSProperties;

  return (
    <section id="design" className="scroll-mt-24">
      <div
        className="relative overflow-hidden rounded-[2rem] border border-border/60 shadow-soft-lift"
        style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--card)))' }}
      >
        <div className="grid md:grid-cols-2">
          {/* Controls */}
          <div className="p-7 md:p-10 lg:p-12 order-2 md:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs tracking-widest uppercase font-medium">
              <Wand2 className="w-3.5 h-3.5" /> صمّمي بنفسكِ
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mt-4 leading-tight">صمّمي كيكتكِ المثالية</h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-md">
              اختاري الحجم والنكهة واللمسة الأخيرة، وشاهدي كيكتكِ تتشكّل أمامكِ لحظة بلحظة.
            </p>

            {/* Size */}
            <div className="mt-7">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">الحجم</span>
                <span className="text-xs text-muted-foreground">{size.note}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setSize(s)}
                    className={cn(
                      'press rounded-xl border py-2.5 text-sm transition-colors',
                      size.val === s.val ? 'border-primary bg-primary/[0.08] font-semibold' : 'border-border bg-card'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Flavor */}
            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">النكهة</div>
              <div className="flex flex-wrap gap-2.5">
                {FLAVORS.map((f) => (
                  <button
                    key={f.val}
                    onClick={() => setFlavor(f)}
                    className={cn(
                      'press inline-flex items-center gap-2 rounded-full border ps-2 pe-3.5 py-1.5 text-sm transition-colors',
                      flavor.val === f.val ? 'border-primary bg-primary/[0.08] font-semibold' : 'border-border bg-card'
                    )}
                  >
                    <span className="w-4 h-4 rounded-full" style={{ background: `hsl(${f.cake})` }} />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topping */}
            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">اللمسة الأخيرة</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TOPPINGS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.val}
                      onClick={() => setTopping(t)}
                      className={cn(
                        'press rounded-xl border py-2.5 text-sm flex items-center justify-center gap-1.5 transition-colors',
                        topping.val === t.val ? 'border-primary bg-primary/[0.08] font-semibold' : 'border-border bg-card'
                      )}
                    >
                      <Icon className="w-4 h-4" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price + CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="shrink-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">الإجمالي التقديري</div>
                <div className="font-display text-3xl text-primary leading-none mt-1">
                  <span key={total} className="badge-pop inline-block">{total}</span>{' '}
                  <span className="text-sm text-muted-foreground">ر.س</span>
                </div>
              </div>
              <button
                onClick={() => onAddCustom(total)}
                className="group press sheen flex-1 min-w-[210px] rounded-full h-[52px] px-7 bg-foreground text-background font-semibold shadow-rose-glow hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" /> أضيفي تصميمكِ إلى العربة <ArrowLeft className="cta-arrow w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BadgeCheck className="w-4 h-4 text-primary" /> تعديلات مجانية غير محدودة قبل التأكيد
            </div>
          </div>

          {/* Live preview */}
          <div className="relative order-1 md:order-2 min-h-[340px] md:min-h-full flex items-end justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 noise-overlay opacity-30" />
            <div className="absolute top-6 end-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur border border-border/60 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> معاينة حيّة
            </div>
            <div className="relative z-10 w-full flex flex-col items-center justify-end pb-2">
              <div className="cake flex flex-col items-center justify-end" style={cakeStyle}>
                <div className="topping flex items-end justify-center gap-1.5 mb-[-3px] min-h-[20px]">
                  <Topping kind={topping.val} />
                </div>
                <div className={cn('tier', size.val !== 'large' && 'hidden')} style={{ width: 96, height: 54 }} />
                <div className={cn('tier', size.val === 'small' && 'hidden')} style={{ width: 140, height: 62 }} />
                <div className="tier" style={{ width: 188, height: 72 }} />
              </div>
              <div className="plate" style={{ width: 236 }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
