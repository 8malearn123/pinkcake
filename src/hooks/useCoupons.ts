import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Coupon {
  id: string;
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  active: boolean;
  description?: string | null;
}

// The coupon RPCs aren't in the generated Supabase types yet, so call them
// through an untyped view (same approach as useCreateCustomerOrder/useCapturePayment).
function untypedRpc() {
  return (supabase as unknown as {
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  }).rpc;
}

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await untypedRpc()('get_coupons');
      if (error) throw error;
      // Copy each row: the demo mutates COUPONS in place, so returning the live
      // reference would make React Query miss changes on refetch.
      return ((data ?? []) as Coupon[]).map((c) => ({ ...c }));
    },
  });
}

export function useSaveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Partial<Coupon> & { code: string; kind: 'percent' | 'fixed'; value: number }) => {
      const { data, error } = await untypedRpc()('save_coupon', {
        _id: coupon.id ?? null,
        _code: coupon.code,
        _kind: coupon.kind,
        _value: coupon.value,
        _active: coupon.active ?? true,
        _description: coupon.description ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: 'تم الحفظ', description: 'تم حفظ الكوبون بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: 'تعذّر حفظ الكوبون: ' + (error as Error).message, variant: 'destructive' });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await untypedRpc()('delete_coupon', { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: 'تم الحذف', description: 'تم حذف الكوبون' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: 'تعذّر حذف الكوبون: ' + (error as Error).message, variant: 'destructive' });
    },
  });
}
