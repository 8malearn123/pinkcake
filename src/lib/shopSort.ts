import type { StoreProduct } from '@/hooks/useCustomerStore';

/**
 * Shared storefront sort — the single source of truth for both the landing
 * (`/`, Store.tsx) and the catalog page (`/shop`, Shop.tsx) so the two product
 * listings never drift. Pure, no React.
 */
export const SORTS = [
  { value: 'featured', label: 'المميّزة' },
  { value: 'price-asc', label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'name', label: 'الاسم (أ–ي)' },
] as const;

type RatingsMap = Record<string, { average_rating: number; review_count: number }> | undefined;

/** Returns a new, sorted array (never mutates the input). 'featured' keeps source order. */
export function sortProducts(list: StoreProduct[], sort: string, ratingsMap?: RatingsMap): StoreProduct[] {
  const rate = (id: string) => ratingsMap?.[id]?.average_rating ?? 0;
  switch (sort) {
    case 'price-asc':
      return [...list].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...list].sort((a, b) => b.price - a.price);
    case 'rating':
      return [...list].sort((a, b) => rate(b.id) - rate(a.id));
    case 'name':
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    default:
      return list;
  }
}
