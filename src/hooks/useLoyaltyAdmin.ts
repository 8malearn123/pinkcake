import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * لوحة المدير لبرنامج «دائرة المناسبات».
 *
 * ما ليس هنا مقصود بقدر ما هو موجود: **لا دالة لمنح أختام يدوياً.** دوال إنشاء
 * الطلب في هذا المستودع تعمل بـ SECURITY DEFINER، فزرّ منح يدوي يعني إمكان
 * توليد مكافآت بلا أن يمرّ ريال بالصندوق. الاستحقاق مشتقّ من طلب مكتمل، ونقطة.
 */
type UntypedRpc = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

const rpc = () => supabase as unknown as UntypedRpc;

async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc().rpc(fn, args);
  if (error) throw error as Error;
  return data as T;
}

export interface LoyaltyOverview {
  members: number;
  circle_members: number;
  occasions_stored: number;
  members_with_occasions: number;
  marketing_consent_rate: number | null;
  outstanding_stamps: number;
  rewards_available: number;
  rewards_captured_90d: number;
  reward_cost_90d: number;
  member_revenue_90d: number;
  cost_pct_of_revenue: number | null;
  reminders_sent_90d: number;
  referrals_vested_90d: number;
}

export function useLoyaltyOverview() {
  return useQuery({
    queryKey: ['loyalty-admin', 'overview'],
    queryFn: async () => {
      const rows = await callRpc<LoyaltyOverview[] | LoyaltyOverview>('get_loyalty_overview');
      const row = Array.isArray(rows) ? rows[0] : rows;
      return (row ?? null) as LoyaltyOverview | null;
    },
  });
}

export interface LoyaltyRisk {
  metric: string;
  label: string;
  value: number;
  detail: string;
}

export function useLoyaltyRiskReport() {
  return useQuery({
    queryKey: ['loyalty-admin', 'risk'],
    queryFn: async () => {
      const rows = await callRpc<LoyaltyRisk[]>('get_loyalty_risk_report');
      return (rows || []) as LoyaltyRisk[];
    },
  });
}

export interface LoyaltySettings {
  enabled: boolean;
  program_name: string;
  stamps_required: number;
  endowed_stamps: number;
  stamp_min_order: number;
  redemption_min_order: number;
  redemption_max_pct: number;
  inactivity_expiry_months: number;
  registry_unlock_occasions: number;
  tier_threshold_amount: number;
  tier_window_months: number;
  referral_cap_per_year: number;
  referral_vesting_hours: number;
}

export function useLoyaltySettings() {
  return useQuery({
    queryKey: ['loyalty-admin', 'settings'],
    queryFn: async () => {
      const rows = await callRpc<LoyaltySettings[] | LoyaltySettings>('get_loyalty_settings');
      const row = Array.isArray(rows) ? rows[0] : rows;
      return (row ?? null) as LoyaltySettings | null;
    },
  });
}

export function useUpdateLoyaltySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<LoyaltySettings>) => {
      await callRpc<void>('update_loyalty_settings', { _patch: patch });
      return patch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-admin', 'overview'] });
      toast({ title: 'تم حفظ الإعدادات' });
    },
    onError: (error: Error) => {
      toast({
        title: 'تعذّر حفظ الإعدادات',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export interface BusinessAccount {
  id: string;
  customer_id: string;
  company_name: string;
  vat_number: string | null;
  contact_name: string;
  credit_rate: number;
  credit_balance: number;
  orders_90d: number;
  spend_90d: number;
  is_active: boolean;
}

export function useBusinessAccounts() {
  return useQuery({
    queryKey: ['loyalty-admin', 'business'],
    queryFn: async () => {
      const rows = await callRpc<BusinessAccount[]>('get_business_accounts');
      return (rows || []) as BusinessAccount[];
    },
  });
}
