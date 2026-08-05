/**
 * Pure helpers behind the product details page. Kept out of the components so
 * the money-facing maths (discount, savings) and the layout decisions that
 * depend on catalogue size (related picks, column count) are unit-testable.
 */

import type { StoreProduct } from '@/hooks/useCustomerStore';

/** Whole-percent discount vs the "was" price; 0 when there is no real discount. */
export function discountPercent(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

/** Riyals saved vs the "was" price; 0 when there is no real discount. */
export function savingsAmount(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return compareAt - price;
}

export interface RatingBucket {
  /** 5 → 1 */
  stars: number;
  count: number;
  /** Share of all reviews, 0–100 (rounded). */
  pct: number;
}

/**
 * 5→1 histogram of a review list. Ratings are clamped into 1–5 so a stray
 * out-of-range row can never silently vanish from the totals.
 */
export function ratingDistribution(reviews: readonly { rating: number }[]): RatingBucket[] {
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star
  for (const r of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[bucket - 1] += 1;
  }
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = counts[stars - 1];
    return { stars, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
}

/**
 * "You may also like" picks. Same category first (the strongest signal we
 * actually have), then the rest of the catalogue so a thin category never
 * leaves the row half-empty — which is exactly what used to punch a hole in
 * the grid. Sold-out products sink to the end rather than disappearing, so a
 * small catalogue still fills the row.
 */
export function pickRelated(
  products: readonly StoreProduct[] | undefined,
  currentId: string | undefined,
  category: string | null | undefined,
  soldOut: (p: StoreProduct) => boolean,
  limit = 4,
): StoreProduct[] {
  const pool = (products ?? []).filter((p) => p.id !== currentId);
  const rank = (p: StoreProduct) =>
    (p.category && category && p.category === category ? 0 : 1) + (soldOut(p) ? 2 : 0);
  return [...pool].sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

/**
 * Column count for a row of cards, capped at the number of cards so a short
 * row centres instead of trailing empty columns on wide screens.
 */
export function rowGridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1 max-w-sm';
  if (count === 2) return 'grid-cols-2 max-w-3xl';
  if (count === 3) return 'grid-cols-2 lg:grid-cols-3 max-w-5xl';
  return 'grid-cols-2 lg:grid-cols-4';
}
