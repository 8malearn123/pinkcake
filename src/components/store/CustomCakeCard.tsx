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
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-[#f3e8ec] bg-[#fffdfa] text-start shadow-[0_12px_40px_-26px_rgba(158,58,92,0.4)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#e8d3db] hover:shadow-[0_26px_60px_-28px_rgba(158,58,92,0.55)]"
    >
      {/* Media */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#fbeef2]">
        <img
          src={previewUrl}
          alt={cake.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#2c2226]/30 to-transparent" />

        <span className="pointer-events-none absolute end-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#9e3a5c] shadow-sm backdrop-blur">
          <Wand2 size={11} /> قابلة للتخصيص
        </span>

        {/* Hover shortcut — decorative, the whole card already does this */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex translate-y-3 items-center justify-center gap-1.5 rounded-full bg-white/95 py-2.5 text-xs font-bold text-[#9e3a5c] opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Wand2 size={14} /> صمّمها
        </span>
      </div>

      {/* Body */}
      <div className="flex grow flex-col p-4">
        <h3 className="line-clamp-1 text-base font-black leading-6 text-[#2c2226]">{cake.name}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-[#857077]">
          <span className="flex items-center gap-1">
            <Users size={13} /> <bdi dir="ltr">{cake.serves}</bdi>
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {cake.leadTime}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="mb-3 h-px bg-gradient-to-r from-transparent via-[#ddbd75]/60 to-transparent" />
          <span className="flex items-baseline gap-1.5 text-[#9e3a5c]">
            <span className="text-[11px] font-bold text-[#857077]">من</span>
            <span className="flex items-baseline gap-1 text-2xl font-black leading-none">
              {toArabicDigits(cake.basePrice)} <RiyalSymbol className="text-lg" />
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
