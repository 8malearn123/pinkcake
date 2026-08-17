/**
 * قواعد الرسائل التسويقية — منطق نقيّ.
 *
 * القاعدة الحاكمة، وهي نظامية لا تشغيلية: **كل رسالة تُرسَل من هذه اللوحة
 * تسويقٌ مباشر** (نظام حماية البيانات م.٢٩)، لا يشملها استثناء «التعامل
 * السابق» الذي يقوم عليه التذكير المجرّد في
 * `src/lib/notifications/templates.ts`. لذلك لا توجد هنا شريحة «الجميع»، ولا
 * طريقة لإرسال رسالة لمن لم توافق.
 *
 * الفحوص هنا تُشغَّل مرّتين عن قصد: في المتصفّح كي يفهم المستخدم لماذا الزرّ
 * معطّل، وفي دالة الحافّة لأن المتصفّح ليس جهة إنفاذ.
 */

import type { CampaignDraft } from './types';

/** نافذة الإرسال الترويجي المسموح بها. */
export const SEND_WINDOW_START = 8;
export const SEND_WINDOW_END = 22;

/**
 * الرياض على UTC+3 ثابتاً بلا توقيت صيفي — فالحساب مباشر ولا يعتمد على
 * قاعدة مناطق زمنية قد لا تكون محمّلة في بيئة الاختبار أو في Deno.
 */
export function riyadhHour(date: Date): number {
  return (date.getUTCHours() + 3) % 24;
}

export function withinSendWindow(date: Date): boolean {
  const hour = riyadhHour(date);
  return hour >= SEND_WINDOW_START && hour < SEND_WINDOW_END;
}

/** رسالة تشرح سبب المنع، أو null إن كان الوقت مناسباً. */
export function sendWindowBlock(date: Date): string | null {
  if (withinSendWindow(date)) return null;
  return `الإرسال الترويجي مسموح بين ٨ صباحاً و١٠ مساءً بتوقيت الرياض. الساعة الآن ${riyadhHour(date)}:00.`;
}

/* ── تقدير الشرائح ─────────────────────────────────────────────────────── */

/** حروف GSM-7. أي حرف خارجها (والعربية كلّها خارجها) يحوّل الرسالة إلى UCS-2. */
const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

export function isUnicodeBody(body: string): boolean {
  for (const ch of body) if (!GSM7.includes(ch)) return true;
  return false;
}

export interface SegmentEstimate {
  unicode: boolean;
  length: number;
  segments: number;
  /** كم حرفاً يبقى قبل أن تُضاف شريحة جديدة. */
  remaining: number;
}

/**
 * تقدير عدد الشرائح. النصّ العربي دائماً UCS-2: ٧٠ حرفاً للشريحة الواحدة،
 * و٦٧ حين تُقسَّم — وهو الفرق الذي يجعل رسالة من ٧١ حرفاً تُحاسَب شريحتين.
 */
export function estimateSegments(body: string): SegmentEstimate {
  const unicode = isUnicodeBody(body);
  const length = [...body].length;
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;

  if (length === 0) return { unicode, length, segments: 0, remaining: single };
  if (length <= single) return { unicode, length, segments: 1, remaining: single - length };

  const segments = Math.ceil(length / multi);
  return { unicode, length, segments, remaining: segments * multi - length };
}

/* ── فحص المسودّة ──────────────────────────────────────────────────────── */

export const MAX_BODY_LENGTH = 480;

/** أول خطأ في المسودّة، أو null. */
export function validateCampaign(draft: CampaignDraft): string | null {
  if (!draft.name?.trim()) return 'اسم الحملة مطلوب';
  const body = draft.body?.trim() ?? '';
  if (body.length < 10) return 'نصّ الرسالة قصير جداً';
  if ([...body].length > MAX_BODY_LENGTH) return `نصّ الرسالة أطول من ${MAX_BODY_LENGTH} حرفاً`;

  if (draft.scheduledAt) {
    const at = new Date(draft.scheduledAt);
    if (Number.isNaN(at.getTime())) return 'موعد الإرسال غير صحيح';
    if (!withinSendWindow(at)) return sendWindowBlock(at);
  }
  return null;
}

/**
 * نصّ الرسالة كما سيصل. الرمز يُلحق في سطر مستقلّ لأن دمجه في الجملة يجعل
 * النسخ من رسالة نصّية صعباً على الهاتف.
 */
export function renderCampaignBody(body: string, couponCode: string | null): string {
  const text = body.trim();
  if (!couponCode) return text;
  return `${text}\nرمزك: ${couponCode}`;
}
