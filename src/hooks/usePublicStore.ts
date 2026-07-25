import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  images?: string[] | null;
  occasions?: string[] | null;
  is_available?: boolean | null;
  stock?: number | null;
  /** Original ("was") price for a discount — strike-through when > price. */
  compare_at_price?: number | null;
  /** Seasonal collection tag (e.g. "صيف"); groups a limited-time collection. */
  season?: string | null;
}

export interface StoreBranch {
  id: string;
  name: string;
  address: string | null;
}

/** A product is unavailable when explicitly flagged out, or its stock hits zero. */
export const isSoldOut = (p: { is_available?: boolean | null; stock?: number | null }) =>
  p.is_available === false || p.stock === 0;

// Get products for public store display (no auth required)
export function usePublicStoreProducts() {
  return useQuery({
    queryKey: ['public-store-products'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_products_for_public_store');
      
      if (error) throw error;
      return (data || []) as StoreProduct[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Get branches for public store (no auth required)
export function usePublicStoreBranches() {
  return useQuery({
    queryKey: ['public-store-branches'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_branches_for_public_store');
      
      if (error) throw error;
      return (data || []) as StoreBranch[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
