import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, EyeOff, Info, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SECTION_REGISTRY } from '@/lib/homepage/schema';
import type { SectionKey } from '@/lib/homepage/types';
import type { AdminSection } from '@/hooks/useHomepageAdmin';
import { ScaledPreview } from './ScaledPreview';

interface SectionCanvasProps {
  section: AdminSection;
  position: number;
  total: number;
  /** عرض جهاز المعاينة بالبكسل. */
  viewportWidth: number;
  isEditing: boolean;
  /** يشرح لماذا لن يظهر القسم رغم أنه مُفعَّل. */
  emptyReason?: string;
  /** القسم كما يرسمه المتجر تماماً — من `sectionRenderers`. */
  children: ReactNode;
  /** نموذج التحرير، يُعرض إلى جانب المعاينة عند فتحه. */
  editor: ReactNode;
  onEdit: () => void;
  onToggleVisible: (isVisible: boolean) => void;
  onMove: (direction: -1 | 1) => void;
}

/**
 * قسم واحد على سطح التحرير: شريط تحكّم، ثم القسم نفسه كما يراه الزبون.
 *
 * الترتيب بزرَّي سهم لا بالسحب: البطاقات هنا ترتفع إلى مئات البكسلات (الواجهة
 * وحدها ٧٣٠)، وسحب بطاقة بهذا الطول عبر قائمة يعني إمساكها وتمرير الصفحة في آن.
 * السهمان أدقّ، ويعملان باللمس وبلوحة المفاتيح بلا شيء إضافي.
 */
export function SectionCanvas({
  section,
  position,
  total,
  viewportWidth,
  isEditing,
  emptyReason,
  children,
  editor,
  onEdit,
  onToggleVisible,
  onMove,
}: SectionCanvasProps) {
  const label = SECTION_REGISTRY[section.key].label;
  const ref = useRef<HTMLElement>(null);

  // فتح المحرِّر يُغيّر تخطيط البطاقة تحت المؤشّر مباشرة؛ بلا هذا التمرير قد
  // يفتح المدير قسماً أسفل الشاشة فلا يرى شيئاً تغيّر.
  useEffect(() => {
    if (isEditing) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isEditing]);

  return (
    <section
      ref={ref}
      aria-label={label}
      className={`overflow-hidden rounded-xl border bg-card transition-colors ${
        isEditing ? 'border-primary ring-1 ring-primary' : ''
      }`}
    >
      <header className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-background text-[11px] font-bold text-muted-foreground">
          {position}
        </span>
        <h3 className="text-sm font-bold">{label}</h3>

        {!section.isVisible && (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <EyeOff className="size-3" />
            مخفي
          </Badge>
        )}
        {section.isVisible && emptyReason && (
          <Badge variant="outline" className="border-warning/40 text-warning-foreground">
            لا يوجد محتوى
          </Badge>
        )}
        {!section.isPristine && <span className="text-[11px] text-muted-foreground">مُعدَّل</span>}

        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`تحريك ${label} لأعلى`}
            className="size-8"
            disabled={position === 1}
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`تحريك ${label} لأسفل`}
            className="size-8"
            disabled={position === total}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </Button>

          <Switch
            checked={section.isVisible}
            onCheckedChange={onToggleVisible}
            aria-label={`إظهار ${label}`}
            className="mx-1"
          />

          <Button type="button" variant={isEditing ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={onEdit}>
            <Pencil className="size-3.5" />
            تحرير
          </Button>
        </div>
      </header>

      {section.isVisible && emptyReason && (
        <p className="flex items-start gap-2 border-b bg-warning/10 px-4 py-2.5 text-xs text-warning-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {emptyReason}
        </p>
      )}

      <div className={isEditing ? 'grid gap-0 lg:grid-cols-[24rem_1fr]' : ''}>
        {isEditing && (
          <div className="max-h-[38rem] overflow-y-auto border-b p-4 lg:border-b-0 lg:border-e">{editor}</div>
        )}

        <div className="relative min-w-0 bg-background">
          {/* `store-surface` فلتر صور المتجر — المعاينة تستحقّ نفس المعالجة */}
          <div className={`store-surface ${section.isVisible ? '' : 'opacity-40 grayscale'}`}>
            <ScaledPreview width={viewportWidth}>{children}</ScaledPreview>
          </div>

          {/*
            حاجب فوق المعاينة: يمنع أزرار المتجر الحقيقية من العمل داخل اللوحة
            (زرّ «أضف للسلة» هنا كان سيضيف فعلاً)، ويجعل القسم كلّه هدفاً واحداً
            للنقر يفتح محرِّره. عند التحرير يبقى حاجزاً بلا فعل.
          */}
          {isEditing ? (
            <div className="absolute inset-0" aria-hidden />
          ) : (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`تحرير ${label}`}
              className="absolute inset-0 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            />
          )}
        </div>
      </div>
    </section>
  );
}
