import { useMemo, useState } from 'react';
import { ImageIcon, Layers, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { RiyalSymbol } from '@/components/ui/riyal';
import { SectionCard } from '@/components/ds';
import { useCakeCatalog } from '@/contexts/CakeCatalogContext';
import { buildTreeRows, cakeCoverage, isValidNodePath, nodeKey } from '@/lib/cakeCatalog/catalog';
import { CatalogImg } from './CatalogImg';
import { LocalImageDrop } from './LocalImageDrop';
import { NodeDetailPanel } from './NodeDetailPanel';
import { VariantTree } from './VariantTree';

interface CakeWorkbenchProps {
  cakeId: string;
}

interface Draft {
  name: string;
  basePrice: string;
  serves: string;
  leadTime: string;
}

/**
 * طاولة عمل كيكة واحدة: بياناتها، نسبة اكتمال صورها، صورة العرض، وشجرة تشكيلاتها.
 */
export function CakeWorkbench({ cakeId }: CakeWorkbenchProps) {
  const {
    catalog,
    fillHistogram,
    urlFor,
    setTab,
    updateCakeInfo,
    removeCake,
    choosePreview,
    uploadPreview,
    saveVariantImage,
    addValue,
  } = useCakeCatalog();

  const cake = catalog.cakes.find((c) => c.id === cakeId);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());
  const [selectedPath, setSelectedPath] = useState<string[] | null>(null);
  const [missingOnly, setMissingOnly] = useState(false);
  const [pickingPreview, setPickingPreview] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => ({
    name: cake?.name ?? '',
    basePrice: String(cake?.basePrice ?? 0),
    serves: cake?.serves ?? '',
    leadTime: cake?.leadTime ?? '',
  }));

  const items = useMemo(
    () => buildTreeRows(catalog, cakeId, { expanded, missingOnly, hist: fillHistogram }),
    [catalog, cakeId, expanded, missingOnly, fillHistogram],
  );

  const cakeImages = useMemo(
    () =>
      catalog.images
        .filter((image) => image.cakeId === cakeId)
        .map((image) => ({
          image,
          label: image.path
            .map(
              (valueId, depth) =>
                catalog.levels[depth]?.values.find((v) => v.id === valueId)?.name ?? '',
            )
            .join(' · '),
        }))
        .sort((a, b) => a.image.path.length - b.image.path.length || a.label.localeCompare(b.label, 'ar')),
    [catalog.images, catalog.levels, cakeId],
  );

  if (!cake) return null;

  const coverage = cakeCoverage(catalog, cakeId, fillHistogram);
  const promptShow = pickingPreview || (coverage.complete && !cake.previewImageId);

  // Blurring an emptied field reverts to the saved value across the board —
  // note `Number('') === 0`, so the price branch must catch the empty string
  // BEFORE coercing or clearing the field would silently persist a 0 price.
  const commit = (patch: Partial<Draft>) => {
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) return setDraft((d) => ({ ...d, name: cake.name }));
      if (name !== cake.name) void updateCakeInfo(cakeId, { name });
      return;
    }
    if (patch.basePrice !== undefined) {
      const raw = patch.basePrice.trim();
      const basePrice = Number(raw);
      if (!raw || !Number.isFinite(basePrice) || basePrice < 0) {
        return setDraft((d) => ({ ...d, basePrice: String(cake.basePrice) }));
      }
      if (basePrice !== cake.basePrice) void updateCakeInfo(cakeId, { basePrice });
      return;
    }
    if (patch.serves !== undefined) {
      const serves = patch.serves.trim();
      if (!serves) return setDraft((d) => ({ ...d, serves: cake.serves }));
      if (serves !== cake.serves) void updateCakeInfo(cakeId, { serves });
      return;
    }
    if (patch.leadTime !== undefined) {
      const leadTime = patch.leadTime.trim();
      if (!leadTime) return setDraft((d) => ({ ...d, leadTime: cake.leadTime }));
      if (leadTime !== cake.leadTime) void updateCakeInfo(cakeId, { leadTime });
    }
  };

  const handleToggle = (key: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDropFile = async (path: string[], file: File) => {
    setBusyKey(nodeKey(cakeId, path));
    try {
      const ok = await saveVariantImage(cakeId, path, file);
      if (ok) setSelectedPath(path);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title={cake.name || 'كيكة بلا اسم'} icon={ImageIcon}>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor={`cake-name-${cakeId}`}>اسم الكيكة</Label>
              <Input
                id={`cake-name-${cakeId}`}
                value={draft.name}
                onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
                onBlur={() => commit({ name: draft.name })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cake-price-${cakeId}`} className="flex items-center gap-1">
                السعر الأساسي (<RiyalSymbol />)
              </Label>
              <Input
                id={`cake-price-${cakeId}`}
                dir="ltr"
                type="number"
                min="0"
                step="1"
                className="tabular-nums"
                value={draft.basePrice}
                onChange={(event) => setDraft((d) => ({ ...d, basePrice: event.target.value }))}
                onBlur={() => commit({ basePrice: draft.basePrice })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cake-serves-${cakeId}`}>تكفي</Label>
              <Input
                id={`cake-serves-${cakeId}`}
                placeholder="6–8"
                value={draft.serves}
                onChange={(event) => setDraft((d) => ({ ...d, serves: event.target.value }))}
                onBlur={() => commit({ serves: draft.serves })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cake-lead-${cakeId}`}>مدة التحضير</Label>
              <Input
                id={`cake-lead-${cakeId}`}
                placeholder="24 ساعة"
                value={draft.leadTime}
                onChange={(event) => setDraft((d) => ({ ...d, leadTime: event.target.value }))}
                onBlur={() => commit({ leadTime: draft.leadTime })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch id={`missing-only-${cakeId}`} checked={missingOnly} onCheckedChange={setMissingOnly} />
              <Label htmlFor={`missing-only-${cakeId}`}>الناقص فقط</Label>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  حذف الكيكة
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف «{cake.name}»</AlertDialogTitle>
                  <AlertDialogDescription>
                    ستُحذف الكيكة ومعها{' '}
                    <span dir="ltr" className="tabular-nums">
                      {cakeImages.length}
                    </span>{' '}
                    صورة من هذا المتصفح. لا يمكن التراجع.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void removeCake(cakeId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    احذف الكيكة
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-2">
            <Progress
              value={coverage.pct}
              className="h-2"
              aria-label={`اكتمال صور ${cake.name}`}
            />
            <div className="flex flex-wrap items-center gap-3">
              <span dir="ltr" className="text-sm text-muted-foreground tabular-nums">
                {coverage.filled}/{coverage.total}
              </span>
              <span className="text-sm text-muted-foreground">صورة</span>
              {coverage.complete ? (
                <Badge className="bg-success/10 text-success border-transparent">
                  اكتملت جميع الصور
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  ·{' '}
                  <span dir="ltr" className="tabular-nums">
                    {coverage.missing}
                  </span>{' '}
                  ناقصة
                </span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {promptShow ? (
        <SectionCard title="اختر صورة العرض">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              صورة العرض هي أول ما يراه العملاء — اختر واحدة من صور هذه الكيكة أو ارفع صورة جديدة.
            </p>

            <LocalImageDrop
              variant="row"
              label="ارفع صورة عرض جديدة"
              title="اسحب صورة العرض هنا أو اخترها"
              onSelect={async (file) => {
                const ok = await uploadPreview(cakeId, file);
                if (ok) setPickingPreview(false);
              }}
            />

            {cakeImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {cakeImages.map(({ image, label }) => (
                  <button
                    key={image.id}
                    type="button"
                    aria-label={label}
                    title={label}
                    onClick={() => {
                      void choosePreview(cakeId, image.id);
                      setPickingPreview(false);
                    }}
                    className="overflow-hidden rounded-xl border border-border transition-colors hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <CatalogImg imageId={image.id} alt={label} className="aspect-square w-full" />
                  </button>
                ))}
              </div>
            )}

            {cake.previewImageId && (
              <Button variant="ghost" size="sm" onClick={() => setPickingPreview(false)}>
                إبقاء الصورة الحالية
              </Button>
            )}
          </div>
        </SectionCard>
      ) : cake.previewImageId ? (
        <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <CatalogImg
            imageId={cake.previewImageId}
            alt={`صورة عرض ${cake.name}`}
            className="h-16 w-16 rounded-xl"
          />
          <span className="text-sm text-muted-foreground">تُعرض للعملاء أولاً</span>
          <Button variant="outline" size="sm" onClick={() => setPickingPreview(true)}>
            تغيير
          </Button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">
            لم تُختر صورة العرض — لن تظهر الكيكة للعملاء.
          </span>
          <Button variant="outline" size="sm" onClick={() => setPickingPreview(true)}>
            اختيار
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {catalog.levels.map((level, index) => `${index + 1}. ${level.name}`).join(' · ')}
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setTab('levels')}>
          <Layers className="h-4 w-4" />
          إدارة المستويات
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <SectionCard title="شجرة التشكيلات">
          <VariantTree
            items={items}
            levelCount={catalog.levels.length}
            selectedKey={selectedPath ? nodeKey(cakeId, selectedPath) : null}
            thumbUrlFor={(imageId) => urlFor(imageId)}
            onSelect={(_key, path) => setSelectedPath(path)}
            onToggle={handleToggle}
            onDropFile={(path, file) => void handleDropFile(path, file)}
            onAddValue={addValue}
            busyKey={busyKey}
          />
        </SectionCard>

        <div className="lg:sticky lg:top-6">
          <SectionCard title="العنصر">
            <NodeDetailPanel
              cakeId={cakeId}
              path={
                selectedPath && isValidNodePath(catalog, cakeId, selectedPath) ? selectedPath : null
              }
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
