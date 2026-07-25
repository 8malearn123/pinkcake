import { useMemo } from 'react';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import type { StoreProduct } from '@/hooks/useCustomerStore';

type RatingsMap = Record<string, { average_rating: number; review_count: number }> | undefined;

/**
 * Honest, attribute-based suggestions — NOT "frequently bought together" (no
 * co-purchase data exists). Ranks the live catalogue by how well each product
 * shares a category/occasion with the given context (e.g. the cart), then by
 * real average rating. Excludes in-cart ids and sold-out products.
 */
export function useComplementSuggestions({
  context = [],
  excludeIds,
  ratingsMap,
  limit = 6,
}: {
  context?: StoreProduct[];
  excludeIds?: Set<string> | string[];
  ratingsMap?: RatingsMap;
  limit?: number;
}): StoreProduct[] {
  const { data: products } = usePublicStoreProducts();
  return useMemo(() => {
    const exclude = excludeIds instanceof Set ? excludeIds : new Set(excludeIds ?? []);
    const contextCats = new Set(context.map((p) => p.category).filter(Boolean) as string[]);
    const contextOccs = new Set(context.flatMap((p) => p.occasions ?? []));
    const rate = (id: string) => ratingsMap?.[id]?.average_rating ?? 0;

    const scored = (products ?? [])
      .filter((p) => !exclude.has(p.id) && !isSoldOut(p))
      .map((p) => {
        let score = 0;
        if (p.category && contextCats.has(p.category)) score += 1;
        for (const o of p.occasions ?? []) if (contextOccs.has(o)) score += 1;
        return { p, score };
      });

    scored.sort((a, b) => b.score - a.score || rate(b.p.id) - rate(a.p.id));
    return scored.slice(0, limit).map((s) => s.p);
  }, [products, context, excludeIds, ratingsMap, limit]);
}
