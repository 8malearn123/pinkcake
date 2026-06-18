import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import '@/components/cake/cakeStudio.css';
import { buildCake, SHAPES, FLAVORS, COLORS, DESIGNS, type CakeConfig } from '@/lib/cakeBuilder';
import { PartyPopper, Wand2, Flame, BadgeCheck, ArrowLeft } from 'lucide-react';

// A fixed, elegant cake just for the hero visual (blush with gold-leaf accents).
const HERO_CAKE: CakeConfig = {
  shape: SHAPES[1],   // classic
  flavor: FLAVORS[0], // vanilla bourbon
  color: COLORS[1],   // blush
  design: DESIGNS[5], // gold leaf
  text: '',
  addons: { candle: false, topper: false },
};

// Dessert/service "orbs" that drift around the cake — the ضيافة spread.
const ORBS = [
  { e: '🧁', cls: 'top-1 start-2', d: '0s' },
  { e: '🍫', cls: 'top-12 end-1', d: '.7s' },
  { e: '🍰', cls: 'bottom-10 start-0', d: '1.2s' },
  { e: '🔥', cls: 'bottom-2 end-10', d: '.3s' },
  { e: '🤵', cls: 'top-1/2 -translate-y-1/2 end-1', d: '1s' },
];

const SPARKLES = [
  { top: '12%', start: '20%', s: 6, d: '0s' },
  { top: '70%', start: '10%', s: 4, d: '.8s' },
  { top: '26%', start: '84%', s: 5, d: '1.4s' },
  { top: '82%', start: '70%', s: 6, d: '.5s' },
  { top: '44%', start: '92%', s: 4, d: '1.1s' },
  { top: '58%', start: '30%', s: 3, d: '1.7s' },
];

const BADGES = [
  { Icon: Wand2, label: 'ضيافة مقترحة حسب عدد ضيوفك' },
  { Icon: Flame, label: 'محطات حية ومقدّمو ضيافة' },
  { Icon: BadgeCheck, label: 'فريق المناسبات يؤكّد التفاصيل' },
];

export function OccasionsCallout({ onStart }: { onStart: () => void }) {
  const art = useMemo(() => buildCake(HERO_CAKE), []);

  return (
    <section className="relative rounded-[2.5rem] gradient-cocoa text-white overflow-hidden shadow-soft-lift">
      <div className="absolute inset-0 noise-overlay opacity-30" />
      {/* warm spotlight */}
      <div
        className="absolute -top-1/3 inset-inline-end-[-12%] w-[65%] h-[140%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(36 64% 60% / .22), transparent 64%)' }}
      />
      {/* twinkling sparkles */}
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="evt-sparkle absolute rounded-full pointer-events-none"
          style={{
            top: s.top, insetInlineStart: s.start, width: s.s, height: s.s,
            background: 'hsl(40 84% 76%)', boxShadow: '0 0 8px hsl(40 84% 72% / .85)', animationDelay: s.d,
          }}
        />
      ))}

      <div className="relative z-10 grid lg:grid-cols-2 items-center gap-4 lg:gap-8 p-8 sm:p-12">
        {/* Content */}
        <div className="order-2 lg:order-1 text-center lg:text-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs tracking-widest uppercase">
            <PartyPopper className="w-3.5 h-3.5 text-primary" /> ضيافة المناسبات والأعراس
          </div>
          <h3 className="font-display text-3xl sm:text-4xl md:text-5xl mt-4 leading-tight">لحظات الفرح تستحق ضيافة تليق بها</h3>
          <p className="mt-3 text-white/75 leading-relaxed max-w-md mx-auto lg:mx-0">
            أعراس، فعاليات الشركات، والمناسبات الكبيرة — أجب على بضعة أسئلة، ونجهّز لك ضيافة متكاملة من الكيكة إلى المحطات الحية ومقدّمي الخدمة.
          </p>
          <div className="mt-7 flex justify-center lg:justify-start">
            <button
              onClick={onStart}
              className="group press sheen rounded-full ps-9 pe-7 h-[56px] bg-white text-foreground hover:bg-white/90 font-semibold transition-colors inline-flex items-center gap-2.5 text-base sm:text-lg"
            >
              <PartyPopper className="w-5 h-5 text-primary" /> جهّز مناسبتك <ArrowLeft className="cta-arrow w-4 h-4" />
            </button>
          </div>
          <div className="mt-7 flex flex-wrap lg:flex-col items-center lg:items-start justify-center lg:justify-start gap-x-6 gap-y-2 lg:gap-y-2.5 text-white/75 text-xs">
            {BADGES.map((b) => (
              <span key={b.label} className="inline-flex items-center gap-1.5">
                <b.Icon className="w-4 h-4 text-primary" /> {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Visual — floating cake + dessert orbs */}
        <div className="order-1 lg:order-2 relative h-[240px] sm:h-[290px] lg:h-[360px] flex items-center justify-center">
          <div className="absolute bottom-8 w-44 sm:w-52 h-12 rounded-[50%] blur-2xl" style={{ background: 'hsl(350 55% 60% / .45)' }} />
          <div className="cake-studio cz-embed relative z-10 scale-[.78] sm:scale-90 lg:scale-100">
            <div className="cz-scene">
              <div className="cake-wrap">
                <div className="cake" dangerouslySetInnerHTML={{ __html: art.cake }} />
                <div className="stand" dangerouslySetInnerHTML={{ __html: art.stand }} />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none">
            {ORBS.map((o) => (
              <span
                key={o.e}
                className={cn(
                  'evt-orb absolute w-12 h-12 rounded-2xl grid place-items-center text-xl bg-white/10 backdrop-blur border border-white/20 shadow-lg',
                  o.cls,
                )}
                style={{ animationDelay: o.d }}
                aria-hidden
              >
                {o.e}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
