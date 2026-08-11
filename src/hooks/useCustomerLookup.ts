import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string | null;
}

/**
 * "هل العميل مسجّل؟" — staff lookup by mobile number.
 *
 * Wraps the audited `search_customer_by_phone` RPC (admin / call_center only).
 * Resolves to the matching customer, or `null` when the number is unknown — the
 * caller then offers "add a new customer" instead.
 * A miss is a normal result, not an error, so only real failures toast.
 */
export function useCustomerLookup() {
  return useMutation<CustomerRecord | null, Error, string>({
    mutationFn: async (phone: string) => {
      const { data, error } = await supabase.rpc('search_customer_by_phone', {
        _phone: phone.trim(),
      });

      if (error) throw error;
      const rows = (data || []) as CustomerRecord[];
      return rows[0] ?? null;
    },
    onError: (error) => {
      console.error('Customer lookup error:', error);
      toast({
        title: 'تعذّر الاستعلام',
        description: 'فشل البحث عن العميل: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}
