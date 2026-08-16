/**
 * «دائرة المناسبات» — المنطق النقي لبرنامج الولاء.
 *
 * لا React ولا شبكة هنا: كل ما في هذا الملف دوال خالصة قابلة للاختبار، والواجهة
 * لا تحسب شيئاً بنفسها. القواعد الملزِمة (سقف الكلفة، حد الطلب، الانتهاء
 * بالخمول) تعيش في القاعدة؛ ما هنا هو تمثيلها للعرض فقط.
 */

export type OccasionType =
  | 'birthday'
  | 'anniversary'
  | 'graduation'
  | 'newborn'
  | 'work'
  | 'other';

export type LoyaltyTier = 'member' | 'circle';

export interface LoyaltyOccasion {
  id: string;
  label: string;
  occasion_type: OccasionType;
  occasion_day: number;
  occasion_month: number;
  days_until: number;
}

export interface LoyaltySummary {
  enabled: boolean;
  program_name: string;
  tier: LoyaltyTier;
  stamp_balance: number;
  stamps_required: number;
  stamps_to_next: number;
  lifetime_stamps: number;
  window_spend: number;
  tier_threshold: number;
  occasions_count: number;
  registry_unlock_occasions: number;
  registry_unlocked: boolean;
  available_rewards: number;
  referral_code: string | null;
  consent_marketing: boolean;
}

export interface LoyaltyReward {
  redemption_code: string | null;
  reward_code: string;
  name: string;
  description: string | null;
  kind: 'personalisation' | 'upgrade' | 'product' | 'access';
  retail_value: number;
  min_order_amount: number;
  status: string;
  origin: string;
  available_from: string;
  expires_at: string | null;
  is_usable: boolean;
}

/** خيارات نوع المناسبة. «عيد ميلاد» خيار من عدّة، لا حقل إلزامي. */
export const OCCASION_TYPES: { value: OccasionType; label: string; emoji: string }[] = [
  { value: 'birthday', label: 'عيد ميلاد', emoji: '🎂' },
  { value: 'anniversary', label: 'ذكرى زواج', emoji: '💍' },
  { value: 'graduation', label: 'تخرّج', emoji: '🎓' },
  { value: 'newborn', label: 'مولود', emoji: '🍼' },
  { value: 'work', label: 'مناسبة عمل', emoji: '💼' },
  { value: 'other', label: 'مناسبة أخرى', emoji: '✨' },
];

export const OCCASION_LABELS: Record<OccasionType, string> = OCCASION_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {} as Record<OccasionType, string>,
);

export const HIJRI_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/**
 * توحيد رقم الجوال السعودي إلى E.164 — **مرآة `normalize_msisdn` في القاعدة**.
 *
 * القاعدة هي مصدر الحقيقة؛ هذه النسخة للتحقّق الفوري في النموذج قبل الإرسال.
 * أي تعديل هنا يستلزم تعديل الدالة في `20260816090000_*.sql` والعكس، ويوجد
 * اختبار يغطّي الحالات نفسها في الطرفين.
 *
 * تقبل الأرقام العربية-الهندية (٠-٩) والفارسية (۰-۹) لأن اللصق من واتساب هو
 * الطريق الأشيع لدخول رقم مكرّر إلى قاعدة العملاء.
 */
export function normalizeMsisdn(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;

  const folded = String(raw).replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    // ٠ = U+0660 · ۰ = U+06F0
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });

  const digits = folded.replace(/[^0-9]/g, '');
  if (digits.length < 9) return null;

  const nsn = digits.slice(-9);
  if (!/^5\d{8}$/.test(nsn)) return null;

  return `+966${nsn}`;
}

/**
 * تقدّم كرت الأختام كنِسَب جاهزة للعرض.
 *
 * تُعيد `filled` مقصوصاً على `required` حتى لا يتجاوز الشريط مداه عندما يسبق
 * الرصيد إصدارَ المكافأة للحظة.
 */
export function stampProgress(balance: number, required: number): {
  filled: number;
  remaining: number;
  slots: boolean[];
  pct: number;
  complete: boolean;
} {
  const safeRequired = Math.max(required, 1);
  const filled = Math.max(0, Math.min(balance, safeRequired));
  return {
    filled,
    remaining: Math.max(safeRequired - filled, 0),
    slots: Array.from({ length: safeRequired }, (_, i) => i < filled),
    pct: Math.round((filled / safeRequired) * 100),
    complete: balance >= safeRequired,
  };
}

/** «باقي ٣ مناسبات» / «بقيت مناسبة واحدة» — صياغة عربية سليمة للعدد. */
export function pluralAr(count: number, one: string, two: string, few: string, many: string): string {
  if (count === 1) return one;
  if (count === 2) return two;
  if (count >= 3 && count <= 10) return few;
  return many;
}

/** نصّ العدّ التنازلي للمناسبة. */
export function daysUntilLabel(days: number): string {
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'غداً';
  if (days === 2) return 'بعد يومين';
  if (days <= 10) return `بعد ${days} أيام`;
  if (days <= 30) return `بعد ${days} يوماً`;
  const months = Math.round(days / 30);
  return months === 1 ? 'بعد شهر تقريباً' : `بعد ${months} أشهر تقريباً`;
}

/** أقرب مناسبة قادمة، أو null إن كان السجل فارغاً. */
export function nextOccasion(occasions: LoyaltyOccasion[]): LoyaltyOccasion | null {
  if (!occasions.length) return null;
  return occasions.reduce((best, o) => (o.days_until < best.days_until ? o : best));
}

/** كم مناسبة ينقص السجل حتى تُفتح مكافأة التخصيص. */
export function occasionsToUnlock(summary: LoyaltySummary | null | undefined): number {
  if (!summary || summary.registry_unlocked) return 0;
  return Math.max(summary.registry_unlock_occasions - summary.occasions_count, 0);
}

/** عدد أيام الشهر — يمنع اختيار ٣١ فبراير في محدّد التاريخ. */
export function daysInMonth(month: number): number {
  // فبراير يُعرض بـ ٢٩ يوماً: السجل بلا سنة، و٢٩ فبراير يُعامَل في القاعدة
  // كآخر يوم في الشهر عند السنوات غير الكبيسة (دالة safe_make_date).
  const lengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[Math.max(0, Math.min(month - 1, 11))];
}
