import { useId, useState } from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ds';
import { LevelSection } from '@/components/cakeDesign/LevelSection';
import { useCakeCatalog } from '@/contexts/CakeCatalogContext';

/**
 * محرّر التصنيف العام: المستويات وخياراتها.
 *
 * كل ما في هذه الشاشة مشترك بين الكيكات جميعاً، وعدد الصور المطلوب لكل كيكة هو
 * حاصل ضرب عدد الخيارات في كل مستوى — لذلك يُعرض العدد المتوقّع فوق المحرّر مباشرة.
 */
export function LevelsTab() {
  const { catalog, perCakeTotal, addLevel } = useCakeCatalog();
  const newLevelId = useId();
  const [draft, setDraft] = useState('');

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await addLevel(trimmed);
    setDraft('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          المطلوب لكل كيكة حالياً:{' '}
          <span dir="ltr" className="tabular-nums font-semibold text-foreground">
            {perCakeTotal}
          </span>{' '}
          صورة
        </p>
        <p className="text-xs text-muted-foreground">
          المستويات وخياراتها مشتركة بين كل الكيكات — أي تعديل هنا يسري عليها جميعاً.
        </p>
      </div>

      {catalog.levels.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="ابدأ بإضافة المستويات"
          description="المستويات هي خطوات التصميم التي يمر بها العميل — مثل الشكل ثم النكهة."
        />
      ) : (
        <div className="space-y-6">
          {catalog.levels.map((level, i) => (
            <LevelSection
              key={level.id}
              level={level}
              index={i}
              levelCount={catalog.levels.length}
            />
          ))}
        </div>
      )}

      <section className="rounded-2xl border-2 border-dashed border-border p-6 space-y-3">
        <div className="space-y-1">
          <Label htmlFor={newLevelId} className="text-base font-semibold">
            مستوى جديد
          </Label>
          <p className="text-xs text-muted-foreground">
            كل مستوى جديد يضاعف عدد الصور المطلوبة لكل كيكة بعدد خياراته.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            id={newLevelId}
            value={draft}
            placeholder="مثال: لون الكريمة"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
            className="w-full max-w-[260px]"
          />
          <Button
            type="button"
            className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity"
            onClick={() => void submit()}
          >
            أضف مستوى
          </Button>
        </div>
      </section>
    </div>
  );
}
