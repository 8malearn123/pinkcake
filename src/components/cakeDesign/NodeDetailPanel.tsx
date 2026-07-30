import { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/riyal';
import { useCakeCatalog } from '@/contexts/CakeCatalogContext';
import {
  cakePriceForPath,
  imageAt,
  imageStorageKey,
  imagesUnderValue,
  isValidNodePath,
} from '@/lib/cakeCatalog/catalog';
import { CatalogImg } from './CatalogImg';
import { LocalImageDrop } from './LocalImageDrop';

export interface NodeDetailPanelProps {
  cakeId: string;
  path: string[] | null;
}

/**
 * لوحة العنصر المختار: صورته ومفتاح تخزينه وسعره، مع إدارة الخيار العام في آخر المسار.
 */
export function NodeDetailPanel({ cakeId, path }: NodeDetailPanelProps) {
  const { catalog, saveVariantImage, removeVariantImage, removeValue } = useCakeCatalog();
  const [busy, setBusy] = useState(false);

  // A cascade anywhere else (a deleted value, level or cake) can invalidate the
  // selection between renders, so the path is re-checked instead of trusted.
  if (!path || !isValidNodePath(catalog, cakeId, path)) {
    return <p className="text-sm text-muted-foreground py-6">اختر عنصراً من الشجرة لعرض صورته.</p>;
  }

  const cakeName = catalog.cakes.find((c) => c.id === cakeId)?.name ?? '';
  const valueNames = path.map(
    (valueId, depth) => catalog.levels[depth]?.values.find((v) => v.id === valueId)?.name ?? '',
  );
  const breadcrumb = [cakeName, ...valueNames].join(' · ');

  const image = imageAt(catalog, cakeId, path);
  const storageKey = imageStorageKey(cakeId, path);
  const price = cakePriceForPath(catalog, cakeId, path);

  const lastIndex = path.length - 1;
  const lastValueId = path[lastIndex];
  const lastValueName = valueNames[lastIndex];
  const lastLevelName = catalog.levels[lastIndex]?.name ?? '';
  const affectedImages = imagesUnderValue(catalog, lastIndex, lastValueId);

  const handleSelect = async (file: File) => {
    setBusy(true);
    try {
      await saveVariantImage(cakeId, path, file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="font-semibold leading-relaxed">{breadcrumb}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">سعر هذا المسار</span>
          <Price amount={price} className="font-semibold text-primary" />
        </div>
      </div>

      {image ? (
        <div className="space-y-4">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
            <CatalogImg imageId={image.id} alt={breadcrumb} className="h-full w-full" />
          </div>

          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="break-all">{image.fileName}</li>
            <li dir="ltr" className="tabular-nums">
              {image.width}×{image.height}
            </li>
            <li dir="ltr" className="tabular-nums">
              {Math.round(image.size / 1024)} KB
            </li>
            <li>{new Date(image.createdAt).toLocaleDateString('ar-SA')}</li>
          </ul>

          <LocalImageDrop
            variant="row"
            label="استبدال الصورة"
            title="اسحب صورة بديلة أو اخترها"
            busy={busy}
            onSelect={handleSelect}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                إزالة الصورة
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>إزالة الصورة</AlertDialogTitle>
                <AlertDialogDescription>
                  ستُحذف صورة «{breadcrumb}» من هذا المتصفح نهائياً، ويعود العنصر فارغاً. لا يمكن
                  التراجع.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void removeVariantImage(image.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  احذف الصورة
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <LocalImageDrop
          variant="block"
          label="أضف صورة لهذه التشكيلة"
          title="اسحب صورة هنا أو اخترها"
          busy={busy}
          onSelect={handleSelect}
        />
      )}

      <div className="space-y-1 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">مفتاح التخزين</p>
        <p dir="ltr" className="font-mono text-xs text-muted-foreground break-all">
          {storageKey}
        </p>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {lastLevelName} · {lastValueName}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            الخيارات عامة — أي تعديل عليه يسري على كل الكيكات.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              حذف الخيار من كل الكيكات
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف «{lastValueName}» من كل الكيكات</AlertDialogTitle>
              <AlertDialogDescription>
                سيُزال الخيار من مستوى «{lastLevelName}» في كل الكيكات، وستُحذف معه{' '}
                <span dir="ltr" className="tabular-nums">
                  {affectedImages}
                </span>{' '}
                صورة. لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void removeValue(lastIndex, lastValueId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                احذف الخيار
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
