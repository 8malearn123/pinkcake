import { Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { visibleItems } from "@/hooks/useHomepageContent";
import { SECTION_DEFAULTS, type SectionContent } from "@/lib/homepage/schema";

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} من ٥`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={0}
          fill={i < Math.round(rating) ? "#dbb2b9" : "#d9d2d3"}
        />
      ))}
    </span>
  );
}

export function Reviews({ content = SECTION_DEFAULTS.reviews }: { content?: SectionContent["reviews"] }) {
  const testimonials = visibleItems(content.items);
  if (testimonials.length === 0) return null;
  return (
    <section className="relative overflow-hidden border-y border-gold/30 bg-gradient-to-b from-ink-deep via-primary to-ink-deep px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* soft gold glow for depth */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(219,178,185,0.22),transparent)]" />
      <div className="relative mx-auto max-w-[1500px]">
        <Reveal className="flex flex-col items-center text-center">
          {content.eyebrow && (
            <p className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-gold">
              <span className="h-px w-8 bg-gold/50" /> {content.eyebrow} <span className="h-px w-8 bg-gold/50" />
            </p>
          )}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.01em] text-white sm:text-4xl">{content.title}</h2>
          {content.ratingLabel && (
            <div className="mt-4 flex items-center gap-3">
              <Stars rating={5} size={18} />
              <span className="text-sm font-bold text-gold">{content.ratingLabel}</span>
            </div>
          )}
        </Reveal>
        <Reveal className="reveal-grid mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure key={`${t.name}-${i}`} className="flex flex-col rounded-2xl bg-white p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_40px_80px_-32px_rgba(0,0,0,0.6)]">
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
