import { useRef, useState } from 'react';
import { Star, ArrowLeft, ArrowRight } from 'lucide-react';

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const REVIEWS = [
  { quote: 'كيكة زفافي كانت تحفة فنية — التصميم تجاوز كل توقعاتي وطعمها لا يُقاوم. شكراً Pink Cake على لمسةٍ لا تُنسى.', name: 'ريم العتيبي', role: 'كيكة زفاف', initial: 'ر', photo: img('1535141192574-5d4897c12636') },
  { quote: 'طلبتُ تصميماً خاصاً لعيد ميلاد ابنتي، ووصل في موعده تماماً وبتغليفٍ راقٍ. فرحتها كانت لا توصف!', name: 'نورة القحطاني', role: 'كيكة عيد ميلاد', initial: 'ن', photo: img('1586788680434-30d324b2d46f') },
  { quote: 'أفضل تشيز كيك جرّبته في حياتي، والخدمة سريعة ولطيفة. صار Pink Cake مكاني المفضّل لكل مناسبة.', name: 'سارة الدوسري', role: 'عميلة دائمة', initial: 'س', photo: img('1533134242443-d4fd215305ad') },
  { quote: 'أهديتُ صندوق الشوكولاتة الفاخر لصديقٍ في مناسبته، فانبهر بالتغليف الأنيق وقال إن المذاق ترفٌ حقيقي.', name: 'عبدالله المطيري', role: 'هدية مميّزة', initial: 'ع', photo: img('1563729784474-d77dbb933a9e') },
  { quote: 'نسّقوا ضيافة حفلنا من الألف إلى الياء باحترافية عالية. كل التفاصيل كانت مدروسة والضيوف أثنوا على كل صنف.', name: 'لمياء الشهري', role: 'ضيافة مناسبة', initial: 'ل', photo: img('1426869981800-95ebf51ce900') },
  { quote: 'تشكيلة الماكرون كانت لوحة ألوان ونكهات — طازجة، متوازنة الحلاوة، ومثالية كهديّة راقية. تجربة تستحق التكرار.', name: 'فهد العنزي', role: 'ماكرون فرنسي', initial: 'ف', photo: img('1569864358642-9d1684040f43') },
];

const Stars = ({ size = 'w-3.5 h-3.5' }: { size?: string }) => (
  <span className="flex gap-0.5" aria-label="5 من 5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`${size} fill-warning text-warning`} />
    ))}
  </span>
);

export function Testimonials() {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [index, setIndex] = useState(0);

  const scrollTo = (i: number) => {
    const clamped = Math.max(0, Math.min(REVIEWS.length - 1, i));
    setIndex(clamped);
    cardRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  return (
    <section className="space-y-8">
      {/* Centered heading */}
      <div className="text-center">
        <div className="text-xs text-primary tracking-widest uppercase font-medium">آراء عملائنا</div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mt-2 leading-tight">كلماتٌ حلوة من عملائنا</h2>
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Stars size="w-4 h-4" />
          <span className="font-semibold text-foreground">4.9</span>
          <span>· أكثر من 1200 تقييم</span>
        </div>
      </div>

      {/* Carousel track — image-topped review cards */}
      <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-1 px-1">
        {REVIEWS.map((t, i) => (
          <article
            key={t.name}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="snap-start shrink-0 w-[86%] sm:w-[47%] lg:w-[31.8%]"
          >
            {/* photo */}
            <div className="rounded-[1.75rem] overflow-hidden aspect-[4/3] shadow-soft-lift">
              <img src={t.photo} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
            {/* review card, overlapping the photo's bottom */}
            <div className="relative -mt-10 mx-3 sm:mx-4 rounded-[1.5rem] bg-card border border-border/60 shadow-soft-lift p-5 sm:p-6">
              <blockquote className="text-sm sm:text-[15px] leading-relaxed text-foreground/80">{t.quote}</blockquote>
              <div className="my-5 h-px bg-border/70" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full gradient-pink text-white flex items-center justify-center font-semibold shrink-0">
                    {t.initial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.role}</div>
                  </div>
                </div>
                <Stars />
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Carousel arrows (RTL: prev → right, next → left) */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => scrollTo(index - 1)}
          disabled={index === 0}
          aria-label="السابق"
          className="press w-11 h-11 rounded-full border border-border/70 text-foreground/70 flex items-center justify-center transition-colors hover:text-primary hover:border-primary/50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollTo(index + 1)}
          disabled={index >= REVIEWS.length - 1}
          aria-label="التالي"
          className="press w-11 h-11 rounded-full border border-border/70 text-foreground/70 flex items-center justify-center transition-colors hover:text-primary hover:border-primary/50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
