import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeddingShowcaseProps {
  /** Primary — frames the weddings collection (no "N filtered results" promise). */
  onCollection: () => void;
  /** Secondary — books a consultation via the events flow. */
  onConsultation: () => void;
}

// Ivory / blush tiered wedding cake on a soft neutral backdrop (rose-compatible).
// Placeholder — flag for an owned local asset later, per the imagery convention.
const CAKE_PHOTO =
  'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=1200&q=85';

// The wedding journey as four quiet, hairline-separated steps (the OccasionsCallout idiom).
const STEPS = ['استشارة خاصة', 'جلسة تذوّق', 'تصميم مخصّص', 'تسليم يوم العرس'];

export function WeddingShowcase({ onCollection, onConsultation }: WeddingShowcaseProps) {
  return (
    <section
      id="weddings"
      className="relative scroll-mt-24 rounded-[2.5rem] text-white overflow-hidden shadow-soft-lift gradient-cocoa"
    >
      {/* rose-deep wash layered over the cocoa for warmth + depth */}
      <div className="absolute inset-0 gradient-rose-deep opacity-25 pointer-events-none" />
      {/* subtle grain */}
      <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none" />
      {/* thin rose/blush hairline frame (no gold) */}
      <div
        className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--blush) / .16)' }}
      />

      <div className="relative z-10 grid items-center gap-10 lg:gap-14 p-8 sm:p-10 lg:p-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Content */}
        <div className="order-2 lg:order-1 text-center lg:text-start">
          {/* eyebrow — rose hairline rule */}
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <span
              className="h-px w-10"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / .7))' }}
            />
            <span className="text-[11px] tracking-[0.35em] uppercase text-white/70">أعراس وخطوبة</span>
          </div>

          <h3 className="font-wedding text-3xl sm:text-4xl lg:text-4xl mt-5 leading-[1.35]">
            ليوم العمر، كيكةٌ تليق بالحكاية
          </h3>

          <p className="mt-6 text-white/65 leading-loose max-w-md mx-auto lg:mx-0">
            من الاستشارة الأولى حتى لحظة التقطيع، نصمّم كيكة زفافٍ متعددة الطبقات تروي
            حكايتكما — طبقاتٌ منحوتة يدوياً، نكهاتٌ منتقاة، ولمساتٌ لا تتكرّر.
          </p>

          {/* hairline divider */}
          <div
            className="mt-8 h-px w-full max-w-md mx-auto lg:mx-0"
            style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / .4), transparent)' }}
          />

          {/* four hairline-separated journey steps */}
          <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={cn('px-3.5 sm:px-4 py-1', i > 0 && 'border-s border-white/15')}
              >
                <span className="text-[13px] sm:text-sm text-white/75 whitespace-nowrap">{step}</span>
              </div>
            ))}
          </div>

          {/* dual CTA — one filled rose-white primary, one quiet outline */}
          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <button
              onClick={onCollection}
              className="group press sheen inline-flex items-center gap-3 h-14 ps-8 pe-6 rounded-full bg-white text-foreground font-semibold text-base shadow-xl transition-transform"
            >
              اكتشفي مجموعة الأعراس
              <ArrowLeft className="cta-arrow w-4 h-4 text-primary" />
            </button>
            <button
              onClick={onConsultation}
              className="press inline-flex items-center h-14 px-7 rounded-full bg-transparent border border-white/40 text-white hover:bg-white/10 font-medium transition-colors"
            >
              احجزي استشارة
            </button>
          </div>
        </div>

        {/* Visual — a single framed portrait */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <figure className="relative w-full max-w-[320px] sm:max-w-[380px]">
            <div
              className="absolute -inset-4 rounded-[2.25rem] blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(58% 52% at 50% 42%, hsl(var(--primary) / .32), transparent 75%)' }}
            />
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"
              style={{ boxShadow: '0 34px 64px -26px hsl(20 45% 5% / .75)' }}
            >
              <img
                src={CAKE_PHOTO}
                alt="كيكة زفاف متعددة الطبقات بلمسات وردية"
                loading="lazy"
                className="w-full h-full object-cover max-w-full"
                style={{ objectPosition: '50% 40%' }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, transparent 52%, hsl(20 28% 11% / .5))' }}
              />
              <div
                className="absolute inset-0 rounded-[1.75rem] pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--blush) / .5)' }}
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
