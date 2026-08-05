import { Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} من ٥`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={0}
          fill={i < Math.round(rating) ? "#ddbd75" : "#d8d5cf"}
        />
      ))}
    </span>
  );
}

type Testimonial = { id: number; name: string; text: string; rating: number; occasion: string };

const testimonials: Testimonial[] = [
  { id: 1, name: "نورة العتيبي", occasion: "عيد ميلاد ابنتي", rating: 5, text: "التورتة وصلت في وقتها بالضبط والتصميم كان أجمل من الصورة! الكل سألني من وين طلبتها." },
  { id: 2, name: "عبدالله الحربي", occasion: "تخرج", rating: 5, text: "طلبت تورتة مخصصة وتعاملهم راقي جداً من أول رسالة لين التوصيل. الطعم خيالي والله." },
  { id: 3, name: "ريم القحطاني", occasion: "مناسبة عائلية", rating: 5, text: "أكثر شي عجبني إنها طازجة مب مجمدة، بانت بالطعم. صارت مخبزي الثابت لكل مناسبة." },
];

export function Reviews() {
  return (
    <section className="relative overflow-hidden border-y border-gold/30 bg-gradient-to-b from-berry-deep via-primary to-berry-deep px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* soft gold glow for depth */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(221,189,117,0.18),transparent)]" />
      <div className="relative mx-auto max-w-[1500px]">
        <Reveal className="flex flex-col items-center text-center">
          <p className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-gold">
            <span className="h-px w-8 bg-gold/50" /> آراء عملائنا <span className="h-px w-8 bg-gold/50" />
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.01em] text-white sm:text-4xl">أكثر من ١٢٠٠ مناسبة سعيدة</h2>
          <div className="mt-4 flex items-center gap-3">
            <Stars rating={5} size={18} />
            <span className="text-sm font-bold text-gold">٤٫٩ / ٥ متوسط التقييم</span>
          </div>
        </Reveal>
        <Reveal className="reveal-grid mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="flex flex-col rounded-2xl bg-white p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_40px_80px_-32px_rgba(0,0,0,0.6)]">
              <Stars rating={t.rating} />
              <blockquote className="mt-4 grow text-sm leading-7 text-muted-foreground">«{t.text}»</blockquote>
              <figcaption className="mt-5 border-t border-border pt-4">
                <p className="text-sm font-bold text-primary">{t.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.occasion}</p>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
