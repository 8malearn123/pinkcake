import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cake, ChevronLeft, ChevronRight, Expand, Flame, Heart, X } from 'lucide-react';
import { toArabicDigits } from '@/lib/arabicNumerals';

interface ProductGalleryProps {
  images: string[];
  name: string;
  discount: number;
  season?: string | null;
  soldOut: boolean;
  lowStock: number | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/**
 * Editorial product gallery for the storefront PDP.
 *
 * Three layers of looking, in the order shoppers reach for them: a cursor-
 * tracked magnifier on the framed hero (desktop pointing devices), a swipeable
 * frame with a counter and edge arrows (touch), and a full-bleed lightbox with
 * keyboard paging for the deliberate look. Everything is CSS transforms and
 * lucide icons — no new dependencies.
 *
 * RTL: "next" advances toward the visual left, so the forward control sits on
 * the `end` edge and ArrowLeft pages forward — the direction the eye is already
 * travelling in Arabic.
 */
export function ProductGallery({
  images,
  name,
  discount,
  season,
  soldOut,
  lowStock,
  isFavorite,
  onToggleFavorite,
}: ProductGalleryProps) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const touchStart = useRef<number | null>(null);

  // A different product (or a re-ordered gallery) starts from its first frame.
  useEffect(() => {
    setIndex(0);
  }, [images]);

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  // Lightbox: page with the arrow keys, leave with Escape, and freeze the page
  // behind it so the overlay doesn't scroll the product away underneath.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      else if (e.key === 'ArrowLeft') go(1);
      else if (e.key === 'ArrowRight') go(-1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [lightbox, go]);

  const current = images[index] ?? null;

  const trackPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.x) / rect.width) * 100;
    const y = ((e.clientY - rect.y) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) < 44) return;
    go(delta < 0 ? 1 : -1); // swipe toward the left = forward in RTL
  };

  return (
    <div className="lg:sticky lg:top-24">
      {/* Hero frame — cream mat + gold hairline, the way a boutique frames a cake */}
      <div className="rounded-[28px] border border-gold/35 bg-background p-2 shadow-[0_34px_80px_-46px_hsl(var(--primary)/0.75)] sm:p-2.5">
        {/* Portrait on phones; on desktop the frame is capped to the viewport so the
            hero can't push the CTA below the fold on a laptop screen. */}
        <div
          className="group/frame relative aspect-[4/5] overflow-hidden rounded-[22px] bg-blush lg:aspect-auto lg:h-[min(74vh,780px)]"
          onMouseMove={trackPointer}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onTouchStart={(e) => {
            touchStart.current = e.changedTouches[0].clientX;
          }}
          onTouchEnd={onTouchEnd}
        >
          {current ? (
            <img
              src={current}
              alt={`${name} — صورة ${toArabicDigits(index + 1)}`}
              className="size-full object-cover transition-transform duration-[700ms] ease-out"
              style={{ transform: zoom ? 'scale(1.75)' : 'scale(1)', transformOrigin: origin }}
            />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-b from-blush to-border">
              <Cake size={96} strokeWidth={1} className="text-rose/35" />
            </div>
          )}

          {/* Depth scrim — keeps the chips legible over a bright frosting shot */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-foreground/35 to-transparent" />

          {/* Deal / season / urgency badges */}
          <div className="pointer-events-none absolute end-4 top-4 z-10 flex flex-col items-end gap-1.5">
            {discount > 0 && (
              <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                خصم {toArabicDigits(discount)}٪
              </span>
            )}
            {season && (
              <span className="rounded-full bg-seasonal px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                🥭 تشكيلة {season}
              </span>
            )}
            {lowStock !== null && (
              <span className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-seasonal shadow-lg backdrop-blur">
                <Flame size={13} className="fill-seasonal" /> بقي {toArabicDigits(lowStock)} فقط
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `إزالة ${name} من المفضلة` : `إضافة ${name} إلى المفضلة`}
            className="absolute start-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur transition-transform duration-200 hover:scale-110 active:scale-95"
          >
            <Heart
              size={19}
              className={`transition-all duration-300 ${isFavorite ? 'scale-110 fill-primary text-primary' : 'text-muted-foreground'}`}
            />
          </button>

          {/* Sold-out veil — honest, and it stops the CTA reading as available */}
          {soldOut && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-foreground/45 backdrop-blur-[2px]">
              <span className="rounded-full bg-background px-6 py-2.5 text-sm font-black text-primary shadow-xl">
                نفدت الكمية حالياً
              </span>
            </div>
          )}

          {/* Paging arrows — desktop hover affordance */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="الصورة السابقة"
                className="absolute start-3 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full bg-white/90 p-2.5 text-primary opacity-0 shadow-lg backdrop-blur transition-all duration-300 hover:bg-white group-hover/frame:opacity-100 lg:grid"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="الصورة التالية"
                className="absolute end-3 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full bg-white/90 p-2.5 text-primary opacity-0 shadow-lg backdrop-blur transition-all duration-300 hover:bg-white group-hover/frame:opacity-100 lg:grid"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          )}

          {/* Counter + enlarge */}
          <div className="absolute inset-x-4 bottom-4 z-10 flex items-center justify-between">
            {count > 1 ? (
              <span className="rounded-full bg-foreground/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                {toArabicDigits(index + 1)} / {toArabicDigits(count)}
              </span>
            ) : (
              <span />
            )}
            {current && (
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[11px] font-bold text-primary shadow-md backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Expand size={13} /> تكبير الصورة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail rail */}
      {count > 1 && (
        <div className="mt-3.5 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`عرض الصورة ${toArabicDigits(i + 1)}`}
              aria-current={i === index}
              className={`relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-2xl transition-all duration-300 ${
                i === index
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — portalled to <body>. The gallery root is `position: sticky`,
          which always opens a stacking context, so an in-place overlay would paint
          underneath the z-40 storefront header no matter how high its own z-index. */}
      {lightbox && current && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`صور ${name}`}
          className="fixed inset-0 z-[70] flex flex-col bg-foreground/95 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <div className="flex items-center justify-between px-5 py-4 sm:px-8">
            <p className="text-sm font-bold text-white/90">{name}</p>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="إغلاق معرض الصور"
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* min-h-0: a flex child defaults to min-height:auto, which would let a
              tall portrait shot grow past the overlay instead of scaling to fit. */}
          <div
            className="relative flex min-h-0 grow items-center justify-center px-4 pb-4 sm:px-10"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStart.current = e.changedTouches[0].clientX;
            }}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={current}
              alt={`${name} — صورة ${toArabicDigits(index + 1)}`}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="الصورة السابقة"
                  className="absolute start-4 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:start-6"
                >
                  <ChevronRight size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="الصورة التالية"
                  className="absolute end-4 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:end-6"
                >
                  <ChevronLeft size={22} />
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-2 px-5 pb-6" onClick={(e) => e.stopPropagation()}>
              {images.map((src, i) => (
                <button
                  key={`lb-${src}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`عرض الصورة ${toArabicDigits(i + 1)}`}
                  aria-current={i === index}
                  className={`size-14 overflow-hidden rounded-xl transition-all duration-300 ${
                    i === index ? 'ring-2 ring-gold' : 'opacity-45 hover:opacity-80'
                  }`}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
