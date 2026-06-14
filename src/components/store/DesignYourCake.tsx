import { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import '@/components/cake/cakeStudio.css';
import {
  SHAPES, FLAVORS, COLORS, DESIGNS, buildCake, price, type CakeConfig,
} from '@/lib/cakeBuilder';
import { Wand2, ShoppingBag, SlidersHorizontal, Users } from 'lucide-react';

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
              اختاري الشكل والنكهة واللون، وشاهدي كيكتكِ تتشكّل أمامكِ — ثم خصّصيها أكثر بكل التفاصيل.
            </p>

            {/* Shape */}
            <div className="mt-7">
              <div className="text-sm font-semibold mb-2">الشكل</div>
              <div className="grid grid-cols-3 gap-2">
                {SHAPES.map((sh) => (
                  <button
                    key={sh.id}
                    onClick={() => set({ shape: sh })}
                    className={cn(
                      'press rounded-xl border px-2 py-2.5 text-center transition-colors',
                      cfg.shape?.id === sh.id ? 'border-primary bg-primary/[0.08]' : 'border-border bg-card',
                    )}
                  >
                    <div className="text-[13px] font-bold leading-tight">{sh.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5"><bdi dir="ltr">{sh.serves}</bdi></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Flavour */}
            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">النكهة</div>
              <div className="flex flex-wrap gap-2">
                {FLAVORS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => set({ flavor: f })}
                    className={cn(
                      'press inline-flex items-center gap-2 rounded-full border ps-2 pe-3 py-1.5 text-[13px] transition-colors',
                      cfg.flavor?.id === f.id ? 'border-primary bg-primary/[0.08] font-semibold' : 'border-border bg-card',
                    )}
                  >
                    <span className="w-4 h-4 rounded-full shrink-0 ring-1 ring-border/60" style={{ background: f.dot }} />
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour */}
            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">لون الكريمة</div>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => set({ color: col })}
                    aria-label={col.name}
                    className="press flex flex-col items-center gap-1 w-12"
                  >
                    <span
                      className={cn(
                        'w-9 h-9 rounded-full border-2 border-card shadow-inner transition-transform',
                        cfg.color.id === col.id ? 'outline outline-2 outline-primary outline-offset-2 scale-105' : 'ring-1 ring-border/60',
                      )}
                      style={{ background: col.c }}
                    />
                    <span className={cn('text-[10px]', cfg.color.id === col.id ? 'text-foreground font-semibold' : 'text-muted-foreground')}>{col.name}</span>
                  </button>
                ))}
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
                <ShoppingBag className="w-5 h-5" /> أضيفي إلى العربة
              </button>
              <button
                onClick={() => onCustomizeMore(cfg)}
                className="press rounded-full h-[52px] px-5 border border-border bg-card text-foreground font-semibold hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" /> خصّصيها أكثر
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              «خصّصيها أكثر» تنقلكِ إلى الاستوديو الكامل مع تصميمكِ الحالي — لإضافة الزينة والرسالة والمزيد.
            </div>
          </div>

          {/* Live premium preview (shared with /customize) */}
          <div
            className="relative order-1 md:order-2 min-h-[360px] md:min-h-full flex items-end justify-center overflow-hidden"
            style={{ background: STAGE_BG }}
          >
            <div className="absolute inset-0 noise-overlay opacity-30" />
            <div className="absolute top-5 end-5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/85 backdrop-blur border border-border/60 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> معاينة حيّة
            </div>

            <div className="cake-studio cz-embed relative z-[5] w-full pb-12">
              <div className="cake-wrap" ref={wrapRef}>
                <div className="cake" dangerouslySetInnerHTML={{ __html: art.cake }} />
                <div className="stand" dangerouslySetInnerHTML={{ __html: art.stand }} />
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
        </div>
      </div>
    </section>
  );
}
