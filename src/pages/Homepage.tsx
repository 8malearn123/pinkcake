import { useCallback, useMemo, useState } from 'react';
import { ExternalLink, LayoutTemplate, Monitor, Smartphone } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, ErrorState, LoadingState } from '@/components/ds';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SectionCanvas } from '@/components/homepage/SectionCanvas';
import { SectionEditor } from '@/components/homepage/SectionEditor';
import { sectionRenderers } from '@/components/store/sectionRenderers';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import {
  useHomepageSections,
  useReorderHomepageSections,
  useResetHomepageSection,
  useUpdateHomepageSection,
} from '@/hooks/useHomepageAdmin';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import { useCombos } from '@/hooks/useCombos';
import { useCatalogSession } from '@/hooks/useCatalogSession';
import { useStorefrontPromos } from '@/hooks/useStorefrontPromos';
import { useSettings } from '@/contexts/SettingsContext';
import { resolveCombos } from '@/lib/combos';
import { galleryCakes } from '@/lib/cakeSelect';
import { previewContent } from '@/lib/homepage/preview';
import { SECTION_DEFAULTS, type SectionContent } from '@/lib/homepage/schema';
import type { SectionKey } from '@/lib/homepage/types';

/** عرضا المعاينة. الجوال ٣٩٠ هو المقاس الذي يُدقَّق عليه التصميم في هذا المستودع. */
const VIEWPORTS = {
  desktop: { width: 1280, label: 'حاسوب', icon: Monitor },
  mobile: { width: 390, label: 'جوال', icon: Smartphone },
} as const;

const noop = () => {};

export default function Homepage() {
  const { settings } = useSettings();
  const { sections, isLoading, error, refetch } = useHomepageSections();
  const updateSection = useUpdateHomepageSection();
  const reorderSections = useReorderHomepageSections();
  const resetSection = useResetHomepageSection();

  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>('desktop');
  const [editingKey, setEditingKey] = useState<SectionKey | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pending, setPending] = useState<{ next: SectionKey | null } | null>(null);
  /** قيم النموذج المفتوح، ترد مع كل ضغطة مفتاح فتتبعها المعاينة. */
  const [draft, setDraft] = useState<unknown>(null);

  /**
   * المعاينة ترسم ببيانات المتجر الحقيقية: المنتجات والباقات والكيكات نفسها
   * التي يراها الزبون. وهي أيضاً ما يجيب عن «لماذا لن يظهر هذا القسم».
   */
  const { data: products } = usePublicStoreProducts();
  const { combos: comboDefs, urlFor: comboUrlFor } = useCombos();
  const { status: catalogStatus, catalog, urlFor } = useCatalogSession();
  const { ticker, slot, offers } = useStorefrontPromos();

  const designCakes = useMemo(() => galleryCakes(catalog, urlFor), [catalog, urlFor]);
  const seasonal = useMemo(() => (products ?? []).filter((p) => !!p.season), [products]);
  const combos = useMemo(
    () => resolveCombos(comboDefs, products, isSoldOut, comboUrlFor),
    [comboDefs, products, comboUrlFor],
  );
  const categories = useMemo(
    () => ['الكل', ...new Set((products ?? []).map((p) => p.category).filter(Boolean) as string[])],
    [products],
  );

  const emptyReasons = useMemo(() => {
    const out: Partial<Record<SectionKey, string>> = {};
    if (seasonal.length === 0) {
      out.seasonal = 'لا توجد منتجات معلَّمة بموسم، فلن يظهر هذا القسم للزبون. علّم منتجاً بموسم من إدارة المنتجات.';
    }
    if (combos.length === 0) {
      out.combos = 'لا توجد باقات مفعّلة، فلن يظهر هذا القسم للزبون. أضف باقة من المنتجات ← الكومبوهات.';
    }
    if (catalogStatus !== 'loading' && designCakes.length === 0) {
      out.customCake = 'لا توجد كيكات قابلة للتصميم، فلن يظهر هذا القسم للزبون. أضف كيكة من «تصميم الكيك».';
    }

    // الأقسام الترويجية لها مفتاح إظهار ثانٍ في «التسويق»، والمفتاحان يجتمعان
    // بـ«و» لا بـ«أو». بلا هذه الأسطر يقلب المدير المفتاح هنا ثم يفتح المتجر
    // فلا يجد شيئاً، ولا شيء يقول له أين المفتاح الآخر.
    if (ticker.length === 0) {
      out.marquee = 'لا توجد عبارات مفعّلة للشريط المتحرك في «التسويق»، فلن يظهر للزبون.';
    }
    if (!slot('seasonal_band')) {
      out.seasonal = 'لا يوجد شريط موسم مفعّل في «التسويق»، فلن يظهر هذا القسم للزبون.';
    }
    if (!offers.showOfferBanner || !slot('offer_banner')) {
      out.offerBanner = 'بانر العرض غير مفعّل في «التسويق»، فلن يظهر للزبون.';
    }
    if (!offers.showGiftBox || !slot('gift_box')) {
      out.giftBox = 'صندوق الهدية غير مفعّل في «التسويق»، فلن يظهر للزبون.';
    }
    return out;
  }, [seasonal, combos, designCakes, catalogStatus, ticker, slot, offers]);

  const savedContent = useMemo(() => {
    const out = {} as SectionContent;
    for (const s of sections) (out as Record<string, unknown>)[s.key] = s.content;
    return out;
  }, [sections]);

  /**
   * القسم قيد التحرير يُرسم من مسودّة النموذج، وبقيّة الأقسام من المحفوظ. هذا
   * هو كل سرّ «التحرير المباشر»: نفس دوال الرسم، ومصدر محتوى واحد يتبدّل.
   */
  const contentOf = useCallback(
    <K extends SectionKey>(key: K): SectionContent[K] =>
      editingKey === key && draft
        ? previewContent(key, draft)
        : // الاحتياط للحظة ما قبل وصول الصفوف: بلا هذا تُمرَّر `undefined` بينما
          // النوع يَعِد بمحتوى، وتُرسم الأقسام بلا نصّ لإطار واحد.
          savedContent[key] ?? SECTION_DEFAULTS[key],
    [editingKey, draft, savedContent],
  );

  const renderers = useMemo(
    () =>
      sectionRenderers({
        contentOf,
        listed: products ?? [],
        categories,
        category: 'الكل',
        onCategoryChange: noop,
        query: '',
        seasonal,
        combos,
        designCakes,
        catalogLoading: catalogStatus === 'loading',
        featured: (products ?? []).find((p) => !isSoldOut(p)),
        storeName: settings.storeName,
        // كل قسم يُرسم في بطاقته الخاصة، فلا ترويسة فوق الواجهة تُسحب خلفها.
        heroIsFirst: false,
        renderCard: (product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            inCart={0}
            isFavorite={false}
            onAdd={noop}
            onRemoveOne={noop}
            onToggleFavorite={noop}
            onView={noop}
          />
        ),
        onCta: noop,
        onNavigate: noop,
        onPickCake: noop,
        onViewFeatured: noop,
        onAddCombo: noop,
      }),
    [contentOf, products, categories, seasonal, combos, designCakes, catalogStatus, settings.storeName],
  );

  const openEditor = (key: SectionKey | null) => {
    if (isDirty && key !== editingKey) setPending({ next: key });
    else {
      setEditingKey(key);
      setDraft(null);
    }
  };

  const discardAndSwitch = () => {
    setEditingKey(pending?.next ?? null);
    setDraft(null);
    setIsDirty(false);
    setPending(null);
  };

  const move = (key: SectionKey, direction: -1 | 1) => {
    const order = sections.map((s) => s.key);
    const from = order.indexOf(key);
    const to = from + direction;
    if (from === -1 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    reorderSections.mutate(order);
  };

  const handleDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), []);
  const handleLiveChange = useCallback((content: unknown) => setDraft(content), []);

  const Viewport = VIEWPORTS[viewport].icon;

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          title="الصفحة الرئيسية"
          description="الصفحة كما يراها الزبون — اضغط أي قسم لتحريره، وحرّك الأقسام أو أخفها من شريطها"
          icon={LayoutTemplate}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border p-0.5">
                {(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map((key) => {
                  const Icon = VIEWPORTS[key].icon;
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant={viewport === key ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-1.5"
                      aria-pressed={viewport === key}
                      onClick={() => setViewport(key)}
                    >
                      <Icon className="size-4" />
                      {VIEWPORTS[key].label}
                    </Button>
                  );
                })}
              </div>
              <Button type="button" variant="outline" className="gap-2" asChild>
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  فتح المتجر
                </a>
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <LoadingState label="جاري تحميل الصفحة الرئيسية..." />
        ) : error ? (
          <ErrorState
            title="تعذّر تحميل الصفحة الرئيسية"
            description={(error as Error).message}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Viewport className="size-3.5" />
              المعاينة بعرض {VIEWPORTS[viewport].width} بكسل، مُصغَّرة لتتّسع هنا.
            </p>

            {sections.map((section, i) => (
              <SectionCanvas
                key={section.key}
                section={section}
                position={i + 1}
                total={sections.length}
                viewportWidth={VIEWPORTS[viewport].width}
                isEditing={editingKey === section.key}
                emptyReason={emptyReasons[section.key]}
                onEdit={() => openEditor(editingKey === section.key ? null : section.key)}
                onToggleVisible={(isVisible) => updateSection.mutate({ key: section.key, isVisible })}
                onMove={(direction) => move(section.key, direction)}
                editor={
                  editingKey === section.key ? (
                    <SectionEditor
                      // إعادة التركيب عند تبديل القسم أو بعد الإرجاع للأصل:
                      // النموذج يُملأ من `defaultValues` مرّة واحدة فقط.
                      key={`${section.key}-${section.isPristine}`}
                      section={section}
                      isSaving={updateSection.isPending}
                      emptyReason={emptyReasons[section.key]}
                      onDirtyChange={handleDirtyChange}
                      onLiveChange={handleLiveChange}
                      onClose={() => openEditor(null)}
                      onSave={(key, content) => updateSection.mutate({ key, content })}
                      onReset={(key) => resetSection.mutate(key)}
                    />
                  ) : null
                }
              >
                {renderers[section.key]()}
              </SectionCanvas>
            ))}
          </div>
        )}

        <AlertDialog open={pending !== null} onOpenChange={() => setPending(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تغييرات غير محفوظة</AlertDialogTitle>
              <AlertDialogDescription>
                لديك تعديلات لم تُحفظ في هذا القسم. الانتقال إلى قسم آخر سيتجاهلها.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>البقاء هنا</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={discardAndSwitch}
              >
                تجاهل التغييرات
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
