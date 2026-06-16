import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import hero1 from '@/assets/hero-cake-1.jpg';
import hero2 from '@/assets/hero-cake-2.jpg';
import hero3 from '@/assets/hero-cake-3.jpg';

const SLIDES = [
  { image: hero1, badge: 'مجموعة الموسم', title: 'حلاوة بلمسة من الذهب', text: 'كيكات مصممة يدوياً بأجود المكونات، تُقدّم لحظاتك الخاصة بأناقة لا تُنسى.' },
  { image: hero3, badge: 'الأكثر طلباً', title: 'ريد فيلفت الكلاسيكية', text: 'طبقات حمراء مخمليّة بكريمة الجبن الطازجة — قطعة من الفرح في كل لقمة.' },
  { image: hero2, badge: 'وصل حديثاً', title: 'ماكرون فرنسي ملوّن', text: 'تشكيلة ماكرون بألوان الموسم ونكهات منتقاة، مثالية لإهداء من تحبّين.' },
];

interface HeroCarouselProps {
  onShopClick: () => void;
  onCustomizeClick: () => void;
}

export function HeroCarousel({ onShopClick, onCustomizeClick }: HeroCarouselProps) {
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
    <section className="relative overflow-hidden rounded-[2rem] bg-foreground shadow-rose-glow">
      <div className="relative h-[440px] sm:h-[480px] md:h-[520px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
                  <h2 className="font-display text-[2.6rem] leading-[1.08] sm:text-6xl md:text-7xl md:leading-[1.05] mt-4 md:mt-5 tracking-tight">{s.title}</h2>
                  <p className="mt-3 md:mt-5 text-[15px] md:text-lg text-white/80 leading-relaxed max-w-md">{s.text}</p>
                  <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-3">
                    <button
                      onClick={onShopClick}
                      className="group press sheen rounded-full ps-7 pe-5 h-12 bg-white text-foreground hover:bg-white/90 shadow-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      تسوّقي الآن <ArrowLeft className="cta-arrow w-4 h-4" />
                    </button>
                    <button
                      onClick={onCustomizeClick}
                      className="press rounded-full px-7 h-12 bg-transparent border border-white/40 text-white hover:bg-white/10 font-medium transition-colors"
                    >
                      صمّمي كيكتك
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-white/75 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>تُحضّر طازجة وتُوصل خلال ٢٤ ساعة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          onClick={() => go(-1)}
          aria-label="السابق"
          className="absolute start-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur border border-white/20 hidden md:flex items-center justify-center text-white press transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="التالي"
          className="absolute end-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur border border-white/20 hidden md:flex items-center justify-center text-white press transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots — centered via inset-x-0 + flex (RTL-safe) */}
        <div className="absolute bottom-5 inset-x-0 z-20 flex justify-center gap-2">
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
