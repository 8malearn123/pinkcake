import { useEffect, useId, useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { RiyalSymbol } from '@/components/ui/riyal';
import { EmptyState } from '@/components/ds';
import { LocalImageDrop } from '@/components/cakeDesign/LocalImageDrop';
import { useCakeCatalog } from '@/contexts/CakeCatalogContext';
import { deletedByMoveLevel, imagesAtOrBelowLevel, imagesUnderValue } from '@/lib/cakeCatalog/catalog';
import type { CatalogLevel, CatalogValue } from '@/lib/cakeCatalog/types';

const DESTRUCTIVE_ACTION = 'bg-destructive text-destructive-foreground hover:bg-destructive/90';

interface ValueCardProps {
  levelIndex: number;
  value: CatalogValue;
}

function ValueCard({ levelIndex, value }: ValueCardProps) {
  const { catalog, urlFor, renameValue, setValuePrice, removeValue, setValueReference } =
    useCakeCatalog();
  const priceId = useId();
  const [nameDraft, setNameDraft] = useState(value.name);
  const [priceDraft, setPriceDraft] = useState(String(value.priceDelta));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setNameDraft(value.name), [value.name]);
  useEffect(() => setPriceDraft(String(value.priceDelta)), [value.priceDelta]);

  const commitName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === value.name) {
      setNameDraft(value.name);
      return;
    }
    const ok = await renameValue(levelIndex, value.id, trimmed);
    if (!ok) setNameDraft(value.name);
  };

  const commitPrice = () => {
    const parsed = Number(priceDraft);
    const next = priceDraft.trim() === '' || !Number.isFinite(parsed) ? 0 : parsed;
    setPriceDraft(String(next));
    if (next !== value.priceDelta) void setValuePrice(levelIndex, value.id, next);
  };

  const doomed = imagesUnderValue(catalog, levelIndex, value.id);

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <LocalImageDrop
          variant="slot"
          label={`صورة مرجعية لـ ${value.name}`}
          previewUrl={urlFor(value.referenceImageId)}
          onSelect={(file) => {
            void setValueReference(levelIndex, value.id, file);
          }}
          onClear={() => void setValueReference(levelIndex, value.id, null)}
        />
        <Input
          value={nameDraft}
          aria-label={`اسم الخيار ${value.name}`}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={() => void commitName()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') setNameDraft(value.name);
          }}
          className="h-9 flex-1 min-w-0 font-medium"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`حذف ${value.name}`}
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor={priceId} className="text-xs text-muted-foreground shrink-0">
          فرق السعر
        </Label>
        <Input
          id={priceId}
          type="number"
          step="0.5"
          dir="ltr"
          className="text-start h-9 tabular-nums"
          value={priceDraft}
          onChange={(event) => setPriceDraft(event.target.value)}
          onBlur={commitPrice}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        <RiyalSymbol className="text-muted-foreground shrink-0" />
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {value.name}؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف هذا الخيار من كل الكيكات، ومعه{' '}
              <span dir="ltr" className="tabular-nums">
                {doomed}
              </span>{' '}
              صورة. لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className={DESTRUCTIVE_ACTION}
              onClick={() => void removeValue(levelIndex, value.id)}
            >
              احذف الخيار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export interface LevelSectionProps {
  level: CatalogLevel;
  index: number;
  levelCount: number;
}

/**
 * مستوى واحد من تصنيف التصميم: اسمه وترتيبه وخياراته.
 *
 * المستويات والخيارات عامة — كل تعديل هنا يسري على كل الكيكات، ولذلك تُصرّح
 * نوافذ التأكيد بعدد الصور التي ستُفقد قبل أي حذف أو إعادة ترتيب.
 */
export function LevelSection({ level, index, levelCount }: LevelSectionProps) {
  const { catalog, renameLevel, removeLevel, reorderLevel, addValue } = useCakeCatalog();
  const nameId = useId();
  const newValueId = useId();
  const [nameDraft, setNameDraft] = useState(level.name);
  const [valueDraft, setValueDraft] = useState('');
  const [pendingMove, setPendingMove] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setNameDraft(level.name), [level.name]);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === level.name) {
      setNameDraft(level.name);
      return;
    }
    void renameLevel(index, trimmed);
  };

  const requestMove = (to: number) => {
    if (to < 0 || to >= levelCount) return;
    if (deletedByMoveLevel(catalog, index, to) === 0) {
      void reorderLevel(index, to);
      return;
    }
    setPendingMove(to);
  };

  const submitValue = async () => {
    const trimmed = valueDraft.trim();
    if (!trimmed) return;
    const ok = await addValue(index, trimmed);
    if (ok) setValueDraft('');
  };

  const movedDoomed = pendingMove === null ? 0 : deletedByMoveLevel(catalog, index, pendingMove);
  const levelDoomed = imagesAtOrBelowLevel(catalog, index);

  return (
    <section className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span dir="ltr" className="text-primary font-bold tabular-nums text-lg">
          {String(index + 1).padStart(2, '0')}
        </span>
        <Label htmlFor={nameId} className="sr-only">
          اسم المستوى
        </Label>
        <Input
          id={nameId}
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') setNameDraft(level.name);
          }}
          className="h-9 w-full max-w-[220px] font-semibold"
        />
        <span className="text-xs text-muted-foreground">
          <span dir="ltr" className="tabular-nums">
            {level.values.length}
          </span>{' '}
          خيارات
        </span>

        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="نقل المستوى لأعلى"
            disabled={index === 0}
            onClick={() => requestMove(index - 1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="نقل المستوى لأسفل"
            disabled={index === levelCount - 1}
            onClick={() => requestMove(index + 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>
        </div>
      </div>

      {level.values.length === 0 ? (
        <EmptyState
          title="لا خيارات في هذا المستوى"
          description="أضف أول خيار حتى يظهر هذا المستوى للعملاء."
          className="py-6"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {level.values.map((value) => (
            <ValueCard key={value.id} levelIndex={index} value={value} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        الصورة المرجعية تساعد الفريق على تمييز الخيار بسرعة، وتظهر للعميل صورة مصغّرة داخل الخيار.
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Label htmlFor={newValueId} className="sr-only">
          خيار جديد في {level.name}
        </Label>
        <Input
          id={newValueId}
          value={valueDraft}
          placeholder="اسم الخيار الجديد"
          onChange={(event) => setValueDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submitValue();
            }
          }}
          className="h-9 w-full max-w-[220px]"
        />
        <Button type="button" variant="outline" onClick={() => void submitValue()}>
          أضف خياراً
        </Button>
        <span className="text-xs text-muted-foreground">يُضاف إلى كل الكيكات</span>
      </div>

      <AlertDialog
        open={pendingMove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تغيير ترتيب المستويات</AlertDialogTitle>
            <AlertDialogDescription>
              سيؤدي هذا إلى حذف{' '}
              <span dir="ltr" className="tabular-nums">
                {movedDoomed}
              </span>{' '}
              صورة لم يعد لها معنى بعد تغيير الترتيب. لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className={DESTRUCTIVE_ACTION}
              onClick={() => {
                if (pendingMove !== null) void reorderLevel(index, pendingMove);
                setPendingMove(null);
              }}
            >
              غيّر الترتيب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مستوى {level.name}؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف هذا المستوى من كل الكيكات، ومعه{' '}
              <span dir="ltr" className="tabular-nums">
                {levelDoomed}
              </span>{' '}
              صورة. لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className={DESTRUCTIVE_ACTION} onClick={() => void removeLevel(index)}>
              احذف المستوى
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
