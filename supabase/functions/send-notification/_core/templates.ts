// AUTO-GENERATED — do not edit by hand.
// Source: src/lib/notifications/templates.ts · regenerate: npm run notify:sync

import type { OrderContext } from './types.ts';

/**
 * Customer-facing message templates, keyed by `order_status`.
 *
 * Only the milestones a customer actually cares about are listed here — internal
 * hand-offs (ready_to_ship, in_transit, sent_to_chef, …) have no entry and are
 * skipped. `renderMessage` returns null for any status not in this map.
 */
const TEMPLATES: Record<string, (ctx: RenderCtx) => string> = {
  awaiting_payment: (c) =>
    `مرحباً ${c.name} 🌸\nطلبك رقم ${c.orderNumber} من ${c.storeName} بانتظار الدفع لإتمامه.${c.track}`,

  paid: (c) =>
    `تم استلام دفعتك بنجاح ✅\nطلبك ${c.orderNumber} قيد التجهيز الآن، وسنخبرك فور أن يصبح جاهزاً.${c.track}`,

  preparing: (c) =>
    `يجهّز فريق ${c.storeName} طلبك ${c.orderNumber} الآن 👩‍🍳${c.track}`,

  ready_for_pickup: (c) =>
    `طلبك ${c.orderNumber} جاهز للاستلام من ${c.branch} 🎉${c.track}`,

  completed: (c) =>
    `تم تسليم طلبك ${c.orderNumber} 💝\nشكراً لاختيارك ${c.storeName}، نتمنّى لك يوماً سعيداً!`,

  pricing_sent_to_customer: (c) =>
    `تم تسعير طلبك المخصّص ${c.orderNumber} 📝\nيرجى مراجعة السعر والرد لتأكيد الطلب.${c.track}`,

  custom_chef_approved: (c) =>
    `أخبار سعيدة ✨ وافق الشيف على طلبك المخصّص ${c.orderNumber}، وسنتابع معك الخطوات التالية.${c.track}`,
};

/** Statuses that trigger a customer notification (stable, sorted for tests). */
export const NOTIFIABLE_STATUSES: string[] = Object.keys(TEMPLATES).sort();

export function isNotifiableStatus(status: string): boolean {
  return status in TEMPLATES;
}

/** Build the public tracking URL, or null when we lack a code/origin. */
export function buildTrackingUrl(
  baseUrl: string | null,
  trackingCode: string | null
): string | null {
  if (!baseUrl || !trackingCode) return null;
  return `${baseUrl.replace(/\/$/, '')}/track?code=${encodeURIComponent(trackingCode)}`;
}

interface RenderCtx {
  name: string;
  orderNumber: string;
  storeName: string;
  branch: string;
  track: string;
}

/* ────────────────────────────────────────────────────────────────────────
 * تذكيرات المناسبات — «دائرة المناسبات»
 *
 * عائلتان منفصلتان عمداً، ولكل واحدة أساس نظامي مختلف:
 *
 *   utility   — تذكير مجرّد: لا سعر ولا عرض ولا دعوة للشراء. يستند إلى
 *               استثناء «التعامل السابق» في اللائحة التنفيذية لنظام حماية
 *               البيانات (م.٢٨/١)، فلا يستلزم موافقة تسويقية منفصلة.
 *
 *   marketing  — يحمل عرضاً أو مكافأة. يقع تحت التسويق المباشر (م.٢٩) الذي
 *               **لا استثناء فيه**، فلا يُرسل إلا بموافقة صريحة مسجّلة.
 *
 * خلط العائلتين هو الخطأ الذي يحوّل تذكيراً مشروعاً إلى مخالفة، ولذلك
 * الفصل هنا في الشيفرة لا في تعليمات التشغيل.
 * ──────────────────────────────────────────────────────────────────────── */

export type ReminderKind = 'utility' | 'marketing';

export interface OccasionReminderContext {
  /** الاسم الذي حفظته العميلة للمناسبة — نص حر، لا هوية طرف ثالث. */
  label: string;
  occasionType: string;
  /** كم يوماً تفصلنا عن المناسبة (١٤ / ٥ / ١). */
  leadDays: number;
  storeName: string;
  /** رابط المتجر، أو null فلا يُذكر رابط. */
  shopUrl: string | null;
  kind: ReminderKind;
}

const OCCASION_NOUNS: Record<string, string> = {
  birthday: 'عيد ميلاد',
  anniversary: 'ذكرى زواج',
  graduation: 'تخرّج',
  newborn: 'مولود',
  work: 'مناسبة عمل',
  other: 'مناسبة',
};

/** «عيد ميلاد ماما» — الاسم كما حفظته العميلة، مسبوقاً بنوع المناسبة. */
export function occasionPhrase(occasionType: string, label: string): string {
  const noun = OCCASION_NOUNS[occasionType] ?? OCCASION_NOUNS.other;
  return `${noun} ${label.trim()}`;
}

/**
 * نصّ التذكير. يُعيد null إن كانت المدّة غير مدعومة، حتى لا تُرسل رسالة
 * بصياغة عامة لا تناسب توقيتها.
 */
export function renderOccasionReminder(ctx: OccasionReminderContext): string | null {
  const phrase = occasionPhrase(ctx.occasionType, ctx.label);

  if (ctx.kind === 'utility') {
    // لا سعر، لا خصم، لا «اطلبي الآن» — **ولا رابط متجر**. الرابط دعوة للشراء،
    // وإرفاقه يحوّل التذكير المجرّد إلى تسويق مباشر. نتجاهل `shopUrl` هنا عمداً
    // بدل الاعتماد على أن المُنادي مرّر null: القاعدة نظامية، فمكانها القالب لا
    // موقع الاستدعاء.
    if (ctx.leadDays >= 14) {
      return `تذكير من ${ctx.storeName} 🌸\nباقي أسبوعان على ${phrase}.\nحبّينا نذكّرك من بدري عشان يكون عندك وقت للتجهيز.`;
    }
    if (ctx.leadDays >= 5) {
      return `${phrase} بعد خمسة أيام 🎂\nتجهيز الكيك يحتاج ٢٤ ساعة على الأقل، فخلّينا نبدأ من الآن.`;
    }
    if (ctx.leadDays >= 1) {
      return `${phrase} غداً 💝\nإذا ما جهّزتي شيء بعد، كلّمينا ونشوف الممكن.`;
    }
    return null;
  }

  const link = ctx.shopUrl ? `\n${ctx.shopUrl}` : '';

  // العائلة التسويقية: تحمل قيمة صريحة، ولا تُرسل إلا بموافقة مسجّلة.
  if (ctx.leadDays >= 14) {
    return `${ctx.storeName} 🌸\nباقي أسبوعان على ${phrase}. اطلبي من بدري واختاري موعد التسليم اللي يناسبك، وأضيفي لمسة التخصيص لطلبك.${link}`;
  }
  if (ctx.leadDays >= 5) {
    return `${phrase} قرّبت 🎂\nاطلبي اليوم واختاري تصميمك من الاستوديو — والتوصيل مجاني فوق ٢٠٠ ريال.${link}`;
  }
  if (ctx.leadDays >= 1) {
    return `${phrase} غداً 💝\nعندنا خيارات جاهزة تُسلَّم اليوم — كلّمينا ونرتّبها لك.${link}`;
  }
  return null;
}

/**
 * Render the message body for a status, or null if the status is not
 * customer-facing. Pure: same input → same output.
 */
export function renderMessage(status: string, ctx: OrderContext): string | null {
  const template = TEMPLATES[status];
  if (!template) return null;

  const url = buildTrackingUrl(ctx.trackingBaseUrl, ctx.trackingCode);
  return template({
    name: ctx.customerName?.trim() || 'عميلنا العزيز',
    orderNumber: ctx.orderNumber,
    storeName: ctx.storeName,
    branch: ctx.branchName?.trim() || 'الفرع',
    track: url ? `\nلمتابعة طلبك: ${url}` : '',
  });
}
