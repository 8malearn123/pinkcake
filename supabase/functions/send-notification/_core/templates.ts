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
