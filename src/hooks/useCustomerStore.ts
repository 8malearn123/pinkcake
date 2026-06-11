import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_date: string | null;
  delivery_time: string | null;
  created_at: string;
  branch_name: string | null;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[] | null;
}

export interface CustomerOrderDetails extends CustomerOrder {
  updated_at: string;
  branch_address: string | null;
  payment_status: string | null;
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

// Get products for store display (requires authentication)
export function useStoreProducts() {
  return useQuery({
    queryKey: ['store-products'],
    queryFn: async () => {
      // Use secure RPC that requires authentication
      const { data, error } = await supabase.rpc('get_products_for_authenticated_store');
      
      if (error) throw error;
      return (data || []) as StoreProduct[];
    },
  });
}

// Get customer's orders
export function useMyOrders() {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_orders');
      if (error) throw error;
      return (data || []) as CustomerOrder[];
    },
  });
}

// Get single order details for customer
export function useMyOrderDetails(orderId: string | undefined) {
  return useQuery({
    queryKey: ['my-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase.rpc('get_my_order_details', {
        _order_id: orderId,
      });
      if (error) throw error;
      return data?.[0] as CustomerOrderDetails | null;
    },
    enabled: !!orderId,
  });
}

// Real-time order updates for customer
export function useMyOrderRealtime(orderId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          // Refetch order details when updated
          queryClient.invalidateQueries({ queryKey: ['my-order', orderId] });
          queryClient.invalidateQueries({ queryKey: ['my-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);
}

// Create customer order
export function useCreateCustomerOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      branchId,
      deliveryDate,
      deliveryTime,
      items,
    }: {
      branchId: string;
      deliveryDate: string;
      deliveryTime: string;
      items: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
      }[];
    }) => {
      const { data, error } = await supabase.rpc('create_customer_order', {
        _branch_id: branchId,
        _delivery_date: deliveryDate,
        _delivery_time: deliveryTime,
        _items: items,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast({
        title: 'تم إرسال الطلب',
        description: 'سيتم التواصل معك لتأكيد الطلب',
      });
    },
    onError: (error) => {
      console.error('Create order error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    },
  });
}

// Get branches for customer selection (requires authentication)
export function useStoreBranches() {
  return useQuery({
    queryKey: ['store-branches'],
    queryFn: async () => {
      // Use secure RPC that requires authentication
      const { data, error } = await supabase.rpc('get_branches_for_authenticated_store');
      
      if (error) throw error;
      return (data || []) as { id: string; name: string; address: string }[];
    },
  });
}

// Get customer profile (own record only via secure RPC)
export function useCustomerProfile() {
  return useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_customer_profile');
      if (error) throw error;
      return data?.[0] || null;
    },
  });
}
