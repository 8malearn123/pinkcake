/**
 * «التسويق» — المفردات المشتركة بين كل الطبقات.
 *
 * لا استيراد هنا عن قصد: هذا الملف هو العقد الذي تتفق عليه المنطق النقي
 * (`coupon.ts` / `campaign.ts`)، والطبقة التجريبية (`src/lib/demo/marketing.ts`)،
 * والواجهة. أي حقل يُضاف هنا يجب أن يعرفه الثلاثة.
 */

/* ── الكوبونات ─────────────────────────────────────────────────────────── */

/**
 * ثلاثة أنواع لا أكثر. «توصيل مجاني» نوع مستقل لا خصمٌ بقيمة رسوم التوصيل:
 * الرسوم قابلة للتغيير من لوحة العروض، فتثبيتها في قيمة الكوبون يجعله يكذب
 * في اليوم الذي تتغيّر فيه.
 */
export type CouponKind = 'percent' | 'fixed' | 'free_delivery';

/** على ماذا ينطبق الكوبون. `all` هو الافتراضي وأبسط ما يُفهم. */
export type CouponScope = 'all' | 'category' | 'product';

export interface Coupon {
  id: string;
  /** بأحرف كبيرة دائماً وفريد — `normalizeCode` هي البوّابة الوحيدة. */
  code: string;
  kind: CouponKind;
  /** نسبة ١–٩٠ للنوع `percent`، ريالات للنوع `fixed`، ويُتجاهل لـ`free_delivery`. */
  value: number;
  /** سقف الخصم بالريال لكوبون النسبة. null = بلا سقف. */
  maxDiscount: number | null;
  /** أدنى قيمة سلة. 0 = بلا حد. */
  minOrder: number;
  /** ISO date (YYYY-MM-DD) أو null = بلا بداية/نهاية. */
  startsAt: string | null;
  endsAt: string | null;
  /** سقف الاستخدام الكلي، وسقفه لكل عميلة. null = بلا سقف. */
  usageLimit: number | null;
  perCustomerLimit: number | null;
  /** لأوّل طلب فقط — الترحيبية. */
  firstOrderOnly: boolean;
  scope: CouponScope;
  /** أسماء تصنيفات أو معرّفات منتجات، حسب `scope`. */
  scopeValues: string[];
  /** هل يُجمع مع مكافأة ولاء في الطلب نفسه. */
  stackableWithLoyalty: boolean;
  isActive: boolean;
  /** ملاحظة داخلية للفريق — لا تظهر للعميلة أبداً. */
  note: string;
  createdAt: number;

  /* ── مقاييس، تُحتسب ولا تُدخَل ── */
  redemptions: number;
  discountGiven: number;
  revenue: number;
}

/** ما يحرّره النموذج. الهوية والمقاييس تُدار خارجه. */
export type CouponDraft = Omit<
  Coupon,
  'id' | 'createdAt' | 'redemptions' | 'discountGiven' | 'revenue'
>;

/** سياق التقييم — كل ما تعرفه السلة لحظة تطبيق الرمز. */
export interface CouponContext {
  /** مجموع السلة قبل التوصيل وقبل أي خصم. */
  subtotal: number;
  /** تصنيفات ما في السلة (لنطاق `category`). */
  categories: string[];
  /** معرّفات منتجات السلة (لنطاق `product`). */
  productIds: string[];
  /** هل هذا أوّل طلب لهذه العميلة. */
  isFirstOrder: boolean;
  /** كم مرّة استخدمت هذه العميلة هذا الرمز من قبل. */
  customerRedemptions: number;
  /** لحظة التقييم — تُمرَّر لتبقى الدالة نقيّة وقابلة للاختبار. */
  now: Date;
}

/**
 * واجهة مسطّحة عن قصد. المستودع يُصرَّف بـ`strict: false`، وتحته لا يضيّق
 * TypeScript الاتحادات على مُميِّز منطقي — فالاتحاد المُميَّز هنا يعني
 * `outcome.discount` بنوع `any` عند كل استدعاء.
 */
export interface CouponOutcome {
  ok: boolean;
  /** ريالات تُحسم من `subtotal`. صفر للنوع `free_delivery`. */
  discount: number;
  /** صحيح فقط للنوع `free_delivery`. */
  freeDelivery: boolean;
  /** رسالة عربية تُعرض للعميلة كما هي. */
  message: string;
}

/* ── الإعلانات وواجهات المتجر ──────────────────────────────────────────── */

/**
 * أماكن العرض في المتجر. كل خانة تقابل مكوّناً قائماً اليوم بنصّ مثبّت في
 * الشيفرة؛ الغرض من هذا النوع أن يصير ذلك النصّ محرَّراً لا مُنشوراً.
 */
export type PromoSlot = 'ticker' | 'offer_banner' | 'gift_box' | 'seasonal_band';

export const PROMO_SLOTS: readonly PromoSlot[] = [
  'ticker',
  'offer_banner',
  'gift_box',
  'seasonal_band',
];

export const PROMO_SLOT_LABELS: Record<PromoSlot, string> = {
  ticker: 'الشريط المتحرّك',
  offer_banner: 'بانر العرض',
  gift_box: 'صندوق الهدية',
  seasonal_band: 'شريط الموسم',
};

export const PROMO_SLOT_HINTS: Record<PromoSlot, string> = {
  ticker: 'أعلى كل صفحات المتجر. تظهر كل العناصر المفعّلة بالتناوب.',
  offer_banner: 'بانر عريض في الصفحة الرئيسية. المفعّل الأول فقط يظهر.',
  gift_box: 'صندوق الهدية أسفل الرئيسية — يكشف رمز الترحيب. المفعّل الأول فقط.',
  seasonal_band: 'عنوان تشكيلة الموسم فوق منتجات الموسم. المفعّل الأول فقط.',
};

/** الخانات التي لا يظهر منها إلا عنصر واحد؛ `ticker` وحدها متعدّدة. */
export const SINGLE_SLOTS: readonly PromoSlot[] = ['offer_banner', 'gift_box', 'seasonal_band'];

export interface Announcement {
  id: string;
  slot: PromoSlot;
  /** السطر الصغير فوق العنوان. يُتجاهل في الشريط المتحرّك. */
  eyebrow: string;
  /**
   * السطر الرئيسي. في الشريط المتحرّك هو النصّ كاملاً، ويُستبدل فيه الرمز
   * `{riyal}` بعلامة الريال الرسمية عند العرض (المتجر لا يطبع الحرف نصّاً).
   */
  title: string;
  /** سطر مساند — يُتجاهل في الشريط المتحرّك. */
  subtitle: string;
  /** رمز كوبون مرتبط، يُعرض في البانر وصندوق الهدية. */
  couponCode: string | null;
  ctaLabel: string;
  /** مسار داخلي (`/shop`) أو مرساة (`#shop`). */
  ctaHref: string;
  /** رابط صورة. لا رفع في هذه المرحلة — انظر HANDOFF. */
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  displayOrder: number;
}

export type AnnouncementDraft = Omit<Announcement, 'id' | 'displayOrder'>;

/**
 * العروض الدائمة — ليست حملة بل قواعد متجر. كانت ثوابت في
 * `src/lib/delivery.ts` وفي نصوص المكوّنات؛ صارت صفّاً واحداً يُحرَّر.
 */
export interface StoreOffers {
  freeDeliveryThreshold: number;
  deliveryFee: number;
  /** الرمز الذي يعلنه المتجر للترحيب. يجب أن يطابق كوبوناً قائماً. */
  firstOrderCouponCode: string | null;
  showFreeDeliveryMeter: boolean;
  showGiftBox: boolean;
  showOfferBanner: boolean;
}

/** ما يقرأه المتجر في نداء واحد. */
export interface StorefrontPromos {
  announcements: Announcement[];
  offers: StoreOffers;
}

/* ── الرسائل التسويقية ─────────────────────────────────────────────────── */

export type AudienceKey =
  | 'all_consented'
  | 'circle_tier'
  | 'lapsed_90d'
  | 'upcoming_occasion_30d'
  | 'never_ordered';

export interface AudienceOption {
  key: AudienceKey;
  label: string;
  /** لماذا هذه الشريحة، لا ما هي. */
  rationale: string;
}

/**
 * كل شريحة هنا مشروطة بموافقة تسويقية مسجّلة — لا توجد شريحة «الجميع».
 * الرسالة التي تحمل عرضاً تسويقٌ مباشر (م.٢٩) ولا استثناء فيه.
 */
export const AUDIENCES: readonly AudienceOption[] = [
  {
    key: 'all_consented',
    label: 'كل الموافقات',
    rationale: 'كل من وافقت صراحةً على التسويق. الأوسع، والأسرع استهلاكاً لصبر العميلة.',
  },
  {
    key: 'circle_tier',
    label: 'الدائرة المميّزة',
    rationale: 'الأعلى إنفاقاً خلال نافذة الشريحة — الأنسب للإصدار المحدود لا للخصم.',
  },
  {
    key: 'lapsed_90d',
    label: 'لم تطلب منذ ٩٠ يوماً',
    rationale: 'الاسترجاع. دورة الشراء هنا سنوية، فـ٩٠ يوماً ليست هجراً بالضرورة.',
  },
  {
    key: 'upcoming_occasion_30d',
    label: 'لديها مناسبة خلال ٣٠ يوماً',
    rationale: 'أعلى نيّة شراء في القائمة — والتذكير التلقائي يغطّي ١٤/٥/١ يوماً فقط.',
  },
  {
    key: 'never_ordered',
    label: 'سجّلت ولم تطلب',
    rationale: 'التحويل الأول. الترحيبية هنا أنفع من أي عرض آخر.',
  },
];

export const AUDIENCE_LABELS: Record<AudienceKey, string> = AUDIENCES.reduce(
  (acc, a) => ({ ...acc, [a.key]: a.label }),
  {} as Record<AudienceKey, string>,
);

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'مسودّة',
  scheduled: 'مجدولة',
  sending: 'جارٍ الإرسال',
  sent: 'أُرسلت',
  failed: 'فشلت',
};

export interface CampaignMessage {
  id: string;
  name: string;
  audience: AudienceKey;
  channel: 'sms' | 'whatsapp';
  body: string;
  couponCode: string | null;
  /** ISO datetime أو null = إرسال فوري. */
  scheduledAt: string | null;
  status: CampaignStatus;
  sentAt: string | null;
  recipients: number;
  delivered: number;
  failed: number;
  createdAt: number;
}

export type CampaignDraft = Pick<
  CampaignMessage,
  'name' | 'audience' | 'channel' | 'body' | 'couponCode' | 'scheduledAt'
>;

/** نتيجة مُرسَل واحد كما تعود من دالة الحافة. */
export interface CampaignRecipientResult {
  maskedPhone: string;
  ok: boolean;
  error: string | null;
}

export interface CampaignSendResult {
  dryRun: boolean;
  recipients: number;
  sent: number;
  failed: number;
  /** نصّ الرسالة كما ستصل — للمعاينة. */
  sample: string;
  results: CampaignRecipientResult[];
  /** سبب الرفض حين لا يُسمح بالإرسال أصلاً. */
  blockedReason: string | null;
}

/* ── تقويم الحملات ─────────────────────────────────────────────────────── */

/** ضبط سنوي لموسم هجري: المعرّف → يوم/شهر ميلاديان لهذه السنة. */
export interface SeasonOverride {
  id: string;
  month: number;
  day: number;
  /** السنة الميلادية التي يخصّها الضبط — يسقط الضبط بانقضائها. */
  year: number;
}
