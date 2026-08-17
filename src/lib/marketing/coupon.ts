/**
 * محرّك قواعد الكوبون — منطق نقيّ، بلا React وبلا شبكة وبلا تخزين.
 *
 * سببان لعزله هنا: الطبقة التجريبية والخادم يجب أن يطبّقا **القاعدة نفسها**
 * (كوبون يُقبل في العرض ويُرفض عند الدفع أسوأ من كوبون لا يعمل)، والقواعد
 * حالات حديّة أكثر منها شيفرة — فهي تُختبر جدولياً في `__tests__/coupon.test.ts`.
 *
 * ترتيب الفحوص مقصود: من الأعمّ إلى الأخصّ، فالرسالة التي تصل العميلة تكون
 * أوّل سبب حقيقي للرفض لا آخره.
 */

import type { Coupon, CouponContext, CouponOutcome, CouponDraft } from './types';

/** الحد الأقصى لنسبة الخصم — يمنع أن يُهدي خطأٌ مطبعيّ المتجرَ كلّه. */
export const MAX_PERCENT = 90;

/**
 * الرمز يُقارَن دائماً بعد التطبيع: قصّ، أحرف كبيرة، وتحويل الأرقام
 * العربية-الهندية إلى غربية — العميلة تنسخ الرمز من رسالة قد تحمل أيّهما.
 */
export function normalizeCode(input: unknown): string {
  const raw = String(input ?? '').trim().toUpperCase();
  return raw.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** هل الرمز صالح شكلاً: حروف لاتينية وأرقام، ٣–٢٤ خانة. */
export function isValidCodeShape(code: string): boolean {
  return /^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code);
}

const REJECT = (message: string): CouponOutcome => ({
  ok: false,
  discount: 0,
  freeDelivery: false,
  message,
});

/** بداية اليوم — المقارنة بالتاريخ لا باللحظة، وإلا انتهى كوبون في صباح يومه الأخير. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseDay(iso: string | null): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getTime();
}

/** هل يشمل نطاق الكوبون شيئاً في السلة. */
export function scopeMatches(coupon: Coupon, ctx: CouponContext): boolean {
  if (coupon.scope === 'all') return true;
  const values = coupon.scopeValues ?? [];
  if (values.length === 0) return true; // نطاق بلا قيم = بلا تضييق
  const basket = coupon.scope === 'category' ? ctx.categories : ctx.productIds;
  return values.some((v) => basket.includes(v));
}

/**
 * القيمة المحسومة قبل أي حدّ. مفصولة عن `evaluateCoupon` كي تستطيع لوحة
 * الإدارة عرض «كم يساوي هذا الكوبون على سلة بـس ريال» بلا تشغيل الفحوص.
 */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.kind === 'free_delivery') return 0;
  const raw =
    coupon.kind === 'percent' ? (subtotal * clampPercent(coupon.value)) / 100 : Number(coupon.value ?? 0);
  const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
  // لا يتجاوز الخصم السلة أبداً: طلب بمجموع سالب ليس حالة يعرفها أي شيء بعده.
  return Math.max(0, Math.min(Math.round(capped), Math.round(subtotal)));
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(MAX_PERCENT, Number(value ?? 0)));
}

/**
 * الحكم الكامل. تُستدعى من الطبقة التجريبية عند `validate_coupon`، ومن لوحة
 * الإدارة للمعاينة.
 */
export function evaluateCoupon(
  coupon: Coupon | null | undefined,
  ctx: CouponContext,
): CouponOutcome {
  if (!coupon) return REJECT('رمز غير صالح أو منتهي الصلاحية');
  if (!coupon.isActive) return REJECT('هذا الرمز موقوف حالياً');

  const today = startOfDay(ctx.now);
  const from = parseDay(coupon.startsAt);
  const until = parseDay(coupon.endsAt);
  if (from != null && today < from) return REJECT('هذا العرض لم يبدأ بعد');
  if (until != null && today > until) return REJECT('انتهت صلاحية هذا الرمز');

  if (coupon.usageLimit != null && coupon.redemptions >= coupon.usageLimit) {
    return REJECT('اكتمل عدد مرّات استخدام هذا العرض');
  }
  if (coupon.perCustomerLimit != null && ctx.customerRedemptions >= coupon.perCustomerLimit) {
    return REJECT('استخدمتِ هذا الرمز من قبل');
  }
  if (coupon.firstOrderOnly && !ctx.isFirstOrder) {
    return REJECT('هذا العرض لأوّل طلب فقط');
  }
  if (coupon.minOrder > 0 && ctx.subtotal < coupon.minOrder) {
    return REJECT(`هذا الرمز يبدأ من ${coupon.minOrder} ريال`);
  }
  if (!scopeMatches(coupon, ctx)) {
    return REJECT('هذا الرمز لا ينطبق على ما في سلّتك');
  }

  if (coupon.kind === 'free_delivery') {
    return { ok: true, discount: 0, freeDelivery: true, message: 'تم تطبيق التوصيل المجاني' };
  }

  const discount = couponDiscount(coupon, ctx.subtotal);
  if (discount <= 0) return REJECT('لا ينتج عن هذا الرمز خصم على سلّتك');

  return { ok: true, discount, freeDelivery: false, message: 'تم تطبيق الكوبون' };
}

/** «خصم ١٥٪ حتى ٣٠ ريال» — سطر واحد يصف الكوبون في الجدول وفي البانر. */
export function couponSummary(coupon: Coupon): string {
  if (coupon.kind === 'free_delivery') return 'توصيل مجاني';
  if (coupon.kind === 'fixed') return `خصم ${coupon.value} ريال`;
  const cap = coupon.maxDiscount != null ? ` حتى ${coupon.maxDiscount} ريال` : '';
  return `خصم ${coupon.value}٪${cap}`;
}

/** الحالة المعروضة في الجدول — أدقّ من مفتاح `isActive` وحده. */
export type CouponState = 'active' | 'paused' | 'scheduled' | 'expired' | 'exhausted';

export const COUPON_STATE_LABELS: Record<CouponState, string> = {
  active: 'فعّال',
  paused: 'موقوف',
  scheduled: 'مجدول',
  expired: 'منتهٍ',
  exhausted: 'اكتمل',
};

export function couponState(coupon: Coupon, now: Date = new Date()): CouponState {
  if (!coupon.isActive) return 'paused';
  const today = startOfDay(now);
  const until = parseDay(coupon.endsAt);
  if (until != null && today > until) return 'expired';
  if (coupon.usageLimit != null && coupon.redemptions >= coupon.usageLimit) return 'exhausted';
  const from = parseDay(coupon.startsAt);
  if (from != null && today < from) return 'scheduled';
  return 'active';
}

/**
 * فحص ما يُدخله المدير قبل الحفظ — يُشغَّل في الطبقة التجريبية أيضاً، فلا
 * يمرّ كوبون فاسد لأن أحداً نادى الدالة مباشرة.
 * يعيد رسالة الخطأ الأولى، أو null إن كان سليماً.
 */
export function validateDraft(draft: CouponDraft, existingCodes: string[] = []): string | null {
  const code = normalizeCode(draft.code);
  if (!isValidCodeShape(code)) return 'الرمز يجب أن يكون ٣–٢٤ خانة، حروفاً لاتينية وأرقاماً';
  if (existingCodes.map(normalizeCode).includes(code)) return 'هذا الرمز مستخدم بالفعل';

  if (draft.kind === 'percent') {
    if (draft.value < 1 || draft.value > MAX_PERCENT) return `النسبة يجب أن تكون بين ١ و${MAX_PERCENT}`;
  }
  if (draft.kind === 'fixed' && draft.value < 1) return 'قيمة الخصم يجب أن تكون ريالاً واحداً على الأقل';
  if (draft.minOrder < 0) return 'أدنى قيمة طلب لا تكون سالبة';
  if (draft.maxDiscount != null && draft.maxDiscount < 1) return 'سقف الخصم يجب أن يكون ريالاً واحداً على الأقل';
  if (draft.usageLimit != null && draft.usageLimit < 1) return 'سقف الاستخدام يجب أن يكون ١ على الأقل';
  if (draft.perCustomerLimit != null && draft.perCustomerLimit < 1) {
    return 'سقف الاستخدام لكل عميلة يجب أن يكون ١ على الأقل';
  }

  const from = parseDay(draft.startsAt);
  const until = parseDay(draft.endsAt);
  if (from != null && until != null && until < from) return 'تاريخ الانتهاء قبل تاريخ البداية';

  if (draft.scope !== 'all' && (draft.scopeValues ?? []).length === 0) {
    return draft.scope === 'category' ? 'اختر تصنيفاً واحداً على الأقل' : 'اختر منتجاً واحداً على الأقل';
  }
  return null;
}
