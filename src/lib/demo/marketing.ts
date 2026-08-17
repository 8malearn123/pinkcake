/**
 * الطبقة التجريبية لقسم «التسويق».
 *
 * الوضع التجريبي هو الافتراضي في هذا المستودع (وهو ما تعمل به كل معاينات
 * Vercel)، وأي دالة RPC غير مُسجّلة هنا تعود بنجاح عام **بلا أن تغيّر شيئاً** —
 * أي زرّ يعمل ويُظهر رسالة نجاح ولا يفعل شيئاً. لذلك كل دوال التسويق ممثّلة
 * هنا بحالة حقيقية قابلة للتغيّر، لا بردود ثابتة، ويحرس ذلك
 * `src/lib/demo/__tests__/marketing.test.ts`.
 *
 * تُحفظ الحالة في `sessionStorage` لأن مبدّل الأدوار التجريبي يُعيد تحميل
 * الصفحة، فبدونها يضيع كل ما يجرّبه المستخدم.
 *
 * **البذرة ليست بيانات عرض.** هي النصوص المثبّتة اليوم في المتجر حرفياً
 * (الشريط المتحرّك، صندوق الهدية، شريط الموسم، الكوبونات الأربعة) — فالقسم
 * يبدأ بما يراه الزائر الآن، ولا يتغيّر شيء في المتجر لحظة تركيبه.
 */

import {
  evaluateCoupon,
  normalizeCode,
  validateDraft,
} from '@/lib/marketing/coupon';
import type {
  Announcement,
  AnnouncementDraft,
  AudienceKey,
  CampaignDraft,
  CampaignMessage,
  Coupon,
  CouponDraft,
  SeasonOverride,
  StoreOffers,
} from '@/lib/marketing/types';

const STORAGE_KEY = 'pinkcake:demo-marketing:v1';

interface DemoMarketingState {
  coupons: Coupon[];
  announcements: Announcement[];
  offers: StoreOffers;
  campaigns: CampaignMessage[];
  seasonOverrides: SeasonOverride[];
  /** رمز → كم مرّة استخدمته العميلة الحالية. سقف «لكل عميلة» يقرأ منه. */
  myRedemptions: Record<string, number>;
}

const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

function coupon(partial: Partial<Coupon> & Pick<Coupon, 'code' | 'kind' | 'value'>): Coupon {
  return {
    id: nextId('cpn'),
    maxDiscount: null,
    minOrder: 0,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    perCustomerLimit: null,
    firstOrderOnly: false,
    scope: 'all',
    scopeValues: [],
    stackableWithLoyalty: false,
    isActive: true,
    note: '',
    createdAt: Date.now(),
    redemptions: 0,
    discountGiven: 0,
    revenue: 0,
    ...partial,
    code: normalizeCode(partial.code),
  };
}

function announcement(
  partial: Partial<Announcement> & Pick<Announcement, 'slot' | 'title'>,
): Announcement {
  return {
    id: nextId('ann'),
    eyebrow: '',
    subtitle: '',
    couponCode: null,
    ctaLabel: '',
    ctaHref: '',
    imageUrl: null,
    startsAt: null,
    endsAt: null,
    isActive: true,
    displayOrder: 0,
    ...partial,
  };
}

function seed(): DemoMarketingState {
  const coupons: Coupon[] = [
    // الرمز الوحيد الذي يعلنه المتجر فعلاً — في الشريط وصندوق الهدية والبانر.
    coupon({
      code: 'CAKE15',
      kind: 'percent',
      value: 15,
      maxDiscount: 40,
      minOrder: 100,
      firstOrderOnly: true,
      perCustomerLimit: 1,
      note: 'الترحيبية المعلنة في الشريط وصندوق الهدية — لا تُوقف بلا تعديل النصوص.',
      redemptions: 38,
      discountGiven: 1140,
      revenue: 9260,
    }),
    coupon({
      code: 'WELCOME10',
      kind: 'percent',
      value: 10,
      minOrder: 100,
      note: 'رمز عام قديم — غير معلن في المتجر.',
      redemptions: 12,
      discountGiven: 186,
      revenue: 1860,
    }),
    coupon({
      code: 'SWEET15',
      kind: 'percent',
      value: 15,
      maxDiscount: 50,
      minOrder: 150,
      note: 'يُستخدم في تعاونات المؤثّرات.',
      redemptions: 21,
      discountGiven: 655,
      revenue: 4980,
    }),
    coupon({
      code: 'PINK25',
      kind: 'fixed',
      value: 25,
      minOrder: 150,
      usageLimit: 200,
      note: 'تعويض خدمة العملاء.',
      redemptions: 7,
      discountGiven: 175,
      revenue: 1520,
    }),
    coupon({
      code: 'TAWSEEL',
      kind: 'free_delivery',
      value: 0,
      minOrder: 120,
      isActive: false,
      endsAt: iso(30),
      note: 'مثال على كوبون التوصيل المجاني — موقوف حتى يُقرَّر إطلاقه.',
    }),
  ];

  const announcements: Announcement[] = [
    // الشريط المتحرّك — نفس العناصر الخمسة المثبّتة في StorefrontDecor.
    announcement({ slot: 'ticker', title: 'توصيل مجاني داخل جازان للطلبات فوق ٢٠٠ {riyal}', displayOrder: 0 }),
    announcement({ slot: 'ticker', title: '🥭 موسم المنجا الجازانية متوفر الآن', displayOrder: 1 }),
    announcement({ slot: 'ticker', title: 'اطلب قبل ٣ مساءً لتوصيل الغد', displayOrder: 2 }),
    announcement({ slot: 'ticker', title: 'خصم ١٥٪ على أول طلب مع كود CAKE15', couponCode: 'CAKE15', displayOrder: 3 }),
    announcement({ slot: 'ticker', title: 'تورتات طازجة تُخبز يومياً في جازان', displayOrder: 4 }),

    announcement({
      slot: 'offer_banner',
      eyebrow: 'هديّة ترحيبية',
      title: 'خصم ١٥٪ على أوّل طلب',
      subtitle: 'استخدم الكود التالي عند إتمام الطلب',
      couponCode: 'CAKE15',
      ctaLabel: 'تسوّقي الآن',
      ctaHref: '#shop',
    }),

    announcement({
      slot: 'gift_box',
      eyebrow: '🎁 هدية ترحيبية · لزوّار {store} لأول مرة',
      title: 'لديك هديّة بانتظارك!',
      subtitle: 'خصم ١٥٪ على أوّل طلب',
      couponCode: 'CAKE15',
      ctaLabel: '👆 اضغط لفتح الهدية',
    }),

    announcement({
      slot: 'seasonal_band',
      eyebrow: 'تشكيلة الصيف · لفترة محدودة',
      title: 'موسم المنجا الجازانية 🥭',
      subtitle:
        'من مزارع جازان مباشرةً — منجا طبيعية طازجة في تورتات وتشيز كيك بنكهة الصيف. متوفرة ما دام الموسم مستمر.',
      ctaLabel: 'نفاد سريع — احجز الآن',
    }),
  ];

  return {
    coupons,
    announcements,
    offers: {
      freeDeliveryThreshold: 200,
      deliveryFee: 25,
      firstOrderCouponCode: 'CAKE15',
      showFreeDeliveryMeter: true,
      showGiftBox: true,
      showOfferBanner: true,
    },
    campaigns: [
      {
        id: 'cmp-seed-1',
        name: 'تذكير موسم التخرّج',
        audience: 'upcoming_occasion_30d',
        channel: 'whatsapp',
        body: 'قرّب موسم التخرّج 🎓 عندنا علب مشتركة وتصاميم جاهزة تُسلَّم في يومها.',
        couponCode: null,
        scheduledAt: null,
        status: 'sent',
        sentAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
        recipients: 214,
        delivered: 209,
        failed: 5,
        createdAt: Date.now() - 7 * 86_400_000,
      },
      {
        id: 'cmp-seed-2',
        name: 'استرجاع ٩٠ يوماً',
        audience: 'lapsed_90d',
        channel: 'sms',
        body: 'اشتقنا لك 🌸 مناسبتك القادمة تستاهل كيكة — اختاري تصميمك من الاستوديو.',
        couponCode: 'SWEET15',
        scheduledAt: null,
        status: 'draft',
        sentAt: null,
        recipients: 0,
        delivered: 0,
        failed: 0,
        createdAt: Date.now() - 2 * 86_400_000,
      },
    ],
    seasonOverrides: [],
    myRedemptions: {},
  };
}

let state: DemoMarketingState | null = null;

function load(): DemoMarketingState {
  if (state) return state;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    state = raw ? (JSON.parse(raw) as DemoMarketingState) : seed();
  } catch {
    state = seed();
  }
  return state;
}

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* الوضع الخاص أو التخزين ممتلئ — الحالة تبقى في الذاكرة فقط */
  }
}

/** يُستخدم في الاختبارات لإعادة الحالة إلى بذرتها. */
export function __resetDemoMarketing(next?: Partial<DemoMarketingState>) {
  state = { ...seed(), ...next };
  save();
}

/* ── مساعدات ───────────────────────────────────────────────────────────── */

function draftFrom(a: Record<string, unknown> | undefined): CouponDraft {
  // خاصية خاصية لا `as CouponDraft`: تحت `strict: false` يمرّ الطاقم الناقص صامتاً.
  const d = (a?.['_draft'] ?? {}) as Record<string, unknown>;
  return {
    code: normalizeCode(d.code),
    kind: (d.kind as CouponDraft['kind']) ?? 'percent',
    value: Number(d.value ?? 0),
    maxDiscount: d.maxDiscount == null ? null : Number(d.maxDiscount),
    minOrder: Number(d.minOrder ?? 0),
    startsAt: (d.startsAt as string | null) ?? null,
    endsAt: (d.endsAt as string | null) ?? null,
    usageLimit: d.usageLimit == null ? null : Number(d.usageLimit),
    perCustomerLimit: d.perCustomerLimit == null ? null : Number(d.perCustomerLimit),
    firstOrderOnly: !!d.firstOrderOnly,
    scope: (d.scope as CouponDraft['scope']) ?? 'all',
    scopeValues: Array.isArray(d.scopeValues) ? (d.scopeValues as string[]) : [],
    stackableWithLoyalty: !!d.stackableWithLoyalty,
    isActive: d.isActive !== false,
    note: String(d.note ?? ''),
  };
}

function announcementDraftFrom(a: Record<string, unknown> | undefined): AnnouncementDraft {
  const d = (a?.['_draft'] ?? {}) as Record<string, unknown>;
  return {
    slot: (d.slot as AnnouncementDraft['slot']) ?? 'ticker',
    eyebrow: String(d.eyebrow ?? ''),
    title: String(d.title ?? ''),
    subtitle: String(d.subtitle ?? ''),
    couponCode: d.couponCode ? normalizeCode(d.couponCode) : null,
    ctaLabel: String(d.ctaLabel ?? ''),
    ctaHref: String(d.ctaHref ?? ''),
    imageUrl: (d.imageUrl as string | null) || null,
    startsAt: (d.startsAt as string | null) ?? null,
    endsAt: (d.endsAt as string | null) ?? null,
    isActive: d.isActive !== false,
  };
}

function campaignDraftFrom(a: Record<string, unknown> | undefined): CampaignDraft {
  const d = (a?.['_draft'] ?? {}) as Record<string, unknown>;
  return {
    name: String(d.name ?? ''),
    audience: (d.audience as AudienceKey) ?? 'all_consented',
    channel: d.channel === 'sms' ? 'sms' : 'whatsapp',
    body: String(d.body ?? ''),
    couponCode: d.couponCode ? normalizeCode(d.couponCode) : null,
    scheduledAt: (d.scheduledAt as string | null) ?? null,
  };
}

/** أحجام الشرائح في الوضع التجريبي — ثابتة كي تبقى الأرقام مفهومة. */
const AUDIENCE_SIZES: Record<AudienceKey, number> = {
  all_consented: 486,
  circle_tier: 63,
  lapsed_90d: 178,
  upcoming_occasion_30d: 214,
  never_ordered: 91,
};

export function demoAudienceSize(key: AudienceKey): number {
  return AUDIENCE_SIZES[key] ?? 0;
}

/* ── المعالِجات، بنفس أشكال الردود الحقيقية ────────────────────────────── */

export const marketingRpc: Record<string, (args?: Record<string, unknown>) => unknown> = {
  /* ── الكوبونات ── */
  get_coupons: () => [...load().coupons].sort((a, b) => b.createdAt - a.createdAt),

  create_coupon: (a) => {
    const s = load();
    const draft = draftFrom(a);
    const error = validateDraft(draft, s.coupons.map((c) => c.code));
    if (error) return { success: false, message: error };
    const row = coupon({ ...draft, code: draft.code });
    s.coupons.push(row);
    save();
    return { success: true, id: row.id, message: 'تم إنشاء الكوبون' };
  },

  update_coupon: (a) => {
    const s = load();
    const id = String(a?.['_id'] ?? '');
    const i = s.coupons.findIndex((c) => c.id === id);
    if (i < 0) return { success: false, message: 'الكوبون غير موجود' };
    const draft = draftFrom(a);
    const others = s.coupons.filter((c) => c.id !== id).map((c) => c.code);
    const error = validateDraft(draft, others);
    if (error) return { success: false, message: error };
    // المقاييس لا تُكتب من النموذج أبداً — تُنقل كما هي.
    s.coupons[i] = { ...s.coupons[i], ...draft };
    save();
    return { success: true, message: 'تم حفظ التعديلات' };
  },

  delete_coupon: (a) => {
    const s = load();
    s.coupons = s.coupons.filter((c) => c.id !== a?.['_id']);
    save();
    return { success: true, message: 'تم حذف الكوبون' };
  },

  set_coupon_active: (a) => {
    const s = load();
    const row = s.coupons.find((c) => c.id === a?.['_id']);
    if (row) row.isActive = !!a?.['_is_active'];
    save();
    return { success: true };
  },

  /* ── الإعلانات والعروض ── */
  get_announcements: () =>
    [...load().announcements].sort((a, b) => a.displayOrder - b.displayOrder),

  create_announcement: (a) => {
    const s = load();
    const draft = announcementDraftFrom(a);
    if (!draft.title.trim()) return { success: false, message: 'النصّ مطلوب' };
    const order = s.announcements.filter((x) => x.slot === draft.slot).length;
    const row = announcement({ ...draft, displayOrder: order });
    s.announcements.push(row);
    save();
    return { success: true, id: row.id, message: 'تمت الإضافة' };
  },

  update_announcement: (a) => {
    const s = load();
    const i = s.announcements.findIndex((x) => x.id === a?.['_id']);
    if (i < 0) return { success: false, message: 'العنصر غير موجود' };
    const draft = announcementDraftFrom(a);
    if (!draft.title.trim()) return { success: false, message: 'النصّ مطلوب' };
    s.announcements[i] = { ...s.announcements[i], ...draft };
    save();
    return { success: true, message: 'تم الحفظ' };
  },

  delete_announcement: (a) => {
    const s = load();
    s.announcements = s.announcements.filter((x) => x.id !== a?.['_id']);
    save();
    return { success: true, message: 'تم الحذف' };
  },

  set_announcement_active: (a) => {
    const s = load();
    const row = s.announcements.find((x) => x.id === a?.['_id']);
    if (row) row.isActive = !!a?.['_is_active'];
    save();
    return { success: true };
  },

  reorder_announcements: (a) => {
    const s = load();
    const ids = Array.isArray(a?.['_ids']) ? (a?.['_ids'] as string[]) : [];
    ids.forEach((id, index) => {
      const row = s.announcements.find((x) => x.id === id);
      if (row) row.displayOrder = index;
    });
    save();
    return { success: true };
  },

  get_store_offers: () => [load().offers],

  update_store_offers: (a) => {
    const s = load();
    const patch = (a?.['_patch'] ?? {}) as Partial<StoreOffers>;
    s.offers = { ...s.offers, ...patch };
    save();
    return { success: true };
  },

  /** ما يقرأه المتجر: إعلانات مفعّلة وضمن مدّتها + العروض الدائمة. */
  get_storefront_promos: () => {
    const s = load();
    const today = new Date().toISOString().slice(0, 10);
    const live = s.announcements
      .filter((x) => x.isActive)
      .filter((x) => !x.startsAt || x.startsAt <= today)
      .filter((x) => !x.endsAt || x.endsAt >= today)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return [{ announcements: live, offers: s.offers }];
  },

  /* ── الحملات ── */
  get_campaigns: () => [...load().campaigns].sort((a, b) => b.createdAt - a.createdAt),

  create_campaign: (a) => {
    const s = load();
    const draft = campaignDraftFrom(a);
    const row: CampaignMessage = {
      id: nextId('cmp'),
      ...draft,
      status: draft.scheduledAt ? 'scheduled' : 'draft',
      sentAt: null,
      recipients: 0,
      delivered: 0,
      failed: 0,
      createdAt: Date.now(),
    };
    s.campaigns.push(row);
    save();
    return { success: true, id: row.id, message: 'تم حفظ الحملة' };
  },

  update_campaign: (a) => {
    const s = load();
    const i = s.campaigns.findIndex((c) => c.id === a?.['_id']);
    if (i < 0) return { success: false, message: 'الحملة غير موجودة' };
    // حملة أُرسلت لا تُحرَّر: نصّها هو ما وصل فعلاً، وتعديله يمحو الدليل.
    if (s.campaigns[i].status === 'sent') return { success: false, message: 'لا تُعدَّل حملة أُرسلت' };
    const draft = campaignDraftFrom(a);
    s.campaigns[i] = {
      ...s.campaigns[i],
      ...draft,
      status: draft.scheduledAt ? 'scheduled' : 'draft',
    };
    save();
    return { success: true, message: 'تم حفظ الحملة' };
  },

  delete_campaign: (a) => {
    const s = load();
    s.campaigns = s.campaigns.filter((c) => c.id !== a?.['_id']);
    save();
    return { success: true, message: 'تم حذف الحملة' };
  },

  get_audience_size: (a) => demoAudienceSize(String(a?.['_audience'] ?? '') as AudienceKey),

  /**
   * تُنادى بعد ردّ دالة الحافّة. مفصولة عن الإرسال عمداً: الإرسال يحدث
   * خادمياً والنتيجة تعود إلى المتصفّح، فتسجيلها خطوة ثانية صريحة لا أثر
   * جانبي مخفيّ داخل دالة الإرسال.
   */
  record_campaign_send: (a) => {
    recordCampaignSend({
      id: a?.['_id'],
      recipients: Number(a?.['_recipients'] ?? 0),
      delivered: Number(a?.['_delivered'] ?? 0),
      failed: Number(a?.['_failed'] ?? 0),
    });
    return { success: true };
  },

  /* ── تقويم الحملات ── */
  get_season_overrides: () => load().seasonOverrides,

  set_season_override: (a) => {
    const s = load();
    const id = String(a?.['_id'] ?? '');
    const year = Number(a?.['_year'] ?? new Date().getFullYear());
    const month = Number(a?.['_month'] ?? 0);
    const day = Number(a?.['_day'] ?? 0);
    s.seasonOverrides = s.seasonOverrides.filter((o) => !(o.id === id && o.year === year));
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      s.seasonOverrides.push({ id, year, month, day });
    }
    save();
    return { success: true };
  },

  /* ── لوحة النظرة العامة ── */
  get_marketing_overview: () => {
    const s = load();
    const active = s.coupons.filter((c) => c.isActive).length;
    const redemptions = s.coupons.reduce((n, c) => n + c.redemptions, 0);
    const discountGiven = s.coupons.reduce((n, c) => n + c.discountGiven, 0);
    const revenue = s.coupons.reduce((n, c) => n + c.revenue, 0);
    const sent = s.campaigns.filter((c) => c.status === 'sent');
    const delivered = sent.reduce((n, c) => n + c.delivered, 0);
    const attempted = sent.reduce((n, c) => n + c.recipients, 0);

    return [
      {
        active_coupons: active,
        total_coupons: s.coupons.length,
        redemptions,
        discount_given: discountGiven,
        attributed_revenue: revenue,
        // «كم ريالاً من الإيراد مقابل كل ريال خصم» — المقياس الذي يقرّر إن كان
        // الكوبون استثماراً أم تنازلاً عن هامش.
        return_on_discount: discountGiven > 0 ? Math.round((revenue / discountGiven) * 10) / 10 : 0,
        campaigns_sent: sent.length,
        campaign_recipients: attempted,
        delivery_rate: attempted > 0 ? Math.round((delivered / attempted) * 100) : 0,
        live_announcements: s.announcements.filter((x) => x.isActive).length,
      },
    ];
  },

  /** أداء كل كوبون — يغذّي الرسم البياني في «نظرة عامة». */
  get_coupon_performance: () =>
    load()
      .coupons.filter((c) => c.redemptions > 0)
      .map((c) => ({
        code: c.code,
        redemptions: c.redemptions,
        discount_given: c.discountGiven,
        revenue: c.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue),

  /* ── الإحالات (قراءة فقط) ──
     `loyalty_referrals` عليها سياسة قراءة للمدير في القاعدة، ولم تكن لها
     واجهة أبداً. هذه بيانات تجريبية بنفس شكل الجدول. */
  get_referrals_for_admin: () => [
    { id: 'ref-1', referrer_name: 'نورة الشمري', referrer_code: 'PC4K2M9X', referee_phone: '+966••••0712', status: 'rewarded', created_at: iso(-21), vested_at: iso(-18) },
    { id: 'ref-2', referrer_name: 'سارة القحطاني', referrer_code: 'PC7Q1B3D', referee_phone: '+966••••0745', status: 'vested', created_at: iso(-9), vested_at: iso(-6) },
    { id: 'ref-3', referrer_name: 'نورة الشمري', referrer_code: 'PC4K2M9X', referee_phone: '+966••••0788', status: 'pending', created_at: iso(-3), vested_at: null },
    { id: 'ref-4', referrer_name: 'ريم العتيبي', referrer_code: 'PC9Z5T2A', referee_phone: '+966••••0801', status: 'review', created_at: iso(-2), vested_at: null },
  ],
};

/* ── وصلات تُنادى من `rpc.ts` لا من الواجهة ────────────────────────────── */

/**
 * تقييم رمز مقابل الكوبونات التي أنشأها المدير. يعيد نفس مغلّف
 * `validate_coupon` القديم بالضبط، فلا يتغيّر شيء في `useValidateCoupon` ولا
 * في `CartSheet` — أُضيف `free_delivery` فقط كنوع ثالث.
 */
export function validateCouponAgainstState(args: Record<string, unknown> | undefined) {
  const s = load();
  const code = normalizeCode(args?.['_code']);
  const found = s.coupons.find((c) => c.code === code);
  const outcome = evaluateCoupon(found, {
    subtotal: Number(args?.['_subtotal'] ?? 0),
    categories: Array.isArray(args?.['_categories']) ? (args?.['_categories'] as string[]) : [],
    productIds: Array.isArray(args?.['_product_ids']) ? (args?.['_product_ids'] as string[]) : [],
    // الوضع التجريبي يفترض عميلة أوّل طلب — وإلا لم تكن الترحيبية قابلة للتجربة.
    isFirstOrder: true,
    customerRedemptions: s.myRedemptions[code] ?? 0,
    now: new Date(),
  });

  if (!outcome.ok) return { valid: false, message: outcome.message };
  return {
    valid: true,
    code,
    kind: found.kind,
    value: found.kind === 'percent' ? found.value : outcome.discount,
    free_delivery: outcome.freeDelivery,
    message: outcome.message,
  };
}

/**
 * تُنادى بعد إنشاء الطلب. بدونها يبقى عدّاد الاستخدام صفراً مهما استُخدم
 * الرمز، فتبدو لوحة الأداء معطّلة بينما هي لا تُغذَّى أصلاً.
 */
export function recordCouponUse(input: {
  code: unknown;
  discount: unknown;
  total: unknown;
}): void {
  const code = normalizeCode(input.code);
  if (!code) return;
  const s = load();
  const row = s.coupons.find((c) => c.code === code);
  if (!row) return;
  row.redemptions += 1;
  row.discountGiven += Math.max(0, Number(input.discount ?? 0));
  row.revenue += Math.max(0, Number(input.total ?? 0));
  s.myRedemptions[code] = (s.myRedemptions[code] ?? 0) + 1;
  save();
}

/** تُنادى بعد ردّ دالة الحافّة كي ينعكس الإرسال على جدول الحملات. */
export function recordCampaignSend(input: {
  id: unknown;
  recipients: number;
  delivered: number;
  failed: number;
}): void {
  const s = load();
  const row = s.campaigns.find((c) => c.id === input.id);
  if (!row) return;
  row.status = input.failed > 0 && input.delivered === 0 ? 'failed' : 'sent';
  row.sentAt = new Date().toISOString();
  row.recipients = input.recipients;
  row.delivered = input.delivered;
  row.failed = input.failed;
  save();
}
