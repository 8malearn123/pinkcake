import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Enums, Database } from '@/integrations/supabase/types';

type OrderStatus = Enums<'order_status'>;

// Type for the secure branch orders function return
type BranchOrderRow = Database['public']['Functions']['get_branch_orders_secure']['Returns'][number];

export interface BranchOrder extends Omit<BranchOrderRow, 'items'> {
  items: { product_name: string; quantity: number }[] | null;
}

export function useBranchOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['branch-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('get_branch_orders_secure', {
        _user_id: user.id,
      });

      if (error) throw error;
      return (data || []) as BranchOrder[];
    },
    enabled: !!user?.id,
  });
}

export function useUpdateBranchOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-orders'] });
      toast({
        title: 'تم تحديث الحالة',
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

export function useMyBranch() {
  return useQuery({
    queryKey: ['my-branch'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_branch');
      if (error) throw error;
      return data?.[0] || null;
    },
  });
}

export const BRANCH_STATUS_LABELS: Record<string, string> = {
  in_transit: 'في طريقه للفرع',
  ready_for_pickup: 'جاهز للاستلام',
  completed: 'تم التسليم',
};

export const BRANCH_STATUS_COLORS: Record<string, string> = {
  in_transit: 'bg-blue-100 text-blue-800',
  ready_for_pickup: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
};
