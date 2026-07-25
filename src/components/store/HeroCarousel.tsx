import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import hero1 from '@/assets/hero-cake-1.jpg';
import hero2 from '@/assets/hero-cake-2.jpg';
import hero3 from '@/assets/hero-cake-3.jpg';

// `foil` flags the ceremonial wedding lead slide → its title renders in the
// ceremonial serif (.font-wedding) and its CTA scrolls to the weddings pillar.
// The first slide keeps a local image (eager) to protect LCP.
const SLIDES = [
  { image: hero1, badge: 'أعراس وخطوبة', title: 'لأناقةٍ تليق بيوم العمر', text: 'كيكات زفافٍ متعددة الطبقات مصمّمة يدوياً لِتُتوّج لحظتكما الأجمل.', foil: true, wedding: true },
  { image: hero3, badge: 'الأكثر طلباً', title: 'ريد فيلفت الكلاسيكية', text: 'طبقات حمراء مخمليّة بكريمة الجبن الطازجة — قطعة من الفرح في كل لقمة.' },
  { image: hero2, badge: 'وصل حديثاً', title: 'ماكرون فرنسي ملوّن', text: 'تشكيلة ماكرون بألوان الموسم ونكهات منتقاة، مثالية لإهداء من تحبّ.' },
];

interface HeroCarouselProps {
  onShopClick: () => void;
  onCustomizeClick: () => void;
  onWeddingClick?: () => void;
  /** Storefront mode: a short promo band (not a full-height hero) so products lead. */
  compact?: boolean;
}

export function HeroCarousel({ onShopClick, onCustomizeClick, onWeddingClick, compact = false }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  // Touch swipe (the arrows are hidden on mobile).
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <section className="relative overflow-hidden bg-foreground">
      <div
        className={cn(
          'relative',
          compact ? 'h-[clamp(240px,38vh,360px)]' : 'h-[72vh] min-h-[520px] max-h-[820px]'
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {SLIDES.map((s, i) => (
          <div key={i} className={cn('hero-slide', i === index && 'hero-active')}>
            <img
              src={s.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-foreground/85 via-foreground/55 to-transparent" />
            <div className="absolute inset-0 noise-overlay opacity-40" />
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-6 md:px-12">
                <div className="hero-text max-w-xl text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{s.badge}</span>
                  </div>
                  <h2
                    className={cn(
                      'mt-4 md:mt-5',
                      compact
                        ? 'font-display text-2xl md:text-4xl leading-tight'
                        : 'font-wedding text-4xl leading-[1.3] sm:text-5xl md:text-6xl md:leading-[1.3]'
                    )}
                  >
                    {s.title}
                  </h2>
                  <p className={cn('text-white/80 leading-relaxed max-w-md', compact ? 'mt-2 text-sm md:text-base' : 'mt-3 md:mt-5 text-[15px] md:text-lg')}>{s.text}</p>
                  <div className={cn('flex flex-wrap items-center gap-3', compact ? 'mt-4' : 'mt-6 md:mt-8')}>
                    <button
                      onClick={s.wedding && onWeddingClick ? onWeddingClick : onShopClick}
                      className="group press sheen rounded-full ps-7 pe-5 h-12 bg-white text-foreground hover:bg-white/90 shadow-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      {s.wedding ? 'اكتشفي مجموعة الأعراس' : 'تسوّق الآن'} <ArrowLeft className="cta-arrow w-4 h-4" />
                    </button>
                    {!compact && (
                      <button
                        onClick={onCustomizeClick}
                        className="press rounded-full px-7 h-12 bg-transparent border border-white/40 text-white hover:bg-white/10 font-medium transition-colors"
                      >
                        صمّم كيكتك
                      </button>
                    )}
                  </div>
                  {!compact && (
                    <div className="mt-4 flex items-center gap-2 text-white/75 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>مصنوعة يدوياً • تصاميم زفاف حصرية • توصيل في الموعد</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className={cn('absolute inset-x-0 z-20 flex justify-center gap-2', compact ? 'bottom-4 md:bottom-6' : 'bottom-10 md:bottom-16')}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`شريحة ${i + 1}`} className="p-3 -m-2 flex items-center">
              <span className={cn('hero-dot h-1.5 rounded-full', i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40')} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
