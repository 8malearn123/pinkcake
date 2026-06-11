import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Hook for accessing phone numbers with full audit logging.
 * All admin access to phone numbers is logged for security compliance.
 */
export function useGetProfilePhone() {
  return useMutation({
    mutationFn: async ({ profileId, justification }: { profileId: string; justification?: string }) => {
      const { data, error } = await supabase.rpc('get_profile_phone_audited', {
        _profile_id: profileId,
        _justification: justification || 'Admin access via Users page',
      });

      if (error) throw error;
      return data as string | null;
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في الوصول إلى رقم الهاتف: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useGetCustomerPhone() {
  return useMutation({
    mutationFn: async ({ 
      customerId, 
      orderId, 
      justification 
    }: { 
      customerId: string; 
      orderId?: string; 
      justification?: string;
    }) => {
      const { data, error } = await supabase.rpc('get_customer_phone_audited', {
        _customer_id: customerId,
        _order_id: orderId || null,
        _justification: justification || 'Access via Order Details',
      });

      if (error) throw error;
      return data as string | null;
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في الوصول إلى رقم الهاتف: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAdminAccessLogs() {
  return useMutation({
    mutationFn: async (days: number = 30) => {
      const { data, error } = await supabase.rpc('get_admin_access_logs', {
        _days: days,
      });

      if (error) throw error;
      return data;
    },
  });
}
