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
  occasions?: string[] | null;
  is_available?: boolean | null;
  stock?: number | null;
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
    mutationFn: async (payload: {
      branchId?: string | null;
      fulfillmentMode: 'delivery' | 'pickup';
      recipientName: string;
      recipientPhone: string;
      address?: string | null;
      deliveryDate: string;
      deliveryTime: string;
      isGift?: boolean;
      cardMessage?: string | null;
      giftRecipientName?: string | null;
      giftRecipientPhone?: string | null;
      notes?: string | null;
      deliveryFee?: number;
      items: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
      }[];
    }) => {
      // The order RPC gains the richer checkout fields on the backend (recipient,
      // fulfilment mode, address, gift + card message…); call it through an
      // untyped view until the generated types are regenerated. In demo mode the
      // mock returns an order id so the confirmation screen has one.
      const client = supabase as unknown as {
        rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      };
      const { data, error } = await client.rpc('create_customer_order', {
        _branch_id: payload.branchId ?? null,
        _fulfillment_mode: payload.fulfillmentMode,
        _recipient_name: payload.recipientName,
        _recipient_phone: payload.recipientPhone,
        _address: payload.address ?? null,
        _delivery_date: payload.deliveryDate,
        _delivery_time: payload.deliveryTime,
        _is_gift: payload.isGift ?? false,
        _card_message: payload.cardMessage ?? null,
        _gift_recipient_name: payload.giftRecipientName ?? null,
        _gift_recipient_phone: payload.giftRecipientPhone ?? null,
        _notes: payload.notes ?? null,
        _delivery_fee: payload.deliveryFee ?? 0,
        _items: payload.items,
      });

      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | string | null;
      if (typeof row === 'string') return { orderId: row, orderNumber: row };
      return {
        orderId: String((row as Record<string, unknown>)?.order_id ?? (row as Record<string, unknown>)?.id ?? ''),
        orderNumber: String((row as Record<string, unknown>)?.order_number ?? ''),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (error) => {
      console.error('Create order error:', error);
      toast({
        title: 'تعذّر إرسال الطلب',
        description: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
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
