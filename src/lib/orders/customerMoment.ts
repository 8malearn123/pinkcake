import { differenceInCalendarDays, format, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { OrderStatus } from '@/types/order';

/**
 * The customer's story about their own order — one pure module, three consumers.
 *
 * `src/types/order.ts` holds the OPERATIONS vocabulary: «جاهز للإرسال»،
 * «في الطريق للفرع». Those name our own kitchen→branch hand-offs and belong on
 * the staff console; a customer reading them is reading our warehouse notes.
 * This module is the parallel customer layer — a warm sentence per status —
 * so `ORDER_STATUS_LABELS` (which StatusBadge and every staff screen depend on)
 * never has to change.
 *
 * /track, /my-orders and /my-orders/:id all read from here, so the three
 * surfaces cannot drift apart again. Zero React and an injectable `now`, so
 * every branch is unit-testable without a browser.
 */

export type MomentStage = 'placed' | 'making' | 'ready' | 'done' | 'action' | 'studio' | 'closed';
export type MomentActionKind = 'reorder' | 'shop' | 'contact' | 'respond';

export interface MomentAction {
  label: string;
  kind: MomentActionKind;
}

export interface OrderMomentInput {
  status: string;
  deliveryDate: string | null;
  /** 'HH:MM:SS' from PostgREST, 'HH:MM' from demo, or null. */
  deliveryTime: string | null;
  branchName: string | null;
  now?: Date;
}

export interface OrderMoment {
  stage: MomentStage;
  /** 0..1 — the rail fill. */
  progress: number;
  showRail: boolean;
  railLabels: readonly [string, string, string];
  railIndex: 0 | 1 | 2;
  /** THE answer, composed in code — never a status noun. */
  headline: string;
  /** What happens next, and whether anything is required of the customer. */
  next: string;
  /** The promise line. null = render nothing (no slot known yet). */
  readiness: string | null;
  late: boolean;
  showPickupPass: boolean;
  action: MomentAction | null;
}

const FALLBACK_HEADLINE = 'طلبك معنا';

/**
 * `date` + `time` → a LOCAL Date.
 *
 * Both halves are load-bearing. `new Date('2026-08-20')` parses as UTC midnight
 * and renders the previous day anywhere west of UTC — the off-by-one the order
 * pages shipped with. And PostgREST returns `"14:00:00"` where demo emits
 * `"14:00"`, so the raw value was printing `14:00:00` in production only.
 */
export function parseSlot(date: string | null, time: string | null): Date | null {
  if (!date) return null;
  const hhmm = (time ?? '12:00').slice(0, 5);
  const d = new Date(`${date}T${hhmm}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** «٦:٠٠ مساءً» — 12-hour with صباحاً/مساءً, per DESIGN_SYSTEM §8. */
export function formatClock12(d: Date): string {
  const h24 = d.getHours();
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${toArabicDigits(h)}:${toArabicDigits(mm)} ${h24 < 12 ? 'صباحاً' : 'مساءً'}`;
}

/** Whole-hour Arabic with correct dual/plural forms. */
export function relativeAr(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'أقل من ساعة';
  if (h === 1) return 'ساعة';
  if (h === 2) return 'ساعتين';
  if (h <= 10) return `${toArabicDigits(h)} ساعات`;
  return `${toArabicDigits(h)} ساعة`;
}

/**
 * The promise line, composed from typed parts.
 *
 * Never a `{token}` substitution: branchName, deliveryDate and deliveryTime are
 * all nullable, and one missed guard renders a literal brace to a customer.
 */
export function formatReadiness(
  input: OrderMomentInput,
  stage: MomentStage,
): { text: string | null; late: boolean } {
  const { deliveryDate, deliveryTime, branchName } = input;
  const now = input.now ?? new Date();
  const branchSuffix = branchName ? ` — ${branchName}` : '';

  // Off the fulfilment ladder there is nothing to promise.
  if (stage === 'done' || stage === 'closed' || stage === 'studio' || stage === 'action') {
    return { text: null, late: false };
  }

  // At the ready moment the promise flips from WHEN to WHERE.
  if (stage === 'ready') {
    return {
      text: branchName ? `تفضّل إلى ${branchName} — كيكتك بانتظارك الآن` : 'كيكتك بانتظارك الآن',
      late: false,
    };
  }

  const at = parseSlot(deliveryDate, deliveryTime);
  if (!at) return { text: null, late: false };

  const clock = deliveryTime ? ` الساعة ${formatClock12(at)}` : '';
  const diff = at.getTime() - now.getTime();

  if (diff < 0) {
    const past = isSameDay(at, now)
      ? `اليوم${clock}`
      : `يوم ${toArabicDigits(format(at, 'EEEE d MMMM', { locale: ar }))}،${clock}`;
    return { text: `كان موعد الاستلام ${past}${branchSuffix}`, late: true };
  }

  let when: string;
  if (diff <= 3 * 3_600_000) when = `بعد ${relativeAr(diff)} تقريباً${clock}`;
  else if (isSameDay(at, now)) when = `اليوم${clock}`;
  else if (differenceInCalendarDays(at, now) === 1) when = `غداً${clock}`;
  else when = `يوم ${toArabicDigits(format(at, 'EEEE d MMMM', { locale: ar }))}،${clock}`;

  return { text: `جاهزة ${when}${branchSuffix}`, late: false };
}

interface StatusStory {
  stage: MomentStage;
  progress: number;
  headline: string;
  next: string;
  action: MomentAction | null;
}

const CONTACT: MomentAction = { label: 'تواصل معنا', kind: 'contact' };

/**
 * Every OrderStatus, mapped. Typed as a total Record so adding a status to the
 * union is a compile error here rather than a blank hero in production.
 *
 * `ready_to_ship` and `in_transit` move the bar — a realtime update visibly
 * changes the page — but their headlines never repeat the ops names.
 */
const STORIES: Record<OrderStatus, StatusStory> = {
  paid: {
    stage: 'placed',
    progress: 0.2,
    headline: 'استلمنا طلبك 🎂',
    next: 'ما يلزمك شيء الآن — نبدأ التجهيز قريباً، ونطمّنك عند كل خطوة.',
    action: null,
  },
  preparing: {
    stage: 'making',
    progress: 0.45,
    headline: 'كيكتك في الفرن الآن',
    next: 'ما يلزمك شيء — شيفنا يجهّزها ويزيّنها بيده، ونرسل لك رسالة أول ما تجهز.',
    action: null,
  },
  ready_to_ship: {
    stage: 'making',
    progress: 0.65,
    headline: 'كيكتك خرجت من المطبخ',
    next: 'ما يلزمك شيء — باقي وصولها إلى الفرع، ونرسل لك رسالة أول ما تجهز للاستلام.',
    action: null,
  },
  in_transit: {
    stage: 'making',
    progress: 0.85,
    headline: 'كيكتك في طريقها إلى الفرع',
    next: 'ما يلزمك شيء — نرسل لك رسالة فور وصولها وجاهزيتها.',
    action: null,
  },
  ready_for_pickup: {
    stage: 'ready',
    progress: 1,
    headline: 'كيكتك جاهزة — تفضّل إلى الفرع',
    next: 'اعرض رمز الاستلام عند الكاشير، وكيكتك بانتظارك.',
    action: null,
  },
  completed: {
    stage: 'done',
    progress: 1,
    headline: 'بالهناء والشفاء 🎂',
    next: 'ما يلزمك شيء — نتمنى أنها عجبتكم، ونعيدها لك بضغطة وحدة.',
    action: { label: 'اطلبها مرة ثانية', kind: 'reorder' },
  },
  awaiting_payment: {
    stage: 'action',
    progress: 0,
    headline: 'باقي خطوة وحدة',
    // Deliberately promises no payment button: no customer pay route exists.
    next: 'طلبك محجوز باسمك بانتظار إتمام الدفع — تواصل معنا ونكمل معك.',
    action: CONTACT,
  },
  pending_approval: {
    stage: 'action',
    progress: 0,
    headline: 'طلبك وصلنا، ونراجعه الآن',
    next: 'ما يلزمك شيء الآن — نؤكد لك التفاصيل ونتواصل معك قريباً.',
    action: CONTACT,
  },
  custom_pending_review: {
    stage: 'studio',
    progress: 0,
    headline: 'تصميمك عند فريقنا',
    next: 'ما يلزمك شيء — نراجع تفاصيل كيكتك ونرسلها للشيف.',
    action: null,
  },
  sent_to_chef: {
    stage: 'studio',
    progress: 0,
    headline: 'تصميمك عند الشيف',
    next: 'ما يلزمك شيء — يدرس الشيف التصميم ويحدّد السعر ومدة التحضير.',
    action: null,
  },
  chef_priced: {
    stage: 'studio',
    progress: 0,
    headline: 'الشيف حدّد سعر تصميمك',
    next: 'ما يلزمك شيء بعد — نرسل لك العرض للمراجعة قريباً.',
    action: null,
  },
  custom_chef_approved: {
    stage: 'studio',
    progress: 0,
    headline: 'وافق الشيف على تصميمك ✨',
    next: 'ما يلزمك شيء — نكمل الخطوات التالية ونطمّنك أولاً بأول.',
    action: null,
  },
  pricing_sent_to_customer: {
    stage: 'action',
    progress: 0,
    headline: 'عندك عرض سعر بانتظار ردك',
    next: 'راجع السعر ومدة التحضير، ثم اقبل العرض أو اطلب تعديلاً.',
    action: { label: 'راجع عرض السعر', kind: 'respond' },
  },
  customer_accepted: {
    stage: 'action',
    progress: 0,
    headline: 'شكراً لتأكيدك 🎂',
    next: 'نتواصل معك لإكمال الدفع، وبعدها نبدأ التجهيز مباشرة.',
    action: CONTACT,
  },
  custom_rejected: {
    stage: 'closed',
    progress: 0,
    headline: 'ما قدرنا نكمل هذا الطلب',
    next: 'نعتذر منك — اختر تصميماً جاهزاً من المتجر أو تواصل معنا ونرتّب لك بديلاً.',
    action: { label: 'تصفّح المتجر', kind: 'shop' },
  },
  customer_rejected: {
    stage: 'closed',
    progress: 0,
    headline: 'أغلقنا هذا الطلب بناءً على ردّك',
    next: 'إذا غيّرت رأيك أو ودّك بتعديل، تواصل معنا ونجهّزه لك من جديد.',
    action: { label: 'تصفّح المتجر', kind: 'shop' },
  },
};

/** Any status string we do not recognise — a future enum value, or bad data. */
const FALLBACK_STORY: StatusStory = {
  stage: 'studio',
  progress: 0,
  headline: FALLBACK_HEADLINE,
  next: 'نتابعه لك خطوة بخطوة، ونرسل لك رسالة عند كل تحديث.',
  action: CONTACT,
};

const RAIL_STAGES: ReadonlySet<MomentStage> = new Set<MomentStage>(['placed', 'making', 'ready', 'done']);

function railIndexFor(stage: MomentStage): 0 | 1 | 2 {
  if (stage === 'making') return 1;
  if (stage === 'ready' || stage === 'done') return 2;
  return 0;
}

export function getOrderMoment(input: OrderMomentInput): OrderMoment {
  const known = Object.prototype.hasOwnProperty.call(STORIES, input.status);
  const story = known ? STORIES[input.status as OrderStatus] : FALLBACK_STORY;

  // The rail is never drawn for a status we cannot place on the ladder — a
  // linear bar for an unknown state would be a lie.
  const showRail = known && RAIL_STAGES.has(story.stage);

  const { text: readiness, late } = formatReadiness(input, story.stage);

  let { next, action } = story;
  // A passed slot while we are still making it: acknowledge it warmly and open a
  // channel. Never a negative countdown, never a destructive tone.
  if (late && (story.stage === 'placed' || story.stage === 'making')) {
    next = 'تأخّرنا قليلاً — كيكتك في المرحلة الأخيرة، ونتواصل معك حالاً.';
    action = CONTACT;
  }

  return {
    stage: story.stage,
    progress: story.progress,
    showRail,
    railLabels: ['استلمنا', 'نجهّزها', story.stage === 'done' ? 'تم الاستلام' : 'جاهزة للاستلام'],
    railIndex: railIndexFor(story.stage),
    headline: story.headline,
    next,
    readiness,
    late,
    showPickupPass: story.stage === 'ready',
    action,
  };
}
