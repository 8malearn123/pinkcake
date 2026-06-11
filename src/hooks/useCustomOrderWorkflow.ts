import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PricedOrderForSupport {
  id: string;
  order_number: string;
  customer_name: string;
  branch_name: string;
  pickup_date: string;
  pickup_time: string;
  product_type: string;
  chef_proposed_price: number;
  chef_preparation_time: string;
  customer_visible_notes: string | null;
  created_at: string;
  chef_reviewed_at: string;
  status: string;
}

export interface CustomerPricingRequest {
  id: string;
  order_number: string;
  branch_name: string;
  pickup_date: string;
  pickup_time: string;
  product_type: string;
  occasion: string | null;
  proposed_price: number;
  preparation_time: string;
  chef_notes: string | null;
  pricing_sent_at: string;
  status: string;
}

// Hook for customer support to send orders to chef
export function useSendToChef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('send_custom_order_to_chef', {
        _order_id: orderId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['custom-orders-review'] });
      toast({
        title: 'تم إرسال الطلب للشيف',
        description: 'سيقوم الشيف بمراجعة الطلب وتحديد السعر',
      });
    },
    onError: (error) => {
      console.error('Send to chef error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال الطلب للشيف: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook for customer support to get priced orders
export function usePricedOrdersForSupport() {
  return useQuery({
    queryKey: ['priced-orders-support'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_priced_orders_for_support');
      if (error) throw error;
      return (data || []) as PricedOrderForSupport[];
    },
  });
}

// Hook to send pricing to customer
export function useSendPricingToCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('send_pricing_to_customer', {
        _order_id: orderId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['priced-orders-support'] });
      toast({
        title: 'تم إرسال السعر للعميل',
        description: 'سيتمكن العميل من قبول أو رفض السعر',
      });
    },
    onError: (error) => {
      console.error('Send pricing error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال السعر للعميل: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook for customers to get their pricing requests
export function useMyPricingRequests() {
  return useQuery({
    queryKey: ['my-pricing-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_pricing_requests');
      if (error) throw error;
      return (data || []) as CustomerPricingRequest[];
    },
  });
}

// Hook for customers to respond to pricing
export function useRespondToPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, accepted, rejectionReason }: {
      orderId: string;
      accepted: boolean;
      rejectionReason?: string;
    }) => {
      const { data, error } = await supabase.rpc('customer_respond_to_pricing', {
        _order_id: orderId,
        _accepted: accepted,
        _rejection_reason: rejectionReason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      if (variables.accepted) {
        toast({
          title: 'تم قبول السعر',
          description: 'يرجى إتمام الدفع للمتابعة',
        });
      } else {
        toast({
          title: 'تم رفض السعر',
          description: 'تم إبلاغ خدمة العملاء بقرارك',
        });
      }
    },
    onError: (error) => {
      console.error('Respond to pricing error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال ردك: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}
