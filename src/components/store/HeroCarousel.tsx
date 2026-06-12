import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import hero1 from '@/assets/hero-cake-1.jpg';
import hero2 from '@/assets/hero-cake-2.jpg';
import hero3 from '@/assets/hero-cake-3.jpg';

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; action: () => void };
  tone: 'rose' | 'cocoa' | 'champagne';
};

interface HeroCarouselProps {
  onShopClick: () => void;
  onCustomizeClick: () => void;
}

export function HeroCarousel({ onShopClick, onCustomizeClick }: HeroCarouselProps) {
  const slides: Slide[] = [
    {
      image: hero1,
      eyebrow: 'مجموعة الموسم',
      title: 'حلاوة بلمسة من الذهب',
      subtitle: 'كيكات مصممة يدوياً بأجود المكونات، تُقدّم لحظاتك الخاصة بأناقة لا تُنسى.',
      cta: { label: 'تسوّق الآن', action: onShopClick },
      tone: 'cocoa',
    },
    {
      image: hero3,
      eyebrow: 'مناسبات استثنائية',
      title: 'كيكتك. توقيعك.',
      subtitle: 'صمّمي كيكة العمر بنفسك — نكهات، طبقات، وألوان تختارينها أنتِ.',
      cta: { label: 'صمّم كيكتك', action: onCustomizeClick },
      tone: 'champagne',
    },
    {
      image: hero2,
      eyebrow: 'كاب كيك بوكس',
      title: 'مفاجآت صغيرة بطعم كبير',
      subtitle: 'علب كاب كيك مزينة بالذهب والكريمة الزبدية الفاخرة، جاهزة للإهداء.',
      cta: { label: 'اطلب الآن', action: onShopClick },
      tone: 'rose',
    },
  ];

  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  const go = (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-foreground shadow-rose-glow">
      {/* Slides */}
      <div className="relative h-[460px] md:h-[520px]">
        {slides.map((s, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000',
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <img
              src={s.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-foreground/85 via-foreground/55 to-transparent" />
            <div className="absolute inset-0 noise-overlay opacity-40" />
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-xl text-background">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/15 backdrop-blur border border-background/20 text-xs tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{slide.eyebrow}</span>
              </div>
              <h2 className="font-display text-5xl md:text-7xl leading-[1.05] mt-5 tracking-tight">
                {slide.title}
              </h2>
              <p className="mt-5 text-base md:text-lg text-background/80 leading-relaxed max-w-md">
                {slide.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={slide.cta.action}
                  className="rounded-full px-7 h-12 bg-background text-foreground hover:bg-background/90 shadow-lg"
                >
                  {slide.cta.label}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onCustomizeClick}
                  className="rounded-full px-7 h-12 bg-transparent border-background/40 text-background hover:bg-background/10 hover:text-background"
                >
                  استكشف الكتالوج
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Arrows */}
        <button
          onClick={() => go(-1)}
          aria-label="السابق"
          className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/15 hover:bg-background/25 backdrop-blur border border-background/20 flex items-center justify-center text-background transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="التالي"
          className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/15 hover:bg-background/25 backdrop-blur border border-background/20 flex items-center justify-center text-background transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 end-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`الشريحة ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-8 bg-background' : 'w-1.5 bg-background/40'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
