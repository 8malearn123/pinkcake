import { cn } from '@/lib/utils';
import { Cake, Flame, ConciergeBell, ArrowLeft } from 'lucide-react';

const ROSE = 'hsl(var(--primary))';

// Warm cocoa backdrop with a rose glow + depth (no gold — rose-only system).
const CARD_BG =
  'radial-gradient(82% 100% at 84% -4%, hsl(var(--brand-rose) / .34), transparent 56%), ' +
  'radial-gradient(72% 92% at 4% 108%, hsl(var(--primary) / .38), transparent 60%), ' +
  'linear-gradient(150deg, hsl(var(--ink-deep)) 0%, hsl(var(--ink-dark)) 50%, hsl(var(--ink-black)) 100%)';

// One editorial cake photograph — warm rose/cocoa tones that pair with the rose accents.
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
      {/* thin rose/blush hairline frame */}
      <div
        className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--blush) / .16)' }}
      />

      <div className="relative z-10 grid items-center gap-10 lg:gap-16 p-8 sm:p-12 lg:p-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Visual — a single framed portrait, elegantly offset */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <figure className="relative w-full max-w-[300px] sm:max-w-[340px]">
            {/* soft, expensive shadow bloom */}
            <div
              className="absolute -inset-4 rounded-[2.25rem] blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(58% 52% at 50% 42%, hsl(var(--primary) / .34), transparent 75%)' }}
            />
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"
              style={{ boxShadow: '0 34px 64px -26px hsl(var(--ink-black) / .75)' }}
            >
              <img
                src={CAKE_PHOTO}
                alt="كيكة مناسبات فاخرة بلمسات وردية"
                loading="lazy"
                className="w-full h-full object-cover max-w-full"
                style={{ objectPosition: '50% 38%' }}
              />
              {/* gentle scrim, grounding the photo into the cocoa */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, transparent 52%, hsl(var(--ink-black) / .6))' }}
              />
              {/* 1px rose/blush hairline on the frame */}
              <div
                className="absolute inset-0 rounded-[1.75rem] pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--blush) / .5)' }}
              />
            </div>
          </figure>
        </div>

        {/* Content — sparse, gallery-like */}
        <div className="order-2 lg:order-1 text-center lg:text-start">
          {/* rose rule + eyebrow */}
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <span
              className="h-px w-10"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / .7))' }}
            />
            <span className="text-[11px] tracking-[0.35em] uppercase" style={{ color: ROSE }}>
              ضيافة المناسبات والأعراس
            </span>
          </div>

          <h3 className="font-wedding text-3xl sm:text-4xl lg:text-[2.9rem] mt-6 leading-[1.5]">
            لحظات الفرح تستحق ضيافة تليق بها
          </h3>

          <p className="mt-6 text-white/60 leading-loose max-w-md mx-auto lg:mx-0">
            أعراس، فعاليات الشركات، والمناسبات الكبيرة — نجهّز لك ضيافة متكاملة، من
            الكيكة إلى المحطات الحية ومقدّمي الخدمة.
          </p>

          {/* hairline divider */}
          <div
            className="mt-8 h-px w-full max-w-md mx-auto lg:mx-0"
            style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / .35), transparent)' }}
          />

          {/* three quietly-elegant service labels, hairline-separated */}
          <div className="mt-6 flex items-center justify-center lg:justify-start">
            {SERVICES.map((s, i) => (
              <div
                key={s.label}
                className={cn('flex items-center gap-2.5 px-4 sm:px-5', i > 0 && 'border-s border-white/15')}
              >
                <s.Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: ROSE }} />
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
