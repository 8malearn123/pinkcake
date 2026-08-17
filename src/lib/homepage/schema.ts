/**
 * عقد محتوى الصفحة الرئيسية: مخطّط zod لكل قسم، وقيمه الافتراضية، وواصفات
 * الحقول التي يبني منها محرِّر لوحة المدير نموذجه.
 *
 * القيم الافتراضية منقولة حرفياً من النصوص التي كانت مكتوبة داخل المكوّنات، فهي
 * المرجع الذي تبذر به الهجرة الجدول، وهي أيضاً ما يعود إليه زرّ «إعادة للأصل».
 *
 * الملف نقيّ: لا React ولا supabase. الطبقة التجريبية والاختبارات تستورده مباشرة.
 */
import { z } from 'zod';
import { vMessages } from '@/lib/validation';
import {
  CTA_TARGETS,
  ICON_KEYS,
  SECTION_KEYS,
  type CtaTarget,
  type SectionDescriptor,
  type SectionKey,
} from './types';

/* ── لبنات مشتركة ──────────────────────────────────────────────────────── */

const requiredText = z.string().trim().min(1, vMessages.required);
const optionalText = z.string().trim().default('');

const iconSchema = z.enum(ICON_KEYS);

/** مصدر الوجهات واحد (`CTA_TARGETS`)؛ هذا السطر يشتقّ منه صفّ zod فحسب. */
const ctaTargetSchema = z.enum(
  CTA_TARGETS.map((t) => t.value) as unknown as [CtaTarget, ...CtaTarget[]],
);

const ctaSchema = z.object({
  label: requiredText,
  target: ctaTargetSchema,
  visible: z.boolean().default(true),
});

/**
 * الصور: رابط مطلق (Unsplash اليوم) أو مسار داخل الموقع (ما يعيده رفع الصور إلى
 * التخزين). أي شيء آخر مرفوض كي لا ينكسر `<img>` بصمت.
 */
const imageUrlSchema = z
  .string()
  .trim()
  .min(1, vMessages.required)
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith('/'), 'أدخل رابط صورة صحيحاً يبدأ بـ https:// أو /');

const imageSchema = z.object({
  url: imageUrlSchema,
  /** نصّ بديل للقارئ الشاشي. فارغ = صورة زخرفية، وهو خيار مقصود في البينتو. */
  alt: optionalText,
});

const visibleFlag = z.boolean().default(true);

/* ── مخطّطات الأقسام ───────────────────────────────────────────────────── */

/**
 * الأقسام الترويجية — الشريط المتحرّك، وبانر العرض، وشريط الموسم، وصندوق
 * الهدية — محتواها في «التسويق» ← «العروض والإعلانات»، وتقرأه مكوّناتها من
 * `useStorefrontPromos`. تبقى في السجلّ بمحتوى فارغ لأن ترتيبها وإظهارها
 * بنية الصفحة، وتلك ملك هذه الشاشة.
 */
const promoManagedSchema = z.object({});

const marqueeSchema = promoManagedSchema;

const heroSchema = z.object({
  image: imageSchema,
  seal: z.object({ text: optionalText, visible: visibleFlag }),
  eyebrow: optionalText,
  title: requiredText,
  lede: optionalText,
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
  trust: z.array(z.object({ text: requiredText, icon: iconSchema, visible: visibleFlag })),
  featuredPick: z.object({ eyebrow: optionalText, visible: visibleFlag }),
});

const customCakeSchema = z.object({
  eyebrow: optionalText,
  title: requiredText,
  titleAccent: optionalText,
  lede: optionalText,
  trust: z.array(z.object({ text: requiredText, icon: iconSchema, visible: visibleFlag })),
  cta: ctaSchema,
});

const seasonalSchema = promoManagedSchema;

const offerBannerSchema = promoManagedSchema;

const occasionsSchema = z.object({
  eyebrow: optionalText,
  title: requiredText,
  lede: optionalText,
  items: z.array(
    z.object({
      title: requiredText,
      desc: optionalText,
      count: z.coerce.number().int().min(0).max(9999),
      icon: iconSchema,
      image: imageSchema,
      target: ctaTargetSchema,
      /** عرض البلاطة داخل شبكة البينتو. */
      size: z.enum(['small', 'wide']).default('small'),
      /** البلاطة المميّزة: شريط «الأكثر طلباً» وخطّ أكبر. */
      featured: z.boolean().default(false),
      visible: visibleFlag,
    }),
  ),
});

const shopSchema = z.object({
  eyebrow: optionalText,
  title: requiredText,
  note: optionalText,
  ctaLabel: requiredText,
});

const combosSchema = z.object({
  badge: optionalText,
  title: requiredText,
  titleAccent: optionalText,
  lede: optionalText,
});

const reviewsSchema = z.object({
  eyebrow: optionalText,
  title: requiredText,
  ratingLabel: optionalText,
  items: z.array(
    z.object({
      name: requiredText,
      occasion: optionalText,
      rating: z.coerce.number().int().min(1).max(5),
      text: requiredText,
      visible: visibleFlag,
    }),
  ),
});

const eventsSchema = z.object({
  eyebrow: optionalText,
  title: requiredText,
  titleAccent: optionalText,
  lede: optionalText,
  items: z.array(
    z.object({
      label: requiredText,
      tag: optionalText,
      /** حجم البلاطة في شبكة البينتو. */
      size: z.enum(['hero', 'wide', 'small']).default('small'),
      image: imageSchema,
      visible: visibleFlag,
    }),
  ),
  cta: z.object({
    title: requiredText,
    subtitle: optionalText,
    label: requiredText,
  }),
});

const branchesSchema = z.object({
  eyebrow: optionalText,
  title: requiredText,
  titleAccent: optionalText,
  lede: optionalText,
  items: z.array(
    z.object({
      city: requiredText,
      area: optionalText,
      hours: optionalText,
      phone: optionalText,
      phoneHref: optionalText,
      mapUrl: optionalText,
      image: imageSchema,
      visible: visibleFlag,
    }),
  ),
});

const faqSchema = z.object({
  eyebrow: optionalText,
  title: requiredText,
  items: z.array(z.object({ q: requiredText, a: requiredText, visible: visibleFlag })),
});

const giftBoxSchema = promoManagedSchema;

export const SECTION_SCHEMAS = {
  marquee: marqueeSchema,
  hero: heroSchema,
  customCake: customCakeSchema,
  seasonal: seasonalSchema,
  occasions: occasionsSchema,
  offerBanner: offerBannerSchema,
  shop: shopSchema,
  combos: combosSchema,
  reviews: reviewsSchema,
  events: eventsSchema,
  branches: branchesSchema,
  faq: faqSchema,
  giftBox: giftBoxSchema,
} as const satisfies Record<SectionKey, z.ZodTypeAny>;

export type SectionContent = {
  [K in SectionKey]: z.infer<(typeof SECTION_SCHEMAS)[K]>;
};

/* ── القيم الافتراضية — منقولة حرفياً من المكوّنات ─────────────────────── */

const img = (url: string, alt = '') => ({ url, alt });

export const SECTION_DEFAULTS: SectionContent = {
  // الأقسام الترويجية بلا محتوى هنا — مصدره «التسويق». انظر `promoManagedSchema`.
  marquee: {},

  // StoreHero.tsx:28,43,50,53,56,63,70,74,75
  hero: {
    image: img(
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=2000&h=1200&q=85',
      'كيكة شوكولاتة فاخرة بصوص الغاناش',
    ),
    seal: { text: 'صُنع\nبحُب في\nجازان', visible: true },
    eyebrow: 'حلويات تُخبز يومياً في جازان',
    title: 'كل مناسبة تستحق كيكة مميزة.',
    lede: 'تورتات طازجة بتصاميم أنيقة ونكهات يحبها الجميع. اختر تورتتك، حدد موعد التوصيل، وخلي الاحتفال علينا.',
    primaryCta: { label: 'تسوق التورتات', target: '#shop', visible: true },
    secondaryCta: { label: 'صمم تورتة خاصة', target: '/customize', visible: true },
    trust: [
      { text: 'توصيل في نفس اليوم', icon: 'truck', visible: true },
      { text: '٤٫٩ من ١٢٠٠+ تقييم', icon: 'star', visible: true },
    ],
    featuredPick: { eyebrow: 'اختيار هذا الأسبوع', visible: true },
  },

  // CustomCakeSection.tsx:18-22,44-78
  customCake: {
    eyebrow: 'استوديو التصميم',
    title: 'صمّم كيكتك',
    titleAccent: 'بالضبط كما تتخيّلها.',
    lede: 'اختر كيكة، ثم خصّص شكلها ونكهتها ولونها خطوة بخطوة. كل خيار تراه هو صورة كيكة خبزناها فعلاً — لا رسومات ولا تخمين، تشوف كيكتك قبل ما تطلبها.',
    trust: [
      { text: 'كل خيار مصوّر فعلاً في مطبخنا', icon: 'camera', visible: true },
      { text: 'تعديلات مجانية قبل التأكيد', icon: 'sparkles', visible: true },
      { text: 'جاهزة خلال ٢٤ ساعة', icon: 'clock', visible: true },
    ],
    cta: { label: 'شاهد كل التصاميم', target: '/custom-cakes', visible: true },
  },

  seasonal: {},

  offerBanner: {},

  /**
   * StorefrontSections.tsx:25-30,52-73.
   *
   * العناصر مرتّبة بترتيب ظهورها الفعلي في الشبكة، لا بترتيب المصفوفة القديمة
   * التي كانت تُفكَّك إلى `[feature, ...rest]` ثم تُوزَّع يدوياً — وإلا لسحب
   * المدير عنصراً إلى الأول ووجده ثالثاً على الصفحة.
   */
  occasions: {
    eyebrow: 'وش المناسبة؟',
    title: 'تصفّح حسب المناسبة',
    lede: 'اختر مناسبتك ونعرض لك التورتات المناسبة لها فوراً — من أعياد الميلاد إلى استقبال المواليد.',
    items: [
      {
        title: 'حفلات التخرج',
        desc: 'احتفِ بإنجازك بأناقة',
        count: 9,
        icon: 'sparkles',
        image: img('https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=600&h=760&q=85'),
        target: '#shop',
        size: 'small',
        featured: false,
        visible: true,
      },
      {
        title: 'المواليد الجدد',
        desc: 'لمسات ناعمة للمولود',
        count: 12,
        icon: 'gift',
        image: img('https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&h=760&q=85'),
        target: '#shop',
        size: 'small',
        featured: false,
        visible: true,
      },
      {
        title: 'أعياد الميلاد',
        desc: 'تصاميم مبهجة لكل الأعمار',
        count: 18,
        icon: 'cake',
        image: img('https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&h=760&q=85'),
        target: '#shop',
        size: 'wide',
        featured: true,
        visible: true,
      },
      {
        title: 'المناسبات العائلية',
        desc: 'تورتات تجمع الأحبة',
        count: 15,
        icon: 'cake',
        image: img('https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=600&h=760&q=85'),
        target: '#shop',
        size: 'wide',
        featured: false,
        visible: true,
      },
    ],
  },

  // Store.tsx:185-188,207
  shop: {
    eyebrow: 'اختر ما يناسب مناسبتك',
    title: 'تسوق التورتات',
    note: 'جميع التورتات تكفي من ٨ إلى ١٢ شخصاً\nمع إمكانية إضافة بطاقة تهنئة',
    ctaLabel: 'عرض كل المنتجات',
  },

  // CombosSection.tsx:42-51
  combos: {
    badge: 'توصيلها كلها علينا 🎁',
    title: 'اجمعها بذكاء،',
    titleAccent: 'ووفّر أكثر.',
    lede: 'توليفات جاهزة اخترناها لك بعناية — كل باقة توفّر عليك أكثر مع توصيل مجاني تلقائياً.',
  },

  // Reviews.tsx:21-25,34-41
  reviews: {
    eyebrow: 'آراء عملائنا',
    title: 'أكثر من ١٢٠٠ مناسبة سعيدة',
    ratingLabel: '٤٫٩ / ٥ متوسط التقييم',
    items: [
      {
        name: 'نورة العتيبي',
        occasion: 'عيد ميلاد ابنتي',
        rating: 5,
        text: 'التورتة وصلت في وقتها بالضبط والتصميم كان أجمل من الصورة! الكل سألني من وين طلبتها.',
        visible: true,
      },
      {
        name: 'عبدالله الحربي',
        occasion: 'تخرج',
        rating: 5,
        text: 'طلبت تورتة مخصصة وتعاملهم راقي جداً من أول رسالة لين التوصيل. الطعم خيالي والله.',
        visible: true,
      },
      {
        name: 'ريم القحطاني',
        occasion: 'مناسبة عائلية',
        rating: 5,
        text: 'أكثر شي عجبني إنها طازجة مب مجمدة، بانت بالطعم. صارت مخبزي الثابت لكل مناسبة.',
        visible: true,
      },
    ],
  },

  // EventsSection.tsx:8-13,22-34,73-83
  events: {
    eyebrow: 'تجهيز المناسبات',
    title: 'مناسبتك تستحق',
    titleAccent: 'طاولة لا تُنسى.',
    lede: 'من أول فكرة حتى آخر ضيف — نصمّم ونجهّز ونوصّل ونرتّب حلويات مناسبتك بالكامل، فتستمتع أنت باللحظة ونتكفّل نحن بالباقي.',
    items: [
      {
        label: 'طاولات الحلا الفاخرة',
        tag: 'الأكثر طلباً',
        size: 'hero',
        image: img('https://images.unsplash.com/photo-1729875749490-cb5984d780ec?auto=format&fit=crop&w=900&h=900&q=85'),
        visible: true,
      },
      {
        label: 'مناسبات الشركات',
        tag: '',
        size: 'wide',
        image: img('https://images.unsplash.com/photo-1677676700414-ff5d6302a978?auto=format&fit=crop&w=900&h=500&q=85'),
        visible: true,
      },
      {
        label: 'أعراس وخطوبة',
        tag: '',
        size: 'small',
        image: img('https://images.unsplash.com/photo-1670529775317-d744808e7f17?auto=format&fit=crop&w=500&h=500&q=85'),
        visible: true,
      },
      {
        label: 'استقبال المواليد',
        tag: '',
        size: 'small',
        image: img('https://images.unsplash.com/photo-1637059395246-8fd86872d596?auto=format&fit=crop&w=500&h=500&q=85'),
        visible: true,
      },
    ],
    cta: {
      title: 'جاهزون لمناسبتك القادمة',
      subtitle: 'توصيل وتنسيق داخل جازان',
      label: 'ابدأ تجهيز مناسبتك',
    },
  },

  // BranchesSection.tsx:6-9,18-28 — الرقم (٠١/٠٢) يُشتقّ من الترتيب، لا يُكتب.
  branches: {
    eyebrow: 'قريبون منك في جازان',
    title: 'فرعان.',
    titleAccent: 'نفس النكهة الأصيلة.',
    lede: 'زُرنا في صبيا أو أبو عريش، أو اختر الاستلام من الفرع عند إتمام طلبك ووفّر رسوم التوصيل.',
    items: [
      {
        city: 'صبيا',
        area: 'طريق الملك عبدالعزيز، حي الصفا',
        hours: 'يومياً ٩ص – ١٢م',
        phone: '٠١٧ ٣٦٠ ٠٠٠٠',
        phoneHref: 'tel:+966173600000',
        mapUrl: 'https://maps.google.com/?q=Sabya+Jazan',
        image: img('https://images.unsplash.com/photo-1571942948809-74637bfc59b9?auto=format&fit=crop&w=800&h=900&q=85'),
        visible: true,
      },
      {
        city: 'أبو عريش',
        area: 'شارع الملك فهد، بجوار الميدان',
        hours: 'يومياً ٩ص – ١٢م',
        phone: '٠١٧ ٣١٠ ٠٠٠٠',
        phoneHref: 'tel:+966173100000',
        mapUrl: 'https://maps.google.com/?q=Abu+Arish+Jazan',
        image: img('https://images.unsplash.com/photo-1711672284661-bd70e38f31b2?auto=format&fit=crop&w=800&h=900&q=85'),
        visible: true,
      },
    ],
  },

  // StorefrontSections.tsx:128-134,140-141
  faq: {
    eyebrow: 'قبل ما تطلب',
    title: 'الأسئلة الشائعة',
    items: [
      {
        q: 'كم يحتاج تجهيز الطلب من وقت؟',
        a: 'الطلبات الجاهزة نوصلها في نفس اليوم إذا طلبت قبل ٣ مساءً. التورتات المخصصة تحتاج من ٢٤ إلى ٤٨ ساعة.',
        visible: true,
      },
      {
        q: 'هل التوصيل متاح خارج جازان؟',
        a: 'حالياً نوصّل داخل مدينة جازان فقط، ونعمل على التوسّع لمدن أخرى قريباً.',
        visible: true,
      },
      {
        q: 'هل أقدر أطلب تورتة بنكهة أو تصميم خاص؟',
        a: 'أكيد! من قسم «صمم تورتتك» أرسل لنا التفاصيل ونتواصل معك لتأكيد التصميم والسعر.',
        visible: true,
      },
      {
        q: 'ما هي طرق الدفع المتاحة؟',
        a: 'نقبل مدى، فيزا، ماستركارد، آبل باي، بالإضافة إلى التقسيط عبر تابي.',
        visible: true,
      },
      {
        q: 'هل التورتات مناسبة للحساسية الغذائية؟',
        a: 'نوفّر خيارات خالية من المكسرات عند الطلب. يرجى ذكر أي حساسية في ملاحظات الطلب.',
        visible: true,
      },
    ],
  },

  giftBox: {},
};

/* ── واصفات المحرِّر ───────────────────────────────────────────────────── */

const ICON_OPTIONS = [
  { value: 'truck', label: 'شاحنة توصيل' },
  { value: 'star', label: 'نجمة' },
  { value: 'clock', label: 'ساعة' },
  { value: 'camera', label: 'كاميرا' },
  { value: 'sparkles', label: 'بريق' },
  { value: 'gift', label: 'هدية' },
  { value: 'cake', label: 'كيكة' },
  { value: 'partyPopper', label: 'احتفال' },
  { value: 'sun', label: 'شمس' },
  { value: 'mapPin', label: 'موقع' },
  { value: 'phone', label: 'هاتف' },
  { value: 'shoppingBag', label: 'حقيبة تسوق' },
  { value: 'wand', label: 'عصا سحرية' },
  { value: 'chefHat', label: 'قبعة شيف' },
  { value: 'heart', label: 'قلب' },
  { value: 'checkCircle', label: 'علامة صح' },
] as const;

const trustFields = [
  { name: 'text', kind: 'text', label: 'النص' },
  { name: 'icon', kind: 'select', label: 'الأيقونة', options: ICON_OPTIONS },
] as const;

export const SECTION_REGISTRY: Record<SectionKey, SectionDescriptor> = {
  marquee: {
    key: 'marquee',
    label: 'الشريط المتحرك',
    hint: 'العبارات التي تمرّ أعلى الصفحة.',
    managedBy: { label: 'التسويق', path: '/marketing' },
    fields: [],
  },

  hero: {
    key: 'hero',
    label: 'الواجهة الرئيسية',
    hint: 'الصورة الكبيرة أعلى الصفحة، والعنوان والوصف والأزرار فوقها.',
    fields: [
      { name: 'image', kind: 'image', label: 'صورة الخلفية' },
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'textarea', label: 'العنوان الرئيسي' },
      { name: 'lede', kind: 'textarea', label: 'الوصف' },
      { name: 'primaryCta', kind: 'cta', label: 'الزر الأساسي' },
      { name: 'secondaryCta', kind: 'cta', label: 'الزر الثانوي' },
      {
        name: 'seal.text',
        kind: 'textarea',
        label: 'الختم الذهبي',
        hint: 'كل سطر في سطر منفصل.',
      },
      { name: 'seal.visible', kind: 'toggle', label: 'إظهار الختم الذهبي' },
      {
        name: 'trust',
        kind: 'list',
        label: 'شارات الثقة',
        itemNoun: 'شارة',
        itemTitleField: 'text',
        itemFields: [...trustFields],
        newItem: () => ({ text: '', icon: 'star', visible: true }),
      },
      {
        name: 'featuredPick.eyebrow',
        kind: 'text',
        label: 'عنوان بطاقة «اختيار هذا الأسبوع»',
        hint: 'المنتج نفسه يأتي تلقائياً من أول منتج متوفّر بترتيب العرض.',
      },
      { name: 'featuredPick.visible', kind: 'toggle', label: 'إظهار بطاقة الاختيار' },
    ],
  },

  customCake: {
    key: 'customCake',
    label: 'استوديو التصميم',
    hint: 'نصوص قسم «صمّم كيكتك». الكيكات المعروضة تأتي من كتالوج تصميم الكيك.',
    dataDriven: true,
    autoHides: true,
    fields: [
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      { name: 'titleAccent', kind: 'text', label: 'تكملة العنوان (بلون مميّز)' },
      { name: 'lede', kind: 'textarea', label: 'الوصف' },
      {
        name: 'trust',
        kind: 'list',
        label: 'نقاط الثقة',
        itemNoun: 'نقطة',
        itemTitleField: 'text',
        itemFields: [...trustFields],
        newItem: () => ({ text: '', icon: 'sparkles', visible: true }),
      },
      { name: 'cta', kind: 'cta', label: 'الزر' },
    ],
  },

  seasonal: {
    key: 'seasonal',
    label: 'التشكيلة الموسمية',
    hint: 'شريط الموسم. المنتجات تأتي من المنتجات المعلَّمة بموسم.',
    managedBy: { label: 'التسويق', path: '/marketing' },
    dataDriven: true,
    autoHides: true,
    fields: [],
  },

  offerBanner: {
    key: 'offerBanner',
    label: 'بانر العرض',
    hint: 'شريط العرض الترويجي ورمز الخصم المعلن فيه.',
    managedBy: { label: 'التسويق', path: '/marketing' },
    autoHides: true,
    fields: [],
  },

  occasions: {
    key: 'occasions',
    label: 'تصفّح حسب المناسبة',
    hint: 'بطاقات المناسبات. رتّبها بالسحب — الترتيب هنا هو الترتيب على الصفحة.',
    fields: [
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      { name: 'lede', kind: 'textarea', label: 'الوصف' },
      {
        name: 'items',
        kind: 'list',
        label: 'البطاقات',
        itemNoun: 'بطاقة',
        itemTitleField: 'title',
        itemFields: [
          { name: 'title', kind: 'text', label: 'العنوان' },
          { name: 'desc', kind: 'text', label: 'الوصف' },
          { name: 'count', kind: 'number', label: 'عدد التصاميم' },
          { name: 'icon', kind: 'select', label: 'الأيقونة', options: ICON_OPTIONS },
          { name: 'image', kind: 'image', label: 'الصورة' },
          {
            name: 'target',
            kind: 'select',
            label: 'الوجهة عند الضغط',
            options: CTA_TARGETS,
          },
          {
            name: 'size',
            kind: 'select',
            label: 'حجم البطاقة',
            options: [
              { value: 'small', label: 'صغيرة (عمود واحد)' },
              { value: 'wide', label: 'عريضة (عمودان)' },
            ],
          },
          { name: 'featured', kind: 'toggle', label: 'بطاقة مميّزة («الأكثر طلباً»)' },
        ],
        newItem: () => ({
          title: '',
          desc: '',
          count: 0,
          icon: 'cake',
          image: { url: '', alt: '' },
          target: '#shop',
          size: 'small',
          featured: false,
          visible: true,
        }),
      },
    ],
  },

  shop: {
    key: 'shop',
    label: 'شبكة المنتجات',
    hint: 'نصوص قسم «تسوق التورتات». المنتجات وتصنيفاتها تأتي من إدارة المنتجات.',
    dataDriven: true,
    fields: [
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      { name: 'note', kind: 'textarea', label: 'الملاحظة الجانبية' },
      { name: 'ctaLabel', kind: 'text', label: 'نص زر «عرض كل المنتجات»' },
    ],
  },

  combos: {
    key: 'combos',
    label: 'الكومبوهات',
    hint: 'نصوص قسم الباقات. الباقات نفسها تُدار من المنتجات ← الكومبوهات.',
    dataDriven: true,
    autoHides: true,
    fields: [
      { name: 'badge', kind: 'text', label: 'الشارة العلوية' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      { name: 'titleAccent', kind: 'text', label: 'تكملة العنوان (بلون مميّز)' },
      { name: 'lede', kind: 'textarea', label: 'الوصف' },
    ],
  },

  reviews: {
    key: 'reviews',
    label: 'آراء العملاء',
    hint: 'الشهادات المعروضة في الشريط الداكن.',
    fields: [
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      { name: 'ratingLabel', kind: 'text', label: 'سطر متوسط التقييم' },
      {
        name: 'items',
        kind: 'list',
        label: 'الشهادات',
        itemNoun: 'شهادة',
        itemTitleField: 'name',
        itemFields: [
          { name: 'name', kind: 'text', label: 'الاسم' },
          { name: 'occasion', kind: 'text', label: 'المناسبة' },
          { name: 'rating', kind: 'number', label: 'التقييم (١–٥)' },
          { name: 'text', kind: 'textarea', label: 'النص' },
        ],
        newItem: () => ({ name: '', occasion: '', rating: 5, text: '', visible: true }),
      },
    ],
  },

  events: {
    key: 'events',
    label: 'تجهيز المناسبات',
    hint: 'نصوص القسم وبلاطات معرض البينتو.',
    fields: [
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      { name: 'titleAccent', kind: 'text', label: 'تكملة العنوان (بلون مميّز)' },
      { name: 'lede', kind: 'textarea', label: 'الوصف' },
      {
        name: 'items',
        kind: 'list',
        label: 'بلاطات المعرض',
        itemNoun: 'بلاطة',
        itemTitleField: 'label',
        itemFields: [
          { name: 'label', kind: 'text', label: 'العنوان' },
          { name: 'tag', kind: 'text', label: 'الشارة (اختياري)' },
          { name: 'image', kind: 'image', label: 'الصورة' },
          {
            name: 'size',
            kind: 'select',
            label: 'حجم البلاطة',
            options: [
              { value: 'hero', label: 'كبيرة (مربع ٢×٢)' },
              { value: 'wide', label: 'عريضة (عمودان)' },
              { value: 'small', label: 'صغيرة (عمود واحد)' },
            ],
          },
        ],
        newItem: () => ({ label: '', tag: '', size: 'small', image: { url: '', alt: '' }, visible: true }),
      },
      { name: 'cta.title', kind: 'text', label: 'عنوان شريط الدعوة' },
      { name: 'cta.subtitle', kind: 'text', label: 'سطر شريط الدعوة' },
      { name: 'cta.label', kind: 'text', label: 'نص زر شريط الدعوة' },
    ],
  },

  branches: {
    key: 'branches',
    label: 'فروعنا',
    hint: 'بطاقات الفروع كما تظهر للزبون. الترقيم (٠١، ٠٢) يُحسب تلقائياً.',
    fields: [
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      { name: 'titleAccent', kind: 'text', label: 'تكملة العنوان (بلون مميّز)' },
      { name: 'lede', kind: 'textarea', label: 'الوصف' },
      {
        name: 'items',
        kind: 'list',
        label: 'الفروع',
        itemNoun: 'فرع',
        itemTitleField: 'city',
        itemFields: [
          { name: 'city', kind: 'text', label: 'المدينة' },
          { name: 'area', kind: 'text', label: 'العنوان' },
          { name: 'hours', kind: 'text', label: 'ساعات العمل' },
          { name: 'phone', kind: 'text', label: 'الهاتف (كما يُعرض)' },
          { name: 'phoneHref', kind: 'text', label: 'رابط الاتصال', hint: 'مثال: tel:+966173600000' },
          { name: 'mapUrl', kind: 'text', label: 'رابط الخريطة' },
          { name: 'image', kind: 'image', label: 'صورة الفرع' },
        ],
        newItem: () => ({
          city: '',
          area: '',
          hours: '',
          phone: '',
          phoneHref: '',
          mapUrl: '',
          image: { url: '', alt: '' },
          visible: true,
        }),
      },
    ],
  },

  faq: {
    key: 'faq',
    label: 'الأسئلة الشائعة',
    hint: 'الأسئلة وإجاباتها. أول سؤال مرئي يكون مفتوحاً عند فتح الصفحة.',
    fields: [
      { name: 'eyebrow', kind: 'text', label: 'السطر العلوي' },
      { name: 'title', kind: 'text', label: 'العنوان' },
      {
        name: 'items',
        kind: 'list',
        label: 'الأسئلة',
        itemNoun: 'سؤال',
        itemTitleField: 'q',
        itemFields: [
          { name: 'q', kind: 'text', label: 'السؤال' },
          { name: 'a', kind: 'textarea', label: 'الإجابة' },
        ],
        newItem: () => ({ q: '', a: '', visible: true }),
      },
    ],
  },

  giftBox: {
    key: 'giftBox',
    label: 'صندوق الهدية',
    hint: 'الهدية الترحيبية أسفل الصفحة ورمز خصمها.',
    managedBy: { label: 'التسويق', path: '/marketing' },
    autoHides: true,
    fields: [],
  },
};

/* ── الدمج والتحقّق ────────────────────────────────────────────────────── */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * يدمج محتوى الصفّ فوق القيم الافتراضية ثم يتحقّق منه.
 *
 * الدمج **سطحيّ عن قصد**: مفاتيح المستوى الأول كائنات أو مصفوفات كاملة يحرّرها
 * المدير كوحدة واحدة. دمج عميق كان سيجعل حذف عنصر من قائمة مستحيلاً — عنصر
 * القائمة الافتراضي سيعود في كل مرة.
 *
 * وعند فشل التحقّق نعود إلى الافتراضي بدل الرمي: قسم أُضيف في الشفرة قبل أن
 * يصله صفّه في القاعدة، أو حقل جديد لم تعرفه بيانات قديمة، يجب أن يظهر بمحتواه
 * الأصلي — لا أن يُفرغ الصفحة الرئيسية.
 */
export function resolveContent<K extends SectionKey>(key: K, raw: unknown): SectionContent[K] {
  const defaults = SECTION_DEFAULTS[key];
  const merged = isPlainObject(raw) ? { ...defaults, ...raw } : defaults;
  const parsed = SECTION_SCHEMAS[key].safeParse(merged);
  return (parsed.success ? parsed.data : defaults) as SectionContent[K];
}

/** ترتيب الظهور الافتراضي — مصدر `display_order` في بذرة الهجرة. */
export const DEFAULT_ORDER: Record<SectionKey, number> = SECTION_KEYS.reduce(
  (acc, key, i) => ({ ...acc, [key]: i + 1 }),
  {} as Record<SectionKey, number>,
);
