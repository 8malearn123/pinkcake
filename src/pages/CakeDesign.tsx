import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, CakeSlice, Images, Layers, Plus, RotateCcw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorState, LoadingState, PageHeader, StatTile } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AddCakeTab } from '@/components/cakeDesign/AddCakeTab';
import { LevelsTab } from '@/components/cakeDesign/LevelsTab';
import { LibraryTab } from '@/components/cakeDesign/LibraryTab';
import {
  CakeCatalogProvider,
  useCakeCatalog,
  type CakeDesignTab,
} from '@/contexts/CakeCatalogContext';
import { isReadyForCustomers } from '@/lib/cakeCatalog/catalog';

const TAB_VALUES: readonly CakeDesignTab[] = ['add', 'levels', 'library'];

function isCakeDesignTab(value: string | null): value is CakeDesignTab {
  return value !== null && (TAB_VALUES as readonly string[]).includes(value);
}

function CakeDesignContent() {
  const {
    status,
    error,
    catalog,
    fillHistogram,
    hasUrl,
    tab,
    setTab,
    reload,
    resetAll,
  } = useCakeCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const adoptedUrlTab = useRef(false);

  /* The tab lives in the context (LibraryTab jumps to «إضافة كيكة» via openCake),
     so the query string is a mirror of it: adopt a deep link once on mount, then
     follow the state. Search params never touch location.pathname, so the
     sidebar's exact-match active state is unaffected. */
  useEffect(() => {
    const requested = searchParams.get('tab');
    if (!adoptedUrlTab.current) {
      adoptedUrlTab.current = true;
      if (isCakeDesignTab(requested) && requested !== tab) {
        setTab(requested);
        return;
      }
    }
    if (requested === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, setTab, tab]);

  const readyCount = useMemo(
    () =>
      catalog.cakes.filter((cake) => isReadyForCustomers(catalog, cake, fillHistogram, hasUrl))
        .length,
    [catalog, fillHistogram, hasUrl],
  );

  return (
    // A file dropped outside a drop zone (or on one that is mid-save) must not
    // make the browser navigate away from the SPA to the image.
    <div
      className="space-y-8"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => event.preventDefault()}
    >
      <PageHeader
        title="تصميم الكيك"
        description="عرّف الكيكات ومستوياتها وارفع صورة كل تشكيلة"
        icon={CakeSlice}
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين البيانات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>إعادة تعيين مكتبة التصاميم؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيُحذف كل ما أضفته وترجع البيانات التجريبية. لا يمكن التراجع.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetAll()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  أعد التعيين
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <p className="text-sm text-muted-foreground">
        تُحفظ هذه المكتبة في هذا المتصفح فقط — لا تُشارك بين الأجهزة ولا مع بقية الفريق بعد.
      </p>

      {status === 'loading' ? (
        <LoadingState label="جارٍ تحضير مكتبة التصاميم…" />
      ) : status === 'error' ? (
        <ErrorState description={error ?? undefined} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-3">
            <StatTile label="الكيكات" value={catalog.cakes.length} icon={CakeSlice} tone="primary" />
            <StatTile
              label="الصور المحفوظة"
              value={catalog.images.length}
              icon={Images}
              tone="neutral"
            />
            <StatTile label="جاهزة للعملاء" value={readyCount} icon={BadgeCheck} tone="success" />
          </div>

          {/* dir="rtl" is required: Radix Tabs defaults to LTR, which flips both the
              trigger order and the arrow-key direction. */}
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as CakeDesignTab)}
            dir="rtl"
            className="w-full"
          >
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="add" className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة كيكة
              </TabsTrigger>
              <TabsTrigger value="levels" className="gap-2">
                <Layers className="w-4 h-4" />
                المستويات والخيارات
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-2">
                <Images className="w-4 h-4" />
                المكتبة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="mt-6">
              <AddCakeTab />
            </TabsContent>
            <TabsContent value="levels" className="mt-6">
              <LevelsTab />
            </TabsContent>
            <TabsContent value="library" className="mt-6">
              <LibraryTab />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

/**
 * استوديو تصميم الكيك — يعرّف المدير الكيكات ومستوياتها وصور كل تشكيلة.
 * البيانات محفوظة في هذا المتصفح فقط (CakeCatalogProvider).
 */
export default function CakeDesign() {
  return (
    <MainLayout>
      <CakeCatalogProvider>
        <CakeDesignContent />
      </CakeCatalogProvider>
    </MainLayout>
  );
}
