import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OrderNote {
  id: string;
  note_content: string;
  created_at: string;
  user_name: string;
  user_role: string;
}

interface OrderLogWithUser {
  id: string;
  action: string;
  description: string;
  created_at: string;
  user_name: string;
  user_role: string;
}

export function useOrderNotes(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order-notes', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase.rpc('get_order_notes', {
        _order_id: orderId,
      });
      
      if (error) throw error;
      return (data || []) as OrderNote[];
    },
    enabled: !!orderId,
  });
}

export function useOrderLogsWithUser(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order-logs-with-user', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase.rpc('get_order_logs_with_user', {
        _order_id: orderId,
      });
      
      if (error) throw error;
      return (data || []) as OrderLogWithUser[];
    },
    enabled: !!orderId,
  });
}

export function useAddOrderNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, noteContent }: { orderId: string; noteContent: string }) => {
      const { data, error } = await supabase.rpc('add_order_note', {
        _order_id: orderId,
        _note_content: noteContent,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-logs-with-user', variables.orderId] });
      toast({
        title: 'تمت الإضافة',
        description: 'تمت إضافة الملاحظة بنجاح',
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

export function useTransferOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orderId, 
      toBranchId, 
      transferType = 'kitchen_to_branch' 
    }: { 
      orderId: string; 
      toBranchId: string; 
      transferType?: string;
    }) => {
      const { data, error } = await supabase.rpc('transfer_order', {
        _order_id: orderId,
        _to_branch_id: toBranchId,
        _transfer_type: transferType,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['branch-orders'] });
      toast({
        title: 'تم النقل',
        description: 'تم نقل الطلب بنجاح',
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
