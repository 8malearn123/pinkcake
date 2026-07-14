import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Hook for generating handover barcode
export function useGenerateHandoverBarcode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, barcodeType }: { orderId: string; barcodeType: string }) => {
      const { data, error } = await supabase.rpc('generate_handover_barcode', {
        _order_id: orderId,
        _barcode_type: barcodeType
      });
      
      if (error) throw error;
      return data as string;
    },
    onSuccess: (data, variables) => {
      toast({ title: 'تم إنشاء الباركود بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['handover-barcode', variables.orderId] });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook for getting handover barcode
export function useHandoverBarcode(orderId: string | undefined, barcodeType: string) {
  return useQuery({
    queryKey: ['handover-barcode', orderId, barcodeType],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase.rpc('get_handover_barcode', {
        _order_id: orderId,
        _barcode_type: barcodeType
      });
      
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!orderId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Hook for scanning handover barcode
export function useScanHandoverBarcode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (barcodeCode: string) => {
      const { data, error } = await supabase.rpc('scan_handover_barcode', {
        _barcode_code: barcodeCode
      });
      
      if (error) throw error;
      
      const result = data as {
        success: boolean;
        error?: string;
        error_code?: string;
        order_id?: string;
        order_number?: string;
        barcode_type?: string;
        new_status?: string;
        scanned_by?: string;
        scanned_at?: string;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في مسح الباركود');
      }
      
      return result;
    },
    onSuccess: (data) => {
      toast({ title: `تم تأكيد ${getBarcodeTypeLabel(data.barcode_type || '')} للطلب ${data.order_number}` });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['branch-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

// Shape the driver board reads. The demo RPC returns richer rows than the
// generated get_driver_orders type (which omits customer/address/notes), so we
// widen it here rather than sprinkling casts across the screen.
export interface DriverOrder {
  id: string;
  order_number: string;
  status: string;
  branch_name?: string | null;
  delivery_date?: string | null;
  delivery_time?: string | null;
  customer_name?: string | null;
  customer_id?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  notes?: string | null;
  order_type?: string | null;
  handover_from_kitchen?: boolean | null;
  handover_to_branch?: boolean | null;
}

// Hook for driver orders
export function useDriverOrders() {
  return useQuery({
    queryKey: ['driver-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_driver_orders');

      if (error) throw error;
      return (data || []) as unknown as DriverOrder[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Driver manual "mark delivered" fallback — advances the order to completed when
// the customer-delivery barcode can't be scanned. (untyped rpc: not in gen types)
export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const client = supabase as unknown as {
        rpc: (fn: string, a?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      };
      const { error } = await client.rpc('driver_mark_delivered', { _order_id: orderId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم تأكيد التسليم', description: 'تم تحديث حالة الطلب إلى مكتمل.' });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook for admin status override
export function useAdminChangeOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, newStatus, reason }: { orderId: string; newStatus: string; reason: string }) => {
      const { data, error } = await supabase.rpc('admin_change_order_status', {
        _order_id: orderId,
        _new_status: newStatus as 'pending_approval' | 'awaiting_payment' | 'paid' | 'preparing' | 'ready_to_ship' | 'in_transit' | 'ready_for_pickup' | 'completed',
        _reason: reason
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'تم تغيير حالة الطلب بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

function getBarcodeTypeLabel(type: string): string {
  switch (type) {
    case 'kitchen_handover':
      return 'تسليم المطبخ';
    case 'branch_handover':
      return 'تسليم الفرع';
    case 'customer_delivery':
      return 'تسليم العميل';
    default:
      return 'التسليم';
  }
}
