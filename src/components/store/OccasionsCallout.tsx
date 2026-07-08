import { cn } from '@/lib/utils';
import { Cake, Flame, ConciergeBell, ArrowLeft } from 'lucide-react';

const GOLD = 'hsl(43 74% 70%)';

// Warm, candlelit luxury backdrop — golden light + depth instead of flat, gloomy brown.
const CARD_BG =
  'radial-gradient(82% 100% at 84% -4%, hsl(38 68% 46% / .55), transparent 56%), ' +
  'radial-gradient(72% 92% at 4% 108%, hsl(352 52% 42% / .32), transparent 60%), ' +
  'linear-gradient(150deg, hsl(28 48% 23%) 0%, hsl(22 40% 15%) 50%, hsl(17 34% 10%) 100%)';

// One editorial cake photograph — warm caramel tones that pair with the gold accents.
const CAKE_PHOTO =
  'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1400&q=85';

// The ضيافة spread as three quiet, gallery-style labels (icon + word) — not floating tiles.
const SERVICES = [
  { Icon: Cake, label: 'الكيكة' },
  { Icon: Flame, label: 'المحطات الحية' },
  { Icon: ConciergeBell, label: 'مقدّمو الخدمة' },
];

export function OccasionsCallout({ onStart }: { onStart: () => void }) {
  return (
    <section
      className="relative rounded-[2.5rem] text-white overflow-hidden shadow-soft-lift"
      style={{ background: CARD_BG }}
    >
      {/* subtle grain */}
      <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none" />
      {/* thin gold hairline frame */}
      <div
        className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px hsl(43 60% 72% / .18)' }}
      />

      <div className="relative z-10 grid items-center gap-10 lg:gap-16 p-8 sm:p-12 lg:p-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Visual — a single framed portrait, elegantly offset */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <figure className="relative w-full max-w-[300px] sm:max-w-[340px]">
            {/* soft, expensive shadow bloom */}
            <div
              className="absolute -inset-4 rounded-[2.25rem] blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(58% 52% at 50% 42%, hsl(36 50% 40% / .38), transparent 75%)' }}
            />
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"
              style={{ boxShadow: '0 34px 64px -26px hsl(20 45% 5% / .75)' }}
            >
              <img
                src={CAKE_PHOTO}
                alt="كيكة مناسبات فاخرة بلمسات ذهبية"
                loading="lazy"
                className="w-full h-full object-cover max-w-full"
                style={{ objectPosition: '50% 38%' }}
              />
              {/* gentle scrim, grounding the photo into the cocoa */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, transparent 52%, hsl(20 28% 11% / .55))' }}
              />
              {/* 1px gold hairline on the frame */}
              <div
                className="absolute inset-0 rounded-[1.75rem] pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 1px hsl(43 74% 74% / .5)' }}
              />
            </div>
          </figure>
        </div>

        {/* Content — sparse, gallery-like */}
        <div className="order-2 lg:order-1 text-center lg:text-start">
          {/* gold rule + eyebrow */}
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <span
              className="h-px w-10"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(43 74% 70%))' }}
            />
            <span className="text-[11px] tracking-[0.35em] uppercase" style={{ color: GOLD }}>
              ضيافة المناسبات والأعراس
            </span>
          </div>

          <h3 className="font-display text-3xl sm:text-4xl lg:text-[2.9rem] mt-6 leading-[1.5]">
            لحظات الفرح تستحق ضيافة تليق بها
          </h3>

          <p className="mt-6 text-white/60 leading-loose max-w-md mx-auto lg:mx-0">
            أعراس، فعاليات الشركات، والمناسبات الكبيرة — نجهّز لك ضيافة متكاملة، من
            الكيكة إلى المحطات الحية ومقدّمي الخدمة.
          </p>

          {/* hairline divider */}
          <div
            className="mt-8 h-px w-full max-w-md mx-auto lg:mx-0"
            style={{ background: 'linear-gradient(90deg, hsl(43 60% 72% / .28), transparent)' }}
          />

          {/* three quietly-elegant service labels, hairline-separated */}
          <div className="mt-6 flex items-center justify-center lg:justify-start">
            {SERVICES.map((s, i) => (
              <div
                key={s.label}
                className={cn('flex items-center gap-2.5 px-4 sm:px-5', i > 0 && 'border-s border-white/15')}
              >
                <s.Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: GOLD }} />
                <span className="text-sm text-white/75 whitespace-nowrap">{s.label}</span>
              </div>
            ))}
          </div>

          {/* one understated, confident CTA */}
          <div className="mt-10 flex justify-center lg:justify-start">
            <button
              onClick={onStart}
              className="group press sheen inline-flex items-center gap-3 h-14 ps-8 pe-6 rounded-full bg-white text-foreground font-semibold text-base shadow-xl transition-transform"
            >
              جهّز مناسبتك
              <ArrowLeft className="cta-arrow w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
