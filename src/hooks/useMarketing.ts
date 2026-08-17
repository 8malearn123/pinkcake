import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type {
  Announcement,
  AnnouncementDraft,
  Coupon,
  CouponDraft,
  SeasonOverride,
  StoreOffers,
} from '@/lib/marketing/types';

/**
 * قسم «التسويق» — طبقة البيانات.
 *
 * الدوال هنا غير موجودة في `src/integrations/supabase/types.ts` (لا هجرات في
 * هذه المرحلة — قرار المنتج)، فتُنادى عبر عرض غير مُنمَّط كما في
 * `useLoyaltyAdmin.ts`. في الوضع التجريبي — وهو الافتراضي وما تعمل به كل
 * المعاينات — تردّ عليها `src/lib/demo/marketing.ts` بحالة حقيقية.
 *
 * على خادم حقيقي بلا هذه الدوال، `callRpc` يعيد null/[] بدل أن يرمي، فتظهر
 * اللوحة بحالة «غير مُهيّأ» ولا تنهار الصفحة. الشرط المقابل في المتجر أهم:
 * `useStorefrontPromos` يسقط إلى النصوص المثبّتة اليوم، فلا يفقد الزائر شيئاً.
 */

type UntypedRpc = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

const rpc = () => supabase as unknown as UntypedRpc;

/** صحيح حين يكون الفشل «الدالة غير موجودة» لا خطأً حقيقياً. */
export function isMissingFunction(error: unknown): boolean {
  if (!error) return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === '42883' ||
    e.code === 'PGRST202' ||
    /could not find the function|does not exist|schema cache/i.test(e.message ?? '')
  );
}

async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await rpc().rpc(fn, args);
  if (error) {
    if (isMissingFunction(error)) return null;
    throw error as Error;
  }
  return data as T;
}

/** ردّ الكتابة الموحّد. مسطّح لأن `strict: false` لا يضيّق اتحاداً على منطقيّ. */
interface WriteResult {
  success?: boolean;
  message?: string;
  id?: string;
}

/**
 * الطبقة التجريبية تُبلغ عن رفض القاعدة بـ`{ success: false, message }` لا
 * برمي خطأ — وهو ما تفعله دوال `SECURITY DEFINER` الحقيقية أيضاً. بلا هذا
 * التحويل يبتلع `onSuccess` الرفضَ ويُظهر «تم الحفظ» على شيء لم يُحفظ.
 */
function assertWrite(data: unknown, fallback: string): WriteResult {
  const row = (Array.isArray(data) ? data[0] : data) as WriteResult | null;
  if (row && row.success === false) throw new Error(row.message || fallback);
  return row ?? {};
}

const first = <T,>(rows: T[] | T | null): T | null =>
  rows == null ? null : Array.isArray(rows) ? (rows[0] ?? null) : rows;

const KEY = {
  coupons: ['marketing', 'coupons'] as const,
  announcements: ['marketing', 'announcements'] as const,
  offers: ['marketing', 'offers'] as const,
  overview: ['marketing', 'overview'] as const,
  performance: ['marketing', 'coupon-performance'] as const,
  seasons: ['marketing', 'seasons'] as const,
  referrals: ['marketing', 'referrals'] as const,
  promos: ['storefront-promos'] as const,
};

/** كل ما يتأثّر بتغيير كوبون. الأداء والنظرة العامة مشتقّان منه. */
const COUPON_DEPENDENTS = [KEY.coupons, KEY.overview, KEY.performance, KEY.promos];

function useWrite<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  options: { invalidate: readonly (readonly string[])[]; success: string; failure: string },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of options.invalidate) queryClient.invalidateQueries({ queryKey: key });
      toast({ title: options.success });
    },
    onError: (error: Error) =>
      toast({ title: options.failure, description: error.message, variant: 'destructive' }),
  });
}

/* ── الكوبونات ─────────────────────────────────────────────────────────── */

export function useCoupons() {
  return useQuery({
    queryKey: KEY.coupons,
    queryFn: async () => (await callRpc<Coupon[]>('get_coupons')) ?? [],
  });
}

export function useCreateCoupon() {
  return useWrite<CouponDraft>(
    async (draft) => assertWrite(await callRpc('create_coupon', { _draft: draft }), 'تعذّر إنشاء الكوبون'),
    { invalidate: COUPON_DEPENDENTS, success: 'تم إنشاء الكوبون', failure: 'تعذّر إنشاء الكوبون' },
  );
}

export function useUpdateCoupon() {
  return useWrite<{ id: string; draft: CouponDraft }>(
    async ({ id, draft }) =>
      assertWrite(await callRpc('update_coupon', { _id: id, _draft: draft }), 'تعذّر حفظ الكوبون'),
    { invalidate: COUPON_DEPENDENTS, success: 'تم حفظ التعديلات', failure: 'تعذّر حفظ الكوبون' },
  );
}

export function useDeleteCoupon() {
  return useWrite<string>(
    async (id) => assertWrite(await callRpc('delete_coupon', { _id: id }), 'تعذّر حذف الكوبون'),
    { invalidate: COUPON_DEPENDENTS, success: 'تم حذف الكوبون', failure: 'تعذّر حذف الكوبون' },
  );
}

export function useSetCouponActive() {
  return useWrite<{ id: string; isActive: boolean }>(
    async ({ id, isActive }) =>
      assertWrite(
        await callRpc('set_coupon_active', { _id: id, _is_active: isActive }),
        'تعذّر تغيير حالة الكوبون',
      ),
    { invalidate: COUPON_DEPENDENTS, success: 'تم تحديث الحالة', failure: 'تعذّر تغيير حالة الكوبون' },
  );
}

/* ── الإعلانات ─────────────────────────────────────────────────────────── */

const ANNOUNCEMENT_DEPENDENTS = [KEY.announcements, KEY.overview, KEY.promos];

export function useAnnouncements() {
  return useQuery({
    queryKey: KEY.announcements,
    queryFn: async () => (await callRpc<Announcement[]>('get_announcements')) ?? [],
  });
}

export function useCreateAnnouncement() {
  return useWrite<AnnouncementDraft>(
    async (draft) =>
      assertWrite(await callRpc('create_announcement', { _draft: draft }), 'تعذّرت الإضافة'),
    { invalidate: ANNOUNCEMENT_DEPENDENTS, success: 'تمت الإضافة', failure: 'تعذّرت الإضافة' },
  );
}

export function useUpdateAnnouncement() {
  return useWrite<{ id: string; draft: AnnouncementDraft }>(
    async ({ id, draft }) =>
      assertWrite(await callRpc('update_announcement', { _id: id, _draft: draft }), 'تعذّر الحفظ'),
    { invalidate: ANNOUNCEMENT_DEPENDENTS, success: 'تم الحفظ', failure: 'تعذّر الحفظ' },
  );
}

export function useDeleteAnnouncement() {
  return useWrite<string>(
    async (id) => assertWrite(await callRpc('delete_announcement', { _id: id }), 'تعذّر الحذف'),
    { invalidate: ANNOUNCEMENT_DEPENDENTS, success: 'تم الحذف', failure: 'تعذّر الحذف' },
  );
}

export function useSetAnnouncementActive() {
  return useWrite<{ id: string; isActive: boolean }>(
    async ({ id, isActive }) =>
      assertWrite(
        await callRpc('set_announcement_active', { _id: id, _is_active: isActive }),
        'تعذّر تغيير الحالة',
      ),
    { invalidate: ANNOUNCEMENT_DEPENDENTS, success: 'تم تحديث الحالة', failure: 'تعذّر تغيير الحالة' },
  );
}

/* ── العروض الدائمة ────────────────────────────────────────────────────── */

export function useStoreOffers() {
  return useQuery({
    queryKey: KEY.offers,
    queryFn: async () => first(await callRpc<StoreOffers[]>('get_store_offers')),
  });
}

export function useUpdateStoreOffers() {
  return useWrite<Partial<StoreOffers>>(
    async (patch) =>
      assertWrite(await callRpc('update_store_offers', { _patch: patch }), 'تعذّر حفظ العروض'),
    {
      invalidate: [KEY.offers, KEY.promos, KEY.overview],
      success: 'تم حفظ العروض',
      failure: 'تعذّر حفظ العروض',
    },
  );
}

/* ── النظرة العامة ─────────────────────────────────────────────────────── */

export interface MarketingOverview {
  active_coupons: number;
  total_coupons: number;
  redemptions: number;
  discount_given: number;
  attributed_revenue: number;
  return_on_discount: number;
  campaigns_sent: number;
  campaign_recipients: number;
  delivery_rate: number;
  live_announcements: number;
}

export function useMarketingOverview() {
  return useQuery({
    queryKey: KEY.overview,
    queryFn: async () => first(await callRpc<MarketingOverview[]>('get_marketing_overview')),
  });
}

export interface CouponPerformanceRow {
  code: string;
  redemptions: number;
  discount_given: number;
  revenue: number;
}

export function useCouponPerformance() {
  return useQuery({
    queryKey: KEY.performance,
    queryFn: async () => (await callRpc<CouponPerformanceRow[]>('get_coupon_performance')) ?? [],
  });
}

/* ── الإحالات (قراءة فقط) ──────────────────────────────────────────────── */

export interface AdminReferralRow {
  id: string;
  referrer_name: string;
  referrer_code: string;
  referee_phone: string;
  status: 'pending' | 'vested' | 'rewarded' | 'rejected' | 'review';
  created_at: string;
  vested_at: string | null;
}

export function useReferralsForAdmin() {
  return useQuery({
    queryKey: KEY.referrals,
    queryFn: async () => (await callRpc<AdminReferralRow[]>('get_referrals_for_admin')) ?? [],
  });
}

/* ── تقويم الحملات ─────────────────────────────────────────────────────── */

export function useSeasonOverrides() {
  return useQuery({
    queryKey: KEY.seasons,
    queryFn: async () => (await callRpc<SeasonOverride[]>('get_season_overrides')) ?? [],
  });
}

export function useSetSeasonOverride() {
  return useWrite<{ id: string; year: number; month: number; day: number }>(
    async ({ id, year, month, day }) =>
      assertWrite(
        await callRpc('set_season_override', { _id: id, _year: year, _month: month, _day: day }),
        'تعذّر حفظ الموسم',
      ),
    { invalidate: [KEY.seasons], success: 'تم ضبط الموسم', failure: 'تعذّر حفظ الموسم' },
  );
}
