import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Cake & Bloom editorial primitives.
 *
 * These encode the vocabulary the home page established — section rhythm,
 * eyebrow + hairline + black heading, lede, chips, photo scrims — which was
 * previously re-declared inline in ~60 places across 11 files.
 *
 * They are shared by both faces of the product: `variant="console"` keeps the
 * compact staff density while using the exact same palette, type ramp and
 * surfaces as the storefront. Same language, different breathing room.
 */

/* ── Section ───────────────────────────────────────────────────────────────── */

type SectionVariant = 'list' | 'feature' | 'console';
type SectionWidth = 'wide' | 'default' | 'prose' | 'full';

const SECTION_PADDING: Record<SectionVariant, string> = {
  /** Utility/list sections — product grids, FAQ, seasonal rails. */
  list: 'px-5 py-14 sm:px-8 lg:px-12 lg:py-20',
  /** Editorial feature sections — combos, events, branches. */
  feature: 'px-5 py-20 sm:px-8 lg:px-12 lg:py-28',
  /** Staff console — MainLayout already supplies the page padding. */
  console: '',
};

const SECTION_WIDTH: Record<SectionWidth, string> = {
  wide: 'mx-auto max-w-[1500px]',
  default: 'mx-auto max-w-[1400px]',
  prose: 'mx-auto max-w-[820px]',
  full: '',
};

interface SectionProps {
  children: ReactNode;
  variant?: SectionVariant;
  width?: SectionWidth;
  /** Applied to the outer <section> — use for full-bleed backgrounds. */
  className?: string;
  /** Applied to the inner width-constrained wrapper. */
  innerClassName?: string;
  id?: string;
}

export function Section({
  children,
  variant = 'list',
  width = 'wide',
  className,
  innerClassName,
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn(SECTION_PADDING[variant], className)}>
      <div className={cn(SECTION_WIDTH[width], innerClassName)}>{children}</div>
    </section>
  );
}

/* ── Eyebrow ───────────────────────────────────────────────────────────────── */

type Tone = 'light' | 'dark';

interface EyebrowProps {
  children: ReactNode;
  /** `dark` = sitting on a dark berry band, so the eyebrow turns gold. */
  tone?: Tone;
  /** Leading hairline rule. `both` brackets the text (centred headers). */
  rule?: boolean | 'both';
  /** Uppercase + wide tracking. The home page uses this on feature sections. */
  caps?: boolean;
  className?: string;
}

export function Eyebrow({ children, tone = 'light', rule, caps, className }: EyebrowProps) {
  const line = (
    <span
      aria-hidden
      className={cn('h-px w-10 shrink-0', tone === 'dark' ? 'bg-gold/60' : 'bg-primary/25')}
    />
  );
  return (
    <p
      className={cn(
        'flex items-center gap-3 font-bold',
        caps ? 'text-[11px] uppercase tracking-[.22em]' : 'text-xs tracking-[.08em]',
        tone === 'dark' ? 'text-gold' : 'text-rose',
        className,
      )}
    >
      {rule && line}
      {children}
      {rule === 'both' && line}
    </p>
  );
}

/* ── Titles ────────────────────────────────────────────────────────────────── */

interface TitleProps {
  children: ReactNode;
  /** `display` = feature-section hero size. `h2` = list-section size. */
  variant?: 'display' | 'h2' | 'h3';
  tone?: Tone;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

const TITLE_SIZE = {
  display: 'text-[2.5rem] leading-[1.05] sm:text-[3.25rem]',
  h2: 'text-3xl sm:text-4xl',
  h3: 'text-lg leading-tight',
} as const;

export function Title({ children, variant = 'h2', tone = 'light', as, className }: TitleProps) {
  const Comp = as ?? (variant === 'display' ? 'h2' : variant === 'h3' ? 'h3' : 'h2');
  return (
    <Comp
      className={cn(
        'font-black tracking-[-.01em]',
        TITLE_SIZE[variant],
        tone === 'dark' ? 'text-white' : 'text-foreground',
        className,
      )}
    >
      {children}
    </Comp>
  );
}

/** The second line of a two-line display heading, in the softer rose. */
export function TitleAccent({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('block text-rose', className)}>{children}</span>;
}

/* ── Lede ──────────────────────────────────────────────────────────────────── */

export function Lede({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-[15px] leading-8',
        tone === 'dark' ? 'text-white/75' : 'text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}

/* ── Rules ─────────────────────────────────────────────────────────────────── */

/** Fading-gold hairline — the browse-zone → buy-zone divider inside cards. */
export function GoldRule({ className }: { className?: string }) {
  return <div aria-hidden className={cn('gold-rule', className)} />;
}

/** The centred ✦ section break the home page uses between bands. */
export function GoldDivider() {
  return (
    <div className="mx-auto flex max-w-[1500px] items-center justify-center gap-3 px-5 py-2">
      <span aria-hidden className="h-px w-16 bg-gradient-to-l from-gold to-transparent" />
      <span aria-hidden className="text-gold">
        ✦
      </span>
      <span aria-hidden className="h-px w-16 bg-gradient-to-r from-gold to-transparent" />
    </div>
  );
}

/* ── Chip ──────────────────────────────────────────────────────────────────── */

type ChipTone = 'berry' | 'gold' | 'seasonal' | 'success' | 'glass' | 'blush';

const CHIP_TONE: Record<ChipTone, string> = {
  berry: 'bg-primary text-primary-foreground shadow-md',
  gold: 'bg-gold text-primary',
  seasonal: 'bg-seasonal text-white shadow-md',
  success: 'bg-success text-success-foreground shadow-lg shadow-foreground/20',
  /** Over photography — frosted white so it stays legible on any image. */
  glass: 'bg-white/90 text-foreground shadow-sm backdrop-blur',
  blush: 'bg-blush text-rose',
};

export function Chip({
  children,
  tone = 'berry',
  className,
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        CHIP_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── PhotoTile ─────────────────────────────────────────────────────────────── */

/**
 * A photo well with the canonical hover-zoom and one of two scrims — the home
 * page had drifted to six near-identical gradient stops.
 */
export function PhotoTile({
  src,
  alt,
  ratio = 'card',
  scrim = 'soft',
  children,
  className,
  imgClassName,
  fallback,
}: {
  src?: string | null;
  alt: string;
  /** `card` = 4/5 product well, `wide` = 4/3, `fill` = absolute-fill parent. */
  ratio?: 'card' | 'wide' | 'fill';
  scrim?: 'soft' | 'strong' | 'none';
  children?: ReactNode;
  className?: string;
  imgClassName?: string;
  fallback?: ReactNode;
}) {
  const RATIO = {
    card: 'aspect-[4/5]',
    wide: 'aspect-[4/3]',
    fill: 'absolute inset-0',
  } as const;

  const SCRIM = {
    soft: 'bg-gradient-to-t from-foreground/30 to-transparent',
    strong: 'bg-gradient-to-t from-foreground/90 via-foreground/25 to-transparent',
    none: '',
  } as const;

  return (
    <div className={cn('relative overflow-hidden bg-blush', RATIO[ratio], className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(
            'size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105',
            imgClassName,
          )}
        />
      ) : (
        <div className="grid size-full place-items-center bg-gradient-to-b from-blush to-border">
          {fallback}
        </div>
      )}
      {scrim !== 'none' && (
        <div
          aria-hidden
          className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-24', SCRIM[scrim])}
        />
      )}
      {children}
    </div>
  );
}
