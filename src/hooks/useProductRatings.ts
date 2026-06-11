import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductRating {
  product_id: string;
  average_rating: number;
  review_count: number;
}

export function useProductRatings(productIds: string[]) {
  return useQuery({
    queryKey: ['product-ratings', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return {};

      const ratingsMap: Record<string, ProductRating> = {};

      // Fetch ratings for all products in parallel
      const promises = productIds.map(async (productId) => {
        const { data, error } = await supabase.rpc('get_product_rating', {
          _product_id: productId,
        });
        if (error) {
          console.error('Error fetching rating:', error);
          return null;
        }
        if (data && data[0]) {
          return {
            product_id: productId,
            average_rating: Number(data[0].average_rating) || 0,
            review_count: Number(data[0].review_count) || 0,
          };
        }
        return null;
      });

      const results = await Promise.all(promises);
      
      results.forEach((result) => {
        if (result) {
          ratingsMap[result.product_id] = result;
        }
      });

      return ratingsMap;
    },
    enabled: productIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
}
