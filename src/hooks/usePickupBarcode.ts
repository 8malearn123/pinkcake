import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook for customers to get their pickup code
export function useMyPickupCode(orderId: string | undefined) {
  return useQuery({
    queryKey: ['my-pickup-code', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase.rpc('get_my_pickup_code', {
        _order_id: orderId
      });
      
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!orderId,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for branch managers to get order details by pickup code
export function useOrderByPickupCode(pickupCode: string | null) {
  return useQuery({
    queryKey: ['order-by-pickup-code', pickupCode],
    queryFn: async () => {
      if (!pickupCode) return null;
      
      const { data, error } = await supabase.rpc('get_order_by_pickup_code', {
        _pickup_code: pickupCode
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!pickupCode,
    staleTime: 0, // Always fetch fresh data
  });
}

// Hook for branch managers to process pickup
export function useProcessPickup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pickupCode: string) => {
      const { data, error } = await supabase.rpc('process_pickup_by_code', {
        _pickup_code: pickupCode
      });
      
      if (error) throw error;
      
      const result = data as {
        success: boolean;
        error?: string;
        error_code?: string;
        order_id?: string;
        order_number?: string;
        pickup_at?: string;
        confirmed_by?: string;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في معالجة الاستلام');
      }
      
      return result;
    },
    onSuccess: (data) => {
      toast.success(`تم تأكيد استلام الطلب ${data.order_number}`);
      queryClient.invalidateQueries({ queryKey: ['branch-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-pickup-code'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
