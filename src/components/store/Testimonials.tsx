import { Star } from 'lucide-react';

const REVIEWS = [
  { quote: 'كيكة زفافي كانت تحفة فنية — التصميم تجاوز كل توقعاتي وكان طعمها لا يُقاوم. شكراً لك Pink Cake!', name: 'ريم العتيبي', role: 'كيكة زفاف', initial: 'ر' },
  { quote: 'طلبتُ تصميماً خاصاً لعيد ميلاد ابنتي ووصل في الموعد تماماً وبتغليفٍ راقٍ. تجربة تستحق التكرار.', name: 'نورة القحطاني', role: 'كيكة عيد ميلاد', initial: 'ن' },
  { quote: 'أفضل تشيز كيك جرّبته في حياتي، والخدمة سريعة ولطيفة. صار مكاني المفضّل لكل مناسبة.', name: 'سارة الدوسري', role: 'عميلة دائمة', initial: 'س' },
];

const Stars = ({ size = 'w-3.5 h-3.5' }: { size?: string }) => (
  <span className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`${size} fill-warning text-warning`} />
    ))}
  </span>
);

export function Testimonials() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-primary tracking-widest uppercase font-medium">آراء عميلاتنا</div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl mt-1 leading-none">ثقةٌ تُحلّي كلَّ مناسبة</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card border border-border/60 px-4 py-2 shadow-soft-lift">
          <Stars size="w-4 h-4" />
          <span className="text-sm font-semibold">4.9</span>
          <span className="text-xs text-muted-foreground">· أكثر من 1200 تقييم</span>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
        {REVIEWS.map((t) => (
          <figure key={t.name} className="tcard bg-card rounded-3xl border border-border/60 p-6 shadow-soft-lift">
            <Stars />
            <blockquote className="text-sm leading-relaxed mt-3 text-foreground/85">{t.quote}</blockquote>
            <figcaption className="flex items-center gap-3 mt-5">
              <div className="w-10 h-10 rounded-full gradient-pink text-white flex items-center justify-center font-semibold shrink-0">
                {t.initial}
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
