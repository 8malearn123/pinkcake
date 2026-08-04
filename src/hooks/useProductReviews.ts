import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductReviewRow {
  id: string;
  rating: number;
  text: string | null;
  customer_name: string;
  created_at: string;
}

/** Shape tolerance: the review body has been called both things across sources. */
interface RawReview {
  id?: string;
  product_id?: string;
  rating?: number | string;
  review_text?: string | null;
  comment?: string | null;
  customer_name?: string | null;
  created_at?: string;
}

/**
 * Reviews for a single product, normalised for the storefront.
 *
 * The product page renders reviews inline (not just inside the write-a-review
 * dialog), so it needs the rows themselves rather than the aggregate that
 * `useProductRatings` returns. Rows are normalised because the review body
 * arrives as `review_text` from the database RPC and as `comment` from the demo
 * fixtures, and the demo RPC ignores its product filter — so rows that carry a
 * `product_id` are re-checked here.
 */
export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async (): Promise<ProductReviewRow[]> => {
      const { data, error } = await supabase.rpc('get_product_reviews', {
        _product_id: productId as string,
      });
      if (error) throw error;

      return ((data ?? []) as RawReview[])
        .filter((r) => !r.product_id || r.product_id === productId)
        .map((r, i) => ({
          id: r.id ?? `review-${i}`,
          rating: Number(r.rating) || 0,
          text: r.review_text ?? r.comment ?? null,
          customer_name: r.customer_name || 'عميل',
          created_at: r.created_at ?? '',
        }));
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}
