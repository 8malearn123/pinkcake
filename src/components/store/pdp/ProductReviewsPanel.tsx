import { MessageSquarePlus, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Stars } from '@/components/store/Reviews';
import { Skeleton } from '@/components/ui/skeleton';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { ratingDistribution } from '@/lib/productDetails';
import type { ProductReviewRow } from '@/hooks/useProductReviews';

interface ProductReviewsPanelProps {
  reviews: ProductReviewRow[] | undefined;
  isLoading: boolean;
  average: number;
  count: number;
  onWrite: () => void;
}

/** Gregorian, Arabic month names, Arabic-Indic digits — the storefront's format. */
function reviewDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return toArabicDigits(format(d, 'd MMMM yyyy', { locale: ar }));
}

/**
 * Reviews, on the page instead of behind a dialog.
 *
 * Social proof only persuades when it's readable without a click, so the
 * summary (average, real histogram) and the reviews themselves live inline;
 * the existing dialog stays as the *write* surface, reached from here.
 */
export function ProductReviewsPanel({ reviews, isLoading, average, count, onWrite }: ProductReviewsPanelProps) {
  const rows = reviews ?? [];
  const distribution = ratingDistribution(rows);
  const hasReviews = rows.length > 0;

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="flex flex-col justify-between gap-4 border-b border-primary/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[.08em] text-rose">قالوا عنها</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-.01em] text-foreground sm:text-4xl">آراء من جرّبوها</h2>
        </div>
        <button
          type="button"
          onClick={onWrite}
          className="flex shrink-0 items-center gap-2 self-start rounded-full border-2 border-primary/25 px-5 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-blush sm:self-auto"
        >
          <MessageSquarePlus size={15} /> اكتبي تقييمك
        </button>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <Skeleton className="h-56 rounded-3xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      ) : !hasReviews ? (
        <div className="mt-8 rounded-3xl border border-dashed border-primary/25 bg-background px-6 py-14 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-primary">
            <Quote size={22} />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">ما فيه تقييمات بعد</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
            إذا جرّبتيها، رأيك يساعد غيرك يختار — وما يأخذ أكثر من دقيقة.
          </p>
          <button
            type="button"
            onClick={onWrite}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-t from-pink-dark to-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.8)] transition-transform active:scale-95"
          >
            <MessageSquarePlus size={16} /> كوني أول من يقيّم
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-10">
          {/* Summary + histogram */}
          <div className="h-fit rounded-3xl bg-gradient-to-b from-blush to-background p-6 ring-1 ring-primary/10">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-semibold leading-none text-primary">{toArabicDigits(average || 0)}</span>
              <span className="text-sm font-bold text-muted-foreground">من ٥</span>
            </div>
            <div className="mt-3">
              <Stars rating={average} size={18} />
            </div>
            <p className="mt-2 text-xs font-bold text-muted-foreground">
              بناءً على {toArabicDigits(count || rows.length)} تقييم موثّق
            </p>

            <div className="mt-5 space-y-2">
              {distribution.map((bucket) => (
                <div key={bucket.stars} className="flex items-center gap-2.5">
                  <span className="w-8 shrink-0 text-[11px] font-bold text-muted-foreground">
                    {toArabicDigits(bucket.stars)} ★
                  </span>
                  <span className="h-2 grow overflow-hidden rounded-full bg-primary/10">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-gold to-gold transition-[width] duration-700"
                      style={{ width: `${bucket.pct}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-end text-[11px] font-bold text-muted-foreground">
                    {toArabicDigits(bucket.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((review) => (
              <figure
                key={review.id}
                className="flex flex-col rounded-2xl border border-border bg-background p-6 shadow-[0_16px_44px_-34px_hsl(var(--primary)/0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_-32px_hsl(var(--primary)/0.6)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={review.rating} />
                  <span className="text-[11px] text-muted-foreground">{reviewDate(review.created_at)}</span>
                </div>
                {review.text && (
                  <blockquote className="mt-3.5 grow text-sm leading-7 text-muted-foreground">«{review.text}»</blockquote>
                )}
                <figcaption className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-xs font-semibold text-primary">
                    {review.customer_name.trim().charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-primary">{review.customer_name}</span>
                    <span className="block text-[11px] text-muted-foreground">مشترٍ موثّق</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
