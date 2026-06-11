import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Enums } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type OrderStatus = Enums<'order_status'>;

interface KitchenOrderItem {
  product_name: string;
  quantity: number;
  notes: string | null;
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  branch_id: string | null;
  branch_name: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  notes: string | null;
  created_at: string;
  items: KitchenOrderItem[] | null;
}

export function useKitchenOrders() {
  return useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      // Use secure function that masks sensitive data
      const { data, error } = await supabase.rpc('get_kitchen_orders_secure');

      if (error) throw error;

      // Parse items from JSON
      return (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        branch_id: order.branch_id,
        branch_name: order.branch_name,
        delivery_date: order.delivery_date,
        delivery_time: order.delivery_time,
        notes: order.notes,
        created_at: order.created_at,
        items: order.items ? (Array.isArray(order.items) ? order.items : JSON.parse(order.items)) : null,
      })) as KitchenOrder[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Simple status update for starting preparation (paid -> preparing)
export function useUpdateKitchenOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      // Only allow starting preparation directly
      if (status === 'preparing') {
        const { data, error } = await supabase
          .from('orders')
          .update({ 
            status,
            status_changed_at: new Date().toISOString(),
            status_changed_role: 'kitchen'
          })
          .eq('id', orderId)
          .select('id')
          .single();

        if (error) throw error;
        return data;
      }
      
      throw new Error('استخدم الوظائف المخصصة لتغيير الحالة');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة الطلب: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Secure function to mark order as ready (generates barcode automatically)
export function useMarkOrderReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('kitchen_mark_order_ready', {
        _order_id: orderId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string; barcode_code?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في تحديث الطلب');
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['handover-barcode'] });
      toast({
        title: 'تم التجهيز',
        description: data.message || 'تم تجهيز الطلب وإنشاء باركود التسليم',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Secure function to send order to branch (requires barcode to be scanned first)
export function useSendToBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('kitchen_send_to_branch', {
        _order_id: orderId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; error_code?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في إرسال الطلب');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال الطلب للفرع بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'لا يمكن إرسال الطلب',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
