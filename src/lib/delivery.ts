/**
 * Delivery + free-delivery rules — the single source of truth shared by the
 * on-page free-delivery meter, the cart drawer nudge, and checkout, so the
 * three can never disagree.
 *
 * العتبة والرسوم صارتا محرَّرتين من «التسويق» ← «العروض الدائمة»، فكل دالة هنا
 * تقبل العتبة كوسيط. الدوال تبقى **نقيّة**: القيمة الحيّة تأتي من
 * `useStorefrontPromos()` في المكوّن، ولا يقرأ هذا الملف حالةً بنفسه — وإلا
 * صار حساب السلة يعتمد على ترتيب التحميل.
 *
 * الثابتان أدناه هما البذرة والاحتياطي: بلا خادم يبقى المتجر على ٢٠٠/٢٥ تماماً
 * كما كان.
 */
export const FREE_DELIVERY_THRESHOLD = 200;
export const DELIVERY_FEE = 25;

/** How much more (in ﷼) the basket needs to unlock free delivery (0 once reached). */
export const amountToFreeDelivery = (total: number, threshold = FREE_DELIVERY_THRESHOLD) =>
  Math.max(0, threshold - total);

/** True once the basket qualifies for free delivery. */
export const hasFreeDelivery = (total: number, threshold = FREE_DELIVERY_THRESHOLD) =>
  total >= threshold;

/** Progress toward free delivery, 0–100. */
export const freeDeliveryPct = (total: number, threshold = FREE_DELIVERY_THRESHOLD) =>
  threshold <= 0 ? 100 : Math.min(100, Math.round((total / threshold) * 100));
