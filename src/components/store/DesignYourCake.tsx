import { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import '@/components/cake/cakeStudio.css';
import {
  SHAPES, FLAVORS, COLORS, DESIGNS, buildCake, miniCakeHTML, price, makeCustomColor, type CakeConfig,
} from '@/lib/cakeBuilder';
import { Wand2, ShoppingBag, SlidersHorizontal, Users, Star, Pipette } from 'lucide-react';

// A complete (compatible) config so the live cake renders immediately and the
// selections carry straight into /customize.
const initial: CakeConfig = {
  shape: SHAPES[1],   // classic
  flavor: FLAVORS[0], // vanilla bourbon
  color: COLORS[1],   // blush
  design: DESIGNS[0], // minimal
  text: '',
  addons: { candle: false, topper: false },
};

const STAGE_BG =
  'radial-gradient(70% 56% at 50% 30%, hsl(28 44% 97.5%), transparent 72%), linear-gradient(180deg, hsl(28 30% 97%), hsl(20 18% 93.5%))';
const THUMB_BG = 'radial-gradient(80% 70% at 50% 40%, hsl(28 38% 97%), hsl(28 22% 92%))';

interface DesignYourCakeProps {
  onAddCustom: (total: number, summary: string) => void;
  onCustomizeMore: (cfg: CakeConfig) => void;
}

export function DesignYourCake({ onAddCustom, onCustomizeMore }: DesignYourCakeProps) {
  const [cfg, setCfg] = useState<CakeConfig>(initial);
  const wrapRef = useRef<HTMLDivElement>(null);

  const total = price(cfg);
  const art = useMemo(() => buildCake(cfg), [cfg]);
  const summary = [cfg.shape?.name, cfg.flavor?.name, cfg.color.name].filter(Boolean).join(' · ');

  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    w.classList.remove('settle');
    void w.offsetWidth;
    w.classList.add('settle');
  }, [art]);

  const set = (patch: Partial<CakeConfig>) => setCfg((c) => ({ ...c, ...patch }));

  return (
    <section id="design" className="scroll-mt-24">
      <div
        className="relative rounded-[2rem] border border-border/60 shadow-soft-lift"
        style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--card)))' }}
      >
        <div className="grid md:grid-cols-2">
          {/* Live premium preview (shared with /customize). Sticky on mobile AND
              desktop so the cake stays in view while choosing. */}
          <div
            className="order-1 md:order-2 self-start sticky top-16 md:top-5 z-10 md:m-3
                       h-[440px] md:h-[600px] flex items-center justify-center overflow-hidden
                       rounded-t-[2rem] md:rounded-[1.6rem]"
            style={{ background: STAGE_BG }}
          >
            <div className="absolute inset-0 noise-overlay opacity-30" />
            <div className="absolute top-5 end-5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/85 backdrop-blur border border-border/60 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> معاينة حيّة
            </div>

            <div className="cake-studio cz-embed relative z-[5] w-full pb-4 md:pb-6">
              <div className="cz-scene">
                <div className="cake-wrap" ref={wrapRef}>
                  <div className="cake" dangerouslySetInnerHTML={{ __html: art.cake }} />
                  <div className="stand" dangerouslySetInnerHTML={{ __html: art.stand }} />
                </div>
              </div>
            </div>

            {cfg.shape && (
              <div className="absolute bottom-5 inset-x-0 z-10 flex justify-center px-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/90 backdrop-blur border border-border/60 text-[11.5px] shadow-soft-lift">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>تكفي <b className="font-bold text-foreground"><bdi dir="ltr">{cfg.shape.serves}</bdi></b></span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span>جاهزة خلال <b className="font-bold text-foreground">{cfg.shape.lead}</b></span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="order-2 md:order-1 p-5 sm:p-7 md:p-9 lg:p-11">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs tracking-widest uppercase font-medium">
              <Wand2 className="w-3.5 h-3.5" /> صمّم بنفسك
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-4 leading-tight">صمّم كيكتك المثالية</h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-md">
              اختر الشكل والنكهة واللون، وشاهد كيكتك تتشكّل أمامك لحظة بلحظة — ثم خصّصها أكثر بكل التفاصيل.
            </p>

            {/* Shape */}
            <div className="mt-7">
              <div className="flex items-baseline justify-between mb-2.5">
                <div className="text-sm font-bold">الشكل</div>
                <div className="text-[11px] text-muted-foreground">القاعدة والحجم</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SHAPES.map((sh) => {
                  const sel = cfg.shape?.id === sh.id;
                  return (
                    <button
                      key={sh.id}
                      onClick={() => set({ shape: sh })}
                      className={cn(
                        'press relative rounded-2xl border p-2.5 text-center transition-all',
                        sel
                          ? 'border-primary ring-1 ring-primary bg-primary/[0.06] shadow-soft-lift'
                          : 'border-border bg-card hover:border-primary/40',
                      )}
                    >
                      {sh.popular && (
                        <span className="absolute top-1.5 end-1.5 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[8.5px] font-bold leading-none border border-primary/20">
                          <Star className="w-2.5 h-2.5 fill-current" /> الأكثر طلباً
                        </span>
                      )}
                      <div
                        className="h-[76px] rounded-xl mb-1.5 flex items-center justify-center overflow-hidden"
                        style={{ background: THUMB_BG }}
                      >
                        <div className="cake-studio cz-embed" dangerouslySetInnerHTML={{ __html: miniCakeHTML(sh) }} />
                      </div>
                      <div className="font-bold text-[12.5px] leading-tight">{sh.name}</div>
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Users className="w-3 h-3 text-primary" /><bdi dir="ltr">{sh.serves}</bdi>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        من <span className="font-display text-foreground text-[14px]">{sh.price}</span> ر.س
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flavour */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-2.5">
                <div className="text-sm font-bold">النكهة</div>
                <div className="text-[11px] text-muted-foreground">قلب الكيكة اللذيذ</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FLAVORS.map((f) => {
                  const sel = cfg.flavor?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => set({ flavor: f })}
                      className={cn(
                        'press relative rounded-2xl border p-2.5 text-center transition-all',
                        sel
                          ? 'border-primary ring-1 ring-primary bg-primary/[0.06]'
                          : 'border-border bg-card hover:border-primary/40',
                      )}
                    >
                      {f.popular && (
                        <span className="absolute top-1.5 end-1.5 z-10 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary border border-primary/20" title="الأكثر طلباً">
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </span>
                      )}
                      <span
                        className="block w-11 h-11 mx-auto rounded-2xl ring-1 ring-border/50 shadow-inner mb-2"
                        style={{ background: f.dot }}
                      />
                      <div className="font-bold text-[12px] leading-tight">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{f.add ? `+${f.add} ر.س` : 'مشمولة'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-2.5">
                <div className="text-sm font-bold">لون الكريمة</div>
                <div className="text-[11px] text-muted-foreground">لمسة الأناقة</div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-2.5">
                {COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => set({ color: col })}
                    aria-label={col.name}
                    className="press flex flex-col items-center gap-1 w-12"
                  >
                    <span
                      className={cn(
                        'w-10 h-10 rounded-full border-2 border-card shadow-inner transition-transform',
                        cfg.color.id === col.id ? 'outline outline-2 outline-primary outline-offset-2 scale-105' : 'ring-1 ring-border/60',
                      )}
                      style={{ background: col.c }}
                    />
                    <span className={cn('text-[10px]', cfg.color.id === col.id ? 'text-foreground font-semibold' : 'text-muted-foreground')}>{col.name}</span>
                  </button>
                ))}
                <label className="press flex flex-col items-center gap-1 w-12 cursor-pointer" title="لون مخصّص">
                  <span
                    className={cn(
                      'w-10 h-10 rounded-full border-2 border-card shadow-inner grid place-items-center transition-transform',
                      cfg.color.custom ? 'outline outline-2 outline-primary outline-offset-2 scale-105' : 'ring-1 ring-border/60',
                    )}
                    style={cfg.color.custom
                      ? { background: cfg.color.c }
                      : { background: 'conic-gradient(from 210deg,#f4c4d0,#f6e0b6,#cfe6c4,#c4dcea,#ddc8e8,#f4c4d0)' }}
                  >
                    {!cfg.color.custom && <Pipette className="w-4 h-4 text-foreground/70" />}
                  </span>
                  <span className={cn('text-[10px]', cfg.color.custom ? 'text-foreground font-semibold' : 'text-muted-foreground')}>مخصّص</span>
                  <input
                    type="color"
                    value={cfg.color.custom ? cfg.color.c : '#eccfd6'}
                    onChange={(e) => set({ color: makeCustomColor(e.target.value) })}
                    aria-label="لون مخصّص"
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Price + actions */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="shrink-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">الإجمالي التقديري</div>
                <div className="font-display text-3xl text-primary leading-none mt-1">
                  <span key={total} className="badge-pop inline-block">{total}</span>{' '}
                  <span className="text-sm text-muted-foreground">ر.س</span>
                </div>
              </div>
              <button
                onClick={() => onAddCustom(total, summary)}
                className="group press sheen flex-1 min-w-[170px] rounded-full h-[52px] px-6 bg-foreground text-background font-semibold shadow-rose-glow hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" /> أضِف إلى العربة
              </button>
              <button
                onClick={() => onCustomizeMore(cfg)}
                className="press rounded-full h-[52px] px-5 border border-border bg-card text-foreground font-semibold hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" /> خصّصها أكثر
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              «خصّصها أكثر» تنقلك إلى الاستوديو الكامل مع تصميمك الحالي — لإضافة الزينة والرسالة والصورة المطبوعة والمزيد.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
