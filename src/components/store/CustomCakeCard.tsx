import { Clock, Users, Wand2 } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { CatalogCake } from '@/lib/cakeCatalog/types';

interface CustomCakeCardProps {
  cake: CatalogCake;
  /** Resolved object URL for the cover photo — a cake without one never reaches here. */
  previewUrl: string;
  /** Opens the studio pre-seeded with this cake. */
  onPick: () => void;
}

/**
 * A designable cake, in the Jazan storefront language.
 *
 * Shares StoreProductCard's rhythm (4:5 media, hover lift, berry price hero) but
 * drops the cart controls: the whole card is one button, because the only action
 * is "start designing this one". Price reads «من …» — options add on top of the base.
 */
export function CustomCakeCard({ cake, previewUrl, onPick }: CustomCakeCardProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`صمّم ${cake.name}`}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-start shadow-[0_12px_40px_-26px_hsl(var(--primary)/0.4)] transition-all duration-300 hover:-translate-y-1.5 hover:border-border hover:shadow-[0_26px_60px_-28px_hsl(var(--primary)/0.55)]"
    >
      {/* Media */}
      <div className="relative aspect-[4/5] overflow-hidden bg-blush">
        <img
          src={previewUrl}
          alt={cake.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-foreground/30 to-transparent" />

        <span className="pointer-events-none absolute end-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm backdrop-blur">
          <Wand2 size={11} /> قابلة للتخصيص
        </span>

        {/* Hover shortcut — decorative, the whole card already does this */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex translate-y-3 items-center justify-center gap-1.5 rounded-full bg-white/95 py-2.5 text-xs font-bold text-primary opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Wand2 size={14} /> صمّمها
        </span>
      </div>

      {/* Body */}
      <div className="flex grow flex-col p-4">
        <h3 className="line-clamp-1 text-base font-semibold leading-6 text-foreground">{cake.name}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users size={13} /> <bdi dir="ltr">{cake.serves}</bdi>
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {cake.leadTime}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="mb-3 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <span className="flex items-baseline gap-1.5 text-primary">
            <span className="text-[11px] font-bold text-muted-foreground">من</span>
            <span className="flex items-baseline gap-1 text-2xl font-semibold leading-none">
              {toArabicDigits(cake.basePrice)} <RiyalSymbol className="text-lg" />
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
