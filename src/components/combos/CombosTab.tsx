import { useMemo, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Gift, Info, Plus, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { EmptyState, ErrorState, LoadingState, StatTile } from '@/components/ds';
import { useCombos } from '@/hooks/useCombos';
import { useProducts } from '@/hooks/useProducts';
import { resolvableMembers } from '@/lib/combos';
import { MIN_COMBO_MEMBERS, type ComboItem } from '@/lib/combosCatalog/types';
import { CombosTable } from './CombosTable';
import { ComboForm } from './ComboForm';
import type { PickableProduct } from './ComboProductPicker';

/**
 * «الكومبوهات» — the merchandising bundles on the storefront home page.
 *
 * Everything here is browser-local (see the notice under the toolbar): the combo
 * set lives in this browser's localStorage and hero photos in its IndexedDB, the
 * same arrangement «تصميم الكيك» uses. Products, by contrast, come from the real
 * catalogue — a combo only ever references product ids.
 */
export function CombosTab() {
  const {
    status,
    error,
    combos,
    heroSrcFor,
    createCombo,
    saveCombo,
    removeCombo,
    clearHero,
    makeBest,
    setActive,
    reorder,
    reload,
    resetAll,
  } = useCombos();

  const { data: productRows } = useProducts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Track the id, not the row: the open form must follow the live combo so that
  // clearing its hero (a mutation) updates the preview instead of showing the
  // photo it had when the dialog opened.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => (selectedId ? (combos.find((combo) => combo.id === selectedId) ?? null) : null),
    [combos, selectedId],
  );

  const products: PickableProduct[] = useMemo(
    () =>
      (productRows ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        image_url: row.image_url,
        category: row.category,
      })),
    [productRows],
  );

  const stats = useMemo(() => {
    const visible = combos.filter((combo) => combo.isActive).length;
    const broken = combos.filter(
      (combo) => resolvableMembers(combo, products) < MIN_COMBO_MEMBERS,
    ).length;
    return { total: combos.length, visible, hidden: combos.length - visible, broken };
  }, [combos, products]);

  // Search filters the view only; dragging is disabled while it is active so a
  // reorder can never be computed from a partial list.
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return combos;
    return combos.filter((combo) => combo.name.includes(q) || combo.tagline.includes(q));
  }, [combos, query]);

  const openNew = () => {
    setSelectedId(null);
    setIsFormOpen(true);
  };

  const openEdit = (combo: ComboItem) => {
    setSelectedId(combo.id);
    setIsFormOpen(true);
  };

  if (status === 'loading') return <LoadingState label="جاري تحميل الكومبوهات..." />;
  if (status === 'error') {
    return (
      <ErrorState
        title="تعذّر تحميل الكومبوهات"
        description={error ?? 'حدث خطأ غير متوقع'}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="إجمالي الكومبوهات" value={stats.total} icon={Gift} tone="primary" />
        <StatTile label="ظاهر في المتجر" value={stats.visible} icon={Eye} tone="success" />
        <StatTile label="مخفي" value={stats.hidden} icon={EyeOff} tone="neutral" />
        <StatTile
          label="يحتاج مراجعة"
          value={stats.broken}
          icon={AlertTriangle}
          tone={stats.broken > 0 ? 'destructive' : 'neutral'}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث عن كومبو..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ps-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <RotateCcw className="size-4" /> استعادة الافتراضي
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>استعادة الكومبوهات الافتراضية؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيُحذف كل كومبو أنشأته وكل صورة رفعتها في هذا المتصفح، وترجع الكومبوهات الثلاثة
                  الأصلية. لا يمكن التراجع.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void resetAll()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  استعادة
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={openNew} className="gap-2">
            <Plus className="size-4" /> إضافة كومبو
          </Button>
        </div>
      </div>

      {/* Same honesty the cake studio shows: this data does not leave the browser. */}
      <p className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs leading-6 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          الكومبوهات وصورها محفوظة في هذا المتصفح فقط — لن يراها زميل على جهاز آخر، وستُفقد عند مسح
          بيانات التصفح. المنتجات المرتبطة بها تأتي من الكتالوج الحقيقي.
        </span>
      </p>

      {combos.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="لا توجد كومبوهات"
          description="أنشئ باقة توفير تجمع عدة منتجات بسعر مخفّض وتظهر في الصفحة الرئيسية."
          action={
            <Button onClick={openNew} className="gap-2">
              <Plus className="size-4" /> إضافة كومبو
            </Button>
          }
        />
      ) : (
        <CombosTable
          combos={filtered}
          products={products}
          heroSrcFor={heroSrcFor}
          onEdit={openEdit}
          onDelete={(id) => void removeCombo(id)}
          onToggleActive={(id, isActive) => void setActive(id, isActive)}
          onMakeBest={(id) => void makeBest(id)}
          onReorder={(ids) => {
            if (query.trim()) return; // never reorder from a filtered view
            void reorder(ids);
          }}
        />
      )}

      <ComboForm
        key={selected?.id ?? 'new'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        combo={selected}
        products={products}
        currentHeroUrl={selected?.heroImageId ? heroSrcFor(selected) : undefined}
        onClearHero={selected ? () => void clearHero(selected.id) : undefined}
        onSubmit={(draft, heroFile) =>
          selected ? saveCombo(selected.id, draft, heroFile) : createCombo(draft, heroFile)
        }
      />
    </div>
  );
}
