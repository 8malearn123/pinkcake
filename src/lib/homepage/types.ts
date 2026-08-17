/**
 * أنواع «إدارة الصفحة الرئيسية» — خالية من zod ومن React ومن supabase.
 *
 * الفصل مقصود: `schema.ts` يستورد من هنا ولا يحدث العكس، فتبقى هذه الملفات
 * قابلة للاستيراد من الطبقة التجريبية ومن الاختبارات بلا سلسلة تبعيّات.
 */

/** مفاتيح الأقسام — نفس ترتيب الظهور الافتراضي على `/`. */
export const SECTION_KEYS = [
  'marquee',
  'hero',
  'customCake',
  'seasonal',
  'occasions',
  'offerBanner',
  'shop',
  'combos',
  'reviews',
  'events',
  'branches',
  'faq',
  'giftBox',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}

/**
 * الأيقونات المسموح بها في المحتوى المُحرَّر.
 *
 * قائمة مغلقة لا اسم lucide حرّ: المحتوى يأتي من قاعدة البيانات، واستيراد
 * أيقونة باسم قادم من صفّ في الجدول يعني إمّا حزمة lucide كاملة في الحزمة
 * النهائية أو انهيار عند اسم خاطئ.
 */
export const ICON_KEYS = [
  'truck',
  'star',
  'clock',
  'camera',
  'sparkles',
  'gift',
  'cake',
  'partyPopper',
  'sun',
  'mapPin',
  'phone',
  'shoppingBag',
  'wand',
  'chefHat',
  'heart',
  'checkCircle',
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/**
 * وجهات الأزرار: ما يبدأ بـ `#` تمرير إلى قسم في نفس الصفحة، وما يبدأ بـ `/`
 * انتقال بالمُوجِّه. قائمة مغلقة كي لا يكتب أحد رابطاً خارجياً في زرّ داخلي.
 */
export const CTA_TARGETS = [
  { value: '#shop', label: 'قسم «تسوق التورتات»' },
  { value: '#custom', label: 'قسم «صمّم كيكتك»' },
  { value: '#seasonal', label: 'قسم «التشكيلة الموسمية»' },
  { value: '#combos', label: 'قسم «الكومبوهات»' },
  { value: '#events', label: 'قسم «تجهيز المناسبات»' },
  { value: '#branches', label: 'قسم «فروعنا»' },
  { value: '#faq', label: 'قسم «الأسئلة الشائعة»' },
  { value: '/shop', label: 'صفحة كل المنتجات' },
  { value: '/customize', label: 'صفحة تصميم كيكة' },
  { value: '/custom-cakes', label: 'صفحة التصاميم الجاهزة' },
  { value: '/events', label: 'صفحة تجهيز المناسبات' },
  { value: '/contact', label: 'صفحة تواصل معنا' },
] as const;

export type CtaTarget = (typeof CTA_TARGETS)[number]['value'];

/** صفّ الجدول كما تعيده الدالتان `get_homepage_*`. */
export interface HomepageSectionRow {
  key: SectionKey;
  is_visible: boolean;
  display_order: number;
  content: Record<string, unknown>;
}

/* ── واصفات الحقول التي يبني منها المحرِّر نموذجه ────────────────────────── */

export type FieldKind = 'text' | 'textarea' | 'image' | 'cta' | 'number' | 'select' | 'toggle' | 'list';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDescriptor {
  /** مسار داخل `content` بنقاط، مثل `image.url`. */
  name: string;
  kind: FieldKind;
  label: string;
  hint?: string;
  /** لـ `select` فقط. */
  options?: readonly SelectOption[];
  /** لـ `list` فقط: حقول العنصر الواحد، وعنوانه في الطيّ، وشكل العنصر الجديد. */
  itemFields?: FieldDescriptor[];
  itemTitleField?: string;
  itemNoun?: string;
  newItem?: () => Record<string, unknown>;
}

export interface SectionDescriptor {
  key: SectionKey;
  /** اسم القسم في لوحة المدير. */
  label: string;
  /** سطر يشرح ما الذي يتحكّم به هذا القسم. */
  hint: string;
  /**
   * نصّ هذا القسم يملكه قسم آخر من اللوحة.
   *
   * الشريط المتحرّك وبانر العرض وصندوق الهدية وشريط الموسم محتواها ترويجيّ
   * مؤقّت — رموز خصم وتواريخ بداية ونهاية — فمالكها «التسويق». وتبقى هنا لأن
   * **ترتيبها وإظهارها** بنية الصفحة لا محتواها، وهذه ملك هذه الشاشة. حقلان
   * لنفس النصّ في شاشتين هو كيف يُنشر عرض منتهٍ.
   */
  managedBy?: { label: string; path: string };
  /**
   * عناصر القسم تأتي من بيانات حيّة (المنتجات، الكومبوهات، كتالوج الكيك) لا من
   * المحتوى المُحرَّر — المحرِّر يقول ذلك بدل أن يعرض قائمة عناصر ميّتة.
   */
  dataDriven?: boolean;
  /**
   * القسم يُخفي نفسه أصلاً حين لا توجد بيانات. مفتاح الإظهار يستطيع أن يحذفه،
   * ولا يستطيع أن يُظهره فارغاً — لوحة المدير تعرض «لا يوجد محتوى» عندها.
   */
  autoHides?: boolean;
  fields: FieldDescriptor[];
}
