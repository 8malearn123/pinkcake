import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductOptionValue {
  id: string;
  value_name: string;
  price_adjustment: number;
  is_available: boolean;
}

export interface ProductOption {
  id: string;
  option_name: string;
  option_type: 'single' | 'multiple';
  is_required: boolean;
  display_order: number;
  values: ProductOptionValue[] | null;
}

export interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductDetails {
  id: string;
  name: string;
  description: string | null;
  rich_description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  images: ProductImage[];
  options: ProductOption[];
}

export function useProductDetails(productId: string | null) {
  return useQuery({
    queryKey: ['product-details', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase.rpc('get_product_with_options', {
        _product_id: productId,
      });

      if (error) throw error;
      
      // RPC returns array, get first item
      const product = Array.isArray(data) ? data[0] : data;
      if (!product) return null;
      
      // Parse JSON fields
      return {
        ...product,
        images: (product.images || []) as unknown as ProductImage[],
        options: (product.options || []) as unknown as ProductOption[],
      } as ProductDetails;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}
