import { cn } from '@/lib/utils';
import { LOGO_AR, LOGO_EN, LOGO_MARK } from './logoPaths';

/**
 * The Pink Cake logo, as vector — not a lucide stand-in.
 *
 * Until now the "logo" was a `<Cake/>` icon in a gradient tile plus the store
 * name as text, copy-pasted across seven screens. These paths are the real
 * artwork lifted out of the client's master file, so every surface now shows
 * the same mark the packaging does.
 *
 * Sizing is height-driven: pass `h-*` and the width follows the lockup's own
 * aspect ratio. The paths carry no fill, so `text-*` colours the mark — ink on
 * rose, rose on ink, or white over a photo, all from one asset.
 */

const VARIANTS = {
  /** «بينك كيك» — the primary lockup. The app is Arabic-first, so this is the default. */
  ar: { data: LOGO_AR, label: 'بينك كيك' },
  /** “Pink Cake” — the Latin lockup, for bilingual and export surfaces. */
  en: { data: LOGO_EN, label: 'Pink Cake' },
  /** The cupcake alone. Below ~14px the wordmark closes up, so chrome uses this. */
  mark: { data: LOGO_MARK, label: 'بينك كيك' },
} as const;

export type BrandLogoVariant = keyof typeof VARIANTS;

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  /**
   * Decorative only — when the lockup sits beside a text wordmark that already
   * names the store, this drops it out of the accessibility tree instead of
   * making a screen reader say "بينك كيك بينك كيك".
   */
  decorative?: boolean;
}

export function BrandLogo({ variant = 'ar', className, decorative = false }: BrandLogoProps) {
  const { data, label } = VARIANTS[variant];

  return (
    <svg
      viewBox={`0 0 ${data.width} ${data.height}`}
      fill="currentColor"
      className={cn('w-auto', className)}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
    >
      {!decorative && <title>{label}</title>}
      {data.paths.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}

/**
 * The mark on its rose field — the logo's own colour pairing, boxed.
 *
 * This is the app's avatar/tile form: the console lockup, the auth screens and
 * the settings preview all open with it. Kept as one component so the plate's
 * proportions (and the mark's optical padding inside it) can never drift
 * between screens.
 */
export function BrandPlate({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div
      className={cn(
        'grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-rose text-brand-ink',
        className,
      )}
    >
      <BrandLogo variant="mark" decorative className={cn('h-1/2', markClassName)} />
    </div>
  );
}
