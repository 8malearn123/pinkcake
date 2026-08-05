import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, StatTile, EmptyState, LoadingState, ErrorState, SkeletonList, SectionCard, SectionHeading } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RiyalSymbol } from '@/components/ui/riyal';
import { ORDER_STATUS_LABELS, OrderStatus } from '@/types/order';
import {
  Palette,
  Type,
  Layers,
  MousePointerClick,
  FormInput,
  Component,
  Sparkles,
  Crown,
  MessageSquareHeart,
  ClipboardList,
  Clock,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RotateCcw,
  Inbox,
} from 'lucide-react';

/* ── عيّنات الألوان: تُقرأ مباشرة من متغيرات CSS حتى تعكس أي تخصيص من الإعدادات ── */

interface TokenSwatch {
  token: string;
  cssVar: string;
  usage: string;
}

const CORE_TOKENS: TokenSwatch[] = [
  { token: 'primary', cssVar: '--primary', usage: 'التوتي: أزرار، روابط، تركيز' },
  { token: 'accent', cssVar: '--accent', usage: 'خلفية التمرير الهادئة (hover) — ليست الذهبي' },
  { token: 'secondary', cssVar: '--secondary', usage: 'خلفيات أزرار ثانوية ورقائق' },
  { token: 'muted', cssVar: '--muted', usage: 'خلفيات خافتة وفواصل' },
  { token: 'background', cssVar: '--background', usage: 'كريمي — خلفية الصفحات' },
  { token: 'card', cssVar: '--card', usage: 'خلفية البطاقات' },
  { token: 'border', cssVar: '--border', usage: 'الحدود والفواصل' },
  { token: 'destructive', cssVar: '--destructive', usage: 'حذف وأخطاء فقط' },
];

const FEEDBACK_TOKENS: TokenSwatch[] = [
  { token: 'success', cssVar: '--success', usage: 'نجاح، مدفوع، مكتمل' },
  { token: 'warning', cssVar: '--warning', usage: 'انتظار وتنبيه' },
  { token: 'info', cssVar: '--info', usage: 'معلومة، قيد التنفيذ' },
  { token: 'destructive', cssVar: '--destructive', usage: 'خطأ، رفض، حذف' },
];

const BRAND_TOKENS: TokenSwatch[] = [
  { token: 'primary', cssVar: '--primary', usage: 'التوتي — لون العلامة الأساسي' },
  { token: 'rose', cssVar: '--rose', usage: 'وردي أفتح: العناوين التمهيدية والسطر الثاني' },
  { token: 'gold', cssVar: '--gold', usage: 'الذهبي — الخيوط والشارات واللمسات الفاخرة' },
  { token: 'gold-deep', cssVar: '--gold-deep', usage: 'ذهبي غامق: نص الذهبي على الكريمي' },
  { token: 'blush', cssVar: '--blush', usage: 'خدّي (خلفيات ناعمة)' },
  { token: 'seasonal', cssVar: '--seasonal', usage: 'كهرماني موسمي (تشكيلة الصيف)' },
  { token: 'berry-deep', cssVar: '--berry-deep', usage: 'توتي داكن: نطاقات الآراء والتذييل' },
  { token: 'berry-ink', cssVar: '--berry-ink', usage: 'حبر توتي: تظليل الصور' },
];

const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

/* شريحة اسم class — دائماً LTR حتى لا تتكسر في واجهة RTL */
function ClassChip({ children }: { children: string }) {
  return (
    <code dir="ltr" className="inline-block font-mono text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function Swatch({ swatch }: { swatch: TokenSwatch }) {
  return (
    <div className="space-y-2">
      <div
        className="h-14 rounded-xl border border-border shadow-sm"
        style={{ background: `hsl(var(${swatch.cssVar}))` }}
      />
      <div>
        <ClassChip>{swatch.token}</ClassChip>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{swatch.usage}</p>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  const [motionKey, setMotionKey] = useState(0);

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl">
        <PageHeader
          icon={Palette}
          title="دليل التصميم"
          description="المرجع الحي لهوية Cake & Bloom — نفس الإحساس والنبرة في كل شاشة (المتجر ولوحة الموظفين). التفاصيل الكاملة في DESIGN_SYSTEM.md"
        />

        {/* ─────────── الألوان ─────────── */}
        <SectionCard title="الألوان" icon={Palette}>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              كل الألوان من الرموز الدلالية (tokens) حصراً — ممنوع استخدام ألوان Tailwind الخام مثل{' '}
              <ClassChip>text-blue-600</ClassChip>. الرموز قابلة للتخصيص من الإعدادات، فأي لون مكتوب يدوياً
              سيكسر التخصيص والوضع الليلي.
            </p>

            <div>
              <h3 className="font-semibold mb-3">الرموز الأساسية</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CORE_TOKENS.map((s) => <Swatch key={s.token} swatch={s} />)}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">ألوان الحالة والتنبيه</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {FEEDBACK_TOKENS.map((s) => <Swatch key={s.token} swatch={s} />)}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">ألوان العلامة</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {BRAND_TOKENS.map((s) => <Swatch key={s.token} swatch={s} />)}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">التدرّجات</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-14 rounded-xl gradient-pink shadow-warm" />
                  <ClassChip>gradient-pink</ClassChip>
                </div>
                <div className="space-y-2">
                  <div className="h-14 rounded-xl gradient-blush-warm" />
                  <ClassChip>gradient-blush-warm</ClassChip>
                </div>
                <div className="space-y-2">
                  <div className="h-14 rounded-xl gradient-rose-deep" />
                  <ClassChip>gradient-rose-deep</ClassChip>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ─────────── حالات الطلب ─────────── */}
        <SectionCard title="شارات حالة الطلب" icon={ClipboardList}>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            حالة الطلب تُعرض دائماً عبر <ClassChip>StatusBadge</ClassChip> — لا تُنشئ شارة حالة يدوياً.
          </p>
          <div className="flex flex-wrap gap-3">
            {ALL_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </SectionCard>

        {/* ─────────── الخطوط ─────────── */}
        <SectionCard title="الخطوط والنصوص" icon={Type}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold">عنوان صفحة — كيكة الفراولة الملكية</h1>
                <ClassChip>text-3xl font-bold</ClassChip>
              </div>
              <div>
                <h2 className="text-xl font-bold">عنوان قسم — أحدث الطلبات</h2>
                <ClassChip>text-xl font-bold</ClassChip>
              </div>
              <div>
                <p className="font-semibold">عنوان بطاقة أو حقل — اسم العميل</p>
                <ClassChip>font-semibold</ClassChip>
              </div>
              <div>
                <p>نص أساسي — نخبز كل كيكة بحب، ونوصلها لباب بيتك طازجة.</p>
                <ClassChip>text-base (Cairo)</ClassChip>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نص ثانوي — آخر تحديث قبل 5 دقائق</p>
                <ClassChip>text-sm text-muted-foreground</ClassChip>
              </div>
              <div>
                <p className="font-sans text-2xl font-bold" dir="ltr">1,250.00 SAR — #ORD-2418</p>
                <ClassChip>font-sans (Work Sans للأرقام والأكواد)</ClassChip>
              </div>
              <div>
                <p className="font-display-latin text-3xl">Pink Cake — baked with love</p>
                <ClassChip>font-display-latin (للعناوين اللاتينية الاحتفالية فقط)</ClassChip>
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground space-y-1 leading-relaxed">
              <p>• الخط الافتراضي للنصوص العربية: Cairo (مضبوط على body).</p>
              <p>• لا تستخدم تباعد أحرف سالب أو مائل (italic) مع النص العربي.</p>
              <p>• الأرقام والمبالغ والأكواد: أرقام غربية 0-9 مع <span dir="ltr" className="font-mono text-xs">dir="ltr"</span> عند الحاجة.</p>
            </div>
          </div>
        </SectionCard>

        {/* ─────────── الأسطح والظلال ─────────── */}
        <SectionCard title="الأسطح والظلال والزوايا" icon={Layers}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5">
              <p className="font-semibold mb-1">بطاقة زجاجية</p>
              <ClassChip>glass-card rounded-2xl</ClassChip>
              <p className="text-xs text-muted-foreground mt-2">السطح الافتراضي للوحات الموظفين</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft-lift">
              <p className="font-semibold mb-1">بطاقة مرتفعة</p>
              <ClassChip>shadow-soft-lift</ClassChip>
              <p className="text-xs text-muted-foreground mt-2">للمحتوى البارز في المتجر</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-rose-glow">
              <p className="font-semibold mb-1">توهّج وردي</p>
              <ClassChip>shadow-rose-glow</ClassChip>
              <p className="text-xs text-muted-foreground mt-2">للأبطال (Hero) والعروض فقط</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            الزوايا: البطاقات <ClassChip>rounded-2xl</ClassChip> — العناصر الداخلية والأزرار{' '}
            <ClassChip>rounded-xl</ClassChip> / <ClassChip>rounded-lg</ClassChip> — الشارات{' '}
            <ClassChip>rounded-full</ClassChip>.
          </p>
        </SectionCard>

        {/* ─────────── الأزرار ─────────── */}
        <SectionCard title="الأزرار" icon={MousePointerClick}>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5 me-2" />
                الإجراء الرئيسي (CTA)
              </Button>
              <Button>افتراضي</Button>
              <Button variant="secondary">ثانوي</Button>
              <Button variant="outline">محدد</Button>
              <Button variant="ghost">شبح</Button>
              <Button variant="destructive">حذف</Button>
              <Button variant="link">رابط</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">كبير</Button>
              <Button size="default">عادي</Button>
              <Button size="sm">صغير</Button>
              <Button size="icon" aria-label="إضافة"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground space-y-1 leading-relaxed">
              <p>• زر CTA المتدرّج (<ClassChip>gradient-pink text-white shadow-warm</ClassChip>): واحد فقط لكل شاشة، للإجراء الأهم.</p>
              <p>• <ClassChip>destructive</ClassChip> للحذف والإلغاء النهائي فقط، ومعه تأكيد دائماً.</p>
              <p>• الأيقونة قبل النص بهامش <ClassChip>me-2</ClassChip> (الواجهة RTL).</p>
            </div>
          </div>
        </SectionCard>

        {/* ─────────── حقول الإدخال ─────────── */}
        <SectionCard title="حقول الإدخال" icon={FormInput}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="ds-name">اسم العميل</Label>
              <Input id="ds-name" placeholder="مثال: نورة العتيبي" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-phone">رقم الجوال</Label>
              <Input id="ds-phone" dir="ltr" className="text-left" placeholder="05xxxxxxxx" />{/* rtl-ok: LTR phone field */}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ds-notes">ملاحظات</Label>
              <Textarea id="ds-notes" placeholder="اكتب أي تفاصيل إضافية للطلب..." />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ds-switch" defaultChecked />
              <Label htmlFor="ds-switch">تفعيل الإشعارات</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="ds-check" defaultChecked />
              <Label htmlFor="ds-check">أوافق على الشروط</Label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            التسمية فوق الحقل دائماً. الحقول الرقمية (جوال، مبالغ، أكواد) تأخذ{' '}
            <span dir="ltr" className="font-mono text-xs">dir="ltr"</span> مع محاذاة يسار.
          </p>
        </SectionCard>

        {/* ─────────── مكوّنات النظام ─────────── */}
        <SectionCard title="مكوّنات النظام الموحّدة" icon={Component}>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-3">PageHeader — رأس كل صفحة</h3>
              <div className="border border-dashed border-border rounded-xl p-5">
                <PageHeader
                  icon={ChefHat}
                  title="المطبخ المركزي"
                  description="تابع الطلبات الجاهزة للتجهيز"
                  actions={
                    <Button className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity">
                      <Plus className="w-5 h-5 me-2" />
                      طلب جديد
                    </Button>
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">StatTile — بطاقات الإحصائيات (بالنغمات الدلالية)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatTile label="إجمالي الطلبات" value={128} icon={ClipboardList} tone="primary" />
                <StatTile label="بانتظار الاعتماد" value={7} icon={Clock} tone="warning" />
                <StatTile label="قيد التجهيز" value={12} icon={ChefHat} tone="info" />
                <StatTile label="مكتملة اليوم" value={34} icon={CheckCircle2} tone="success" trend={{ value: 12, isPositive: true }} />
                <StatTile label="متأخرة" value={2} icon={AlertTriangle} tone="destructive" />
                <StatTile label="بدون لون" value={56} icon={Inbox} tone="neutral" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">LoadingState — التحميل</h3>
                <div className="border border-dashed border-border rounded-xl">
                  <LoadingState label="جاري تحميل الطلبات..." />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">EmptyState — لا توجد بيانات</h3>
                <div className="border border-dashed border-border rounded-xl">
                  <EmptyState
                    icon={Inbox}
                    title="لا توجد طلبات بعد"
                    description="عندما يصل طلب جديد سيظهر هنا مباشرة"
                    action={<Button variant="outline">إنشاء طلب</Button>}
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">ErrorState — فشل التحميل (مع إعادة المحاولة)</h3>
                <div className="border border-dashed border-border rounded-xl">
                  <ErrorState onRetry={() => {}} />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Skeleton — هيكل التحميل</h3>
                <SkeletonList rows={2} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              كل قائمة أو منطقة تجلب بيانات يجب أن تغطّي الحالات الثلاث:{' '}
              <ClassChip>isLoading → LoadingState/Skeleton</ClassChip>،{' '}
              <ClassChip>isError → ErrorState (onRetry=refetch)</ClassChip>، والفراغ{' '}
              <ClassChip>EmptyState</ClassChip>.
            </p>

            <div>
              <h3 className="font-semibold mb-3">SectionHeading — فوق الجداول والمحتوى المُبطّق</h3>
              <div className="border border-dashed border-border rounded-xl p-5">
                <SectionHeading
                  title="آخر الطلبات"
                  action={<Button variant="link" className="p-0 h-auto">عرض الكل</Button>}
                />
                <div className="glass-card rounded-2xl p-6 text-sm text-muted-foreground">
                  ...جدول أو محتوى له بطاقته الخاصة...
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <h3 className="font-semibold w-full">Badge — وسوم عامة (غير حالات الطلب)</h3>
              <Badge>افتراضي</Badge>
              <Badge variant="secondary">ثانوي</Badge>
              <Badge variant="outline">محدد</Badge>
              <Badge variant="destructive">مرفوض</Badge>
            </div>
          </div>
        </SectionCard>

        {/* ─────────── الحركة ─────────── */}
        <SectionCard
          title="الحركة"
          icon={Sparkles}
          action={
            <Button variant="outline" size="sm" onClick={() => setMotionKey((k) => k + 1)}>
              <RotateCcw className="w-4 h-4 me-2" />
              إعادة التشغيل
            </Button>
          }
        >
          <div key={motionKey} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="animate-fade-in bg-muted rounded-xl p-4 text-center">
              <ClassChip>animate-fade-in</ClassChip>
            </div>
            <div className="animate-slide-in-up bg-muted rounded-xl p-4 text-center">
              <ClassChip>animate-slide-in-up</ClassChip>
            </div>
            <div className="animate-scale-in bg-muted rounded-xl p-4 text-center">
              <ClassChip>animate-scale-in</ClassChip>
            </div>
            <div className="animate-float bg-muted rounded-xl p-4 text-center">
              <ClassChip>animate-float</ClassChip>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground mt-4 space-y-1 leading-relaxed">
            <p>• الحركة الوظيفية (ظهور القوائم والبطاقات): قصيرة وهادئة ≤ 400ms مع ease-out.</p>
            <p>• الحركة الزخرفية (float، sparkle): للمتجر العام ولوزا فقط — ليست للوحات الموظفين.</p>
            <p>• القوائم تتدرّج بتأخير 50ms لكل صف كحد أقصى.</p>
          </div>
        </SectionCard>

        {/* ─────────── هوية لوزا ─────────── */}
        <SectionCard title="هوية لوزا الفرعية (ذهبي / كريمي / بني)" icon={Crown}>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            سوق لوزا له هوية مستقلة تُفعّل حصراً بتغليف الصفحة بـ <ClassChip>loza-theme</ClassChip> — لا
            تُستخدم ألوان لوزا خارج صفحات <span dir="ltr" className="font-mono text-xs">/loza</span> أبداً، والعكس صحيح.
          </p>
          <div className="loza-theme bg-background text-foreground rounded-2xl p-6 space-y-4 border border-border">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-loza-display text-3xl text-gradient-loza">لوزا</span>
              <Badge className="gradient-loza-gold text-accent border-0">الأكثر طلباً</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 rounded-xl gradient-loza-gold" />
              <div className="h-12 rounded-xl gradient-loza-header" />
              <div className="h-12 rounded-xl bg-card border border-border shadow-loza" />
            </div>
            <p className="text-sm">
              الخط: Tajawal — الزوايا أعرض (<ClassChip>--radius: 1rem</ClassChip>) — الظل ذهبي{' '}
              <ClassChip>shadow-loza</ClassChip>.
            </p>
          </div>
        </SectionCard>

        {/* ─────────── الصوت والنبرة ─────────── */}
        <SectionCard title="الصوت والنبرة" icon={MessageSquareHeart}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm leading-relaxed">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
              <p className="font-semibold text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> هكذا نتحدث
              </p>
              <p>«تم استلام طلبك، نجهّزه لك بكل حب 🎂»</p>
              <p>«عذراً، ما قدرنا نحفظ التعديل. جرّب مرة ثانية»</p>
              <p>«لا توجد طلبات بعد — عندما يصل طلب جديد سيظهر هنا»</p>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="font-semibold text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4" /> لا نتحدث هكذا
              </p>
              <p>«ERROR 500: فشلت العملية!!»</p>
              <p>«إدخال غير صالح» (بدون توضيح ماذا يفعل المستخدم)</p>
              <p>نبرة آمرة أو جافة: «أدخل البيانات فوراً»</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground mt-4 space-y-1 leading-relaxed">
            <p>• عربية فصحى مبسّطة، دافئة ومباشرة. جملة واحدة تكفي غالباً.</p>
            <p>• الإيموجي: مسموح بقطعة واحدة في لحظات الاحتفال للعميل (تم الطلب، اكتمل التسليم) — ممنوع في لوحات الموظفين والأخطاء.</p>
            <p>• المبالغ: <span dir="ltr" className="font-mono text-xs">1,250 <RiyalSymbol /></span> — التاريخ بالميلادي، والوقت بصيغة 12 ساعة (مساءً/صباحاً).</p>
            <p>• رسالة الخطأ تقول دائماً: ماذا حدث + ماذا يفعل المستخدم الآن.</p>
          </div>
        </SectionCard>
      </div>
    </MainLayout>
  );
}
