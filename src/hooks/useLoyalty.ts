import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type {
  LoyaltyOccasion,
  LoyaltyReward,
  LoyaltySummary,
  OccasionType,
} from '@/lib/loyalty/program';

/**
 * «دائرة المناسبات» — واجهة العميلة.
 *
 * كل دوال الولاء أُضيفت بعد آخر توليد لـ `src/integrations/supabase/types.ts`،
 * فتُستدعى عبر عرض غير مُنمَّط كما في `useCustomerStore` — يُحذف هذا الالتفاف
 * بمجرّد إعادة توليد الأنواع بعد تطبيق الهجرات.
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

/* ── ملخّص البرنامج ─────────────────────────────────────────────────── */

export function useMyLoyalty() {
  return useQuery({
    queryKey: ['loyalty', 'summary'],
    queryFn: async () => {
      const rows = await callRpc<LoyaltySummary[] | LoyaltySummary>('get_my_loyalty');
      const row = Array.isArray(rows) ? rows[0] : rows;
      return (row ?? null) as LoyaltySummary | null;
    },
  });
}

/* ── سجل المناسبات ──────────────────────────────────────────────────── */

export function useMyOccasions() {
  return useQuery({
    queryKey: ['loyalty', 'occasions'],
    queryFn: async () => {
      const rows = await callRpc<LoyaltyOccasion[]>('get_my_occasions');
      return (rows || []) as LoyaltyOccasion[];
    },
  });
}

export interface OccasionInput {
  id?: string | null;
  label: string;
  occasion_type: OccasionType;
  occasion_day: number;
  occasion_month: number;
}

export function useSaveOccasion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OccasionInput) =>
      callRpc<string>('upsert_my_occasion', {
        _label: input.label.trim(),
        _occasion_type: input.occasion_type,
        _day: input.occasion_day,
        _month: input.occasion_month,
        _id: input.id ?? null,
      }),
    onSuccess: (_data, input) => {
      // حفظ مناسبة قد يفتح مكافأة التخصيص، فالملخّص والمكافآت يتغيّران معاً.
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'occasions'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
      toast({
        title: input.id ? 'تم تحديث المناسبة' : 'أضفنا المناسبة إلى سجلّك',
        description: 'سنذكّرك قبلها بوقت كافٍ للتجهيز.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'تعذّر حفظ المناسبة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteOccasion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => callRpc<void>('delete_my_occasion', { _id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'occasions'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'summary'] });
      toast({ title: 'تم حذف المناسبة' });
    },
    onError: (error: Error) => {
      toast({
        title: 'تعذّر الحذف',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/* ── المكافآت ───────────────────────────────────────────────────────── */

/**
 * `enabled` موجود من أجل السلة: هي مركّبة على كل صفحات المتجر، فبدون هذا
 * البوّابة تُنادى الدالة لكل زائرة غير مسجّلة على كل صفحة بلا فائدة.
 */
export function useMyRewards(enabled = true) {
  return useQuery({
    queryKey: ['loyalty', 'rewards'],
    queryFn: async () => {
      const rows = await callRpc<LoyaltyReward[]>('get_my_rewards');
      return (rows || []) as LoyaltyReward[];
    },
    enabled,
  });
}

export interface AppliedReward {
  code: string;
  rewardCode: string;
  name: string;
  kind: string;
  retailValue: number;
}

/**
 * التحقّق من مكافأة قبل إضافتها للسلة.
 *
 * تتبع نفس مُغلّف `validate_coupon` لتركب في السلة بلا إعادة كتابة، لكن **بلا
 * قيمة خصم**: المكافأة صنف مجاني يُضاف ولا يُنقص الإجمالي — وهو الفرق بين
 * تكلفة ثلث القيمة وتكلفتها كاملة، وبين معاملة ضريبية سليمة وأخرى مكلفة.
 */
export function useValidateReward() {
  return useMutation({
    mutationFn: async (input: { code: string; subtotal: number }): Promise<AppliedReward> => {
      const res = await callRpc<{
        valid?: boolean;
        code?: string;
        reward_code?: string;
        name?: string;
        kind?: string;
        retail_value?: number;
        message?: string;
      }>('validate_loyalty_reward', {
        _code: input.code.trim().toUpperCase(),
        _subtotal: input.subtotal,
      });

      if (!res?.valid || !res.code) {
        throw new Error(res?.message || 'المكافأة غير صالحة');
      }

      return {
        code: res.code,
        rewardCode: res.reward_code ?? '',
        name: res.name ?? 'مكافأة',
        kind: res.kind ?? 'product',
        retailValue: Number(res.retail_value ?? 0),
      };
    },
  });
}

/* ── الإحالة ────────────────────────────────────────────────────────── */

export interface ReferralSummary {
  code: string;
  invited: number;
  vested: number;
  rewarded: number;
}

export function useMyReferral() {
  return useQuery({
    queryKey: ['loyalty', 'referral'],
    queryFn: async () => {
      const rows = await callRpc<ReferralSummary[] | ReferralSummary>('get_my_referral_summary');
      const row = Array.isArray(rows) ? rows[0] : rows;
      return (row ?? null) as ReferralSummary | null;
    },
  });
}

export function useRegisterReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const res = await callRpc<{ valid?: boolean; message?: string }>('register_my_referral', {
        _code: code.trim().toUpperCase(),
      });
      if (!res?.valid) throw new Error(res?.message || 'رمز الدعوة غير صحيح');
      return res.message ?? 'تم تسجيل الدعوة';
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'referral'] });
      toast({ title: 'أهلاً بك في دائرة المناسبات', description: message });
    },
    onError: (error: Error) => {
      toast({
        title: 'تعذّر تسجيل الدعوة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/* ── الموافقات ──────────────────────────────────────────────────────── */

export function useSetConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { purpose: 'marketing' | 'profiling'; granted: boolean }) =>
      callRpc<void>('set_my_consent', { _purpose: input.purpose, _granted: input.granted }),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'summary'] });
      toast({
        title: input.granted ? 'تم تفعيل التذكيرات' : 'تم إيقاف الرسائل',
        description: input.granted
          ? 'سنذكّرك بمناسباتك قبل موعدها.'
          : 'لن تصلك رسائل تسويقية بعد الآن.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'تعذّر تحديث التفضيل',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/* ── شارة الموظّف ───────────────────────────────────────────────────── */

export interface LoyaltyBadge {
  tier: 'member' | 'circle';
  has_reward: boolean;
  reward_label: string | null;
  stamps_to_next: number;
}

/**
 * ما يراه الموظّف عن العميلة: **المكافأة لا الرصيد**.
 *
 * عرض رقم على الطاولة يفتح باب المساومة، وقراءته في الهاتف إفشاءُ بيانات
 * وثغرة استيلاء على الحساب. الشارة تقول «لديها مكافأة: علبة كب كيك» وكفى.
 */
export function useCustomerLoyaltyBadge(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ['loyalty', 'badge', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const rows = await callRpc<LoyaltyBadge[] | LoyaltyBadge>('get_customer_loyalty_badge', {
        _customer_id: customerId,
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      return (row ?? null) as LoyaltyBadge | null;
    },
    enabled: !!customerId,
  });
}
