import { ArrowLeft } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { iconFor } from '@/lib/homepage/icons';
import { SECTION_DEFAULTS, type SectionContent } from '@/lib/homepage/schema';
import { visibleItems } from '@/hooks/useHomepageContent';
import type { CtaTarget } from '@/lib/homepage/types';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface StoreHeroProps {
  /** محتوى القسم من لوحة الإدارة؛ يعود إلى النصّ الأصلي حين لا يُمرَّر. */
  content?: SectionContent['hero'];
  /** ينفّذ وجهة الزرّ: `#قسم` تمرير، و`/مسار` انتقال. */
  onCta: (target: CtaTarget) => void;
  /**
   * The real product behind "اختيار هذا الأسبوع". The overlay card is only
   * rendered when one is supplied, so its name and price always match an item
   * the shopper can actually open — never decorative copy that links nowhere.
   */
  featured?: StoreProduct;
  onViewFeatured?: () => void;
}

/**
 * Full-bleed hero — an edge-to-edge cake photograph with the copy set over it.
 * Legibility comes from a flat tint plus a vertical scrim (both direction-neutral,
 * so nothing needs to flip under RTL); every positioned overlay uses logical
 * utilities. Motion reuses the shared, reduced-motion-gated hero classes.
 */
export function StoreHero({
  content = SECTION_DEFAULTS.hero,
  onCta,
  featured,
  onViewFeatured,
}: StoreHeroProps) {
  const { image, seal, eyebrow, title, lede, primaryCta, secondaryCta, featuredPick } = content;

  return (
    <section id="top" className="relative isolate min-h-[590px] overflow-hidden bg-foreground lg:min-h-[730px]">
      <img
        src={image.url}
        alt={image.alt}
        width={2000}
        height={1200}
        loading="eager"
        decoding="async"
        className="store-hero-img absolute inset-0 size-full object-cover"
      />

      {/* Scrims — flat tint for overall legibility, vertical wash to ground the base */}
      <div aria-hidden className="absolute inset-0 bg-foreground/55" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/25 to-foreground/60" />

      {/* Gold seal — `whitespace-pre-line` so the admin's line breaks survive */}
      {seal.visible && seal.text && (
        <div className="absolute end-6 top-[calc(84px+1.5rem)] z-10 hidden size-20 -rotate-[8deg] place-items-center rounded-full bg-gold text-center text-primary shadow-[0_14px_30px_-10px_rgba(0,0,0,0.55)] ring-4 ring-white/25 sm:end-10 sm:grid">
          <span className="whitespace-pre-line text-[10px] font-bold leading-tight">{seal.text}</span>
        </div>
      )}

      {/* Copy */}
      <div className="relative z-10 mx-auto flex min-h-[590px] max-w-[1500px] flex-col justify-center px-6 pb-20 pt-[calc(4rem+5rem)] sm:px-12 md:pt-[calc(84px+5rem)] lg:min-h-[730px] lg:px-20">
        <div className="store-hero-stagger max-w-2xl">
          {eyebrow && (
            <p className="flex items-center gap-2.5 text-xs font-bold tracking-[.14em] text-gold">
              <span className="h-px w-9 bg-gold/60" /> {eyebrow}
            </p>
          )}
          <h1 className="mt-5 text-[clamp(2.9rem,6vw,5.8rem)] font-black leading-[1.08] tracking-[-.01em] text-white">
            {title}
          </h1>
          {lede && <p className="mt-6 max-w-lg text-sm leading-8 text-white/75 sm:text-base">{lede}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            {primaryCta.visible && (
              <button
                onClick={() => onCta(primaryCta.target)}
                className="group/cta flex items-center gap-2 rounded-xl bg-gold px-7 py-4 text-sm font-black text-berry-dark shadow-[0_18px_38px_-14px_rgba(0,0,0,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                {primaryCta.label}
                <ArrowLeft size={16} className="transition-transform duration-300 group-hover/cta:-translate-x-1" />
              </button>
            )}
            {secondaryCta.visible && (
              <button
                onClick={() => onCta(secondaryCta.target)}
                className="rounded-xl border border-white/45 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
              >
                {secondaryCta.label}
              </button>
            )}
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-xs font-bold text-white/80">
            {visibleItems(content.trust).map((t) => {
              const Icon = iconFor(t.icon);
              return (
                <span key={t.text} className="flex items-center gap-2">
                  {/* النجمة مصمتة كما في التصميم الأصلي، لكن بلون الرمز لا بلون مكتوب */}
                  <Icon
                    size={17}
                    className="text-gold"
                    {...(t.icon === 'star' ? { fill: 'currentColor', strokeWidth: 0 } : {})}
                  />
                  {t.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured pick — kept off the copy side, hidden on the narrowest screens.
          The whole card is the hit area and opens that product's page; `text-start`
          restores the reading alignment a <button> would otherwise centre. */}
      {featured && featuredPick.visible && (
        <button
          type="button"
          onClick={onViewFeatured}
          aria-label={`عرض ${featured.name}`}
          className="group/pick absolute bottom-8 end-6 z-10 hidden rounded-xl border border-white/15 bg-foreground/70 p-4 text-start shadow-[0_22px_50px_-22px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/70 hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-foreground sm:block sm:end-10 lg:bottom-12"
        >
          <p className="text-[10px] font-bold tracking-[.12em] text-gold">{featuredPick.eyebrow}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-white">
            {featured.name}
            <ArrowLeft size={14} className="shrink-0 text-gold transition-transform duration-300 group-hover/pick:-translate-x-1" />
          </p>
          <p className="mt-1 flex items-baseline gap-1 text-xs text-white/65">
            من {toArabicDigits(featured.price)} <RiyalSymbol className="text-[10px]" />
          </p>
        </button>
      )}
    </section>
  );
}
