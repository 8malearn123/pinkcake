import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Info, RotateCcw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
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
import { SECTION_REGISTRY, SECTION_SCHEMAS } from '@/lib/homepage/schema';
import type { SectionDescriptor, SectionKey } from '@/lib/homepage/types';
import type { AdminSection } from '@/hooks/useHomepageAdmin';
import { FieldRenderer } from './FieldRenderer';

interface SectionEditorProps {
  section: AdminSection;
  onSave: (key: SectionKey, content: unknown) => void;
  onReset: (key: SectionKey) => void;
  isSaving: boolean;
  /** يشرح لماذا لن يظهر القسم رغم أنه مُفعَّل — مصدره بيانات حيّة لا محتوى. */
  emptyReason?: string;
  /** ترفع حالة «فيه تعديلات غير محفوظة» كي تحرسها الصفحة عند تبديل القسم. */
  onDirtyChange?: (isDirty: boolean) => void;
  /** ترفع القيم مع كل ضغطة مفتاح كي تتبعها المعاينة الحيّة إلى جانب النموذج. */
  onLiveChange?: (content: unknown) => void;
  onClose: () => void;
}

/**
 * قسم نصّه ملك شاشة أخرى: نُحيل إليها بدل عرض نموذج فارغ. الترتيب والإظهار
 * يبقيان في شريط البطاقة، فالمدير لا يفقد شيئاً من التحكّم بالبنية.
 */
function ManagedElsewhere({
  descriptor,
  onClose,
}: {
  descriptor: SectionDescriptor & { managedBy: NonNullable<SectionDescriptor['managedBy']> };
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b pb-3">
        <p className="text-sm text-muted-foreground">{descriptor.hint}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`إغلاق ${descriptor.label}`}
          className="size-7 shrink-0"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        نصّ هذا القسم ورمز خصمه يُحرَّران من «{descriptor.managedBy.label}» — محتوى ترويجي له تاريخ
        بداية ونهاية، فمكانه هناك. الترتيب والإظهار يبقيان من شريط القسم بالأعلى.
      </p>

      <Button asChild className="w-full gap-2">
        <Link to={descriptor.managedBy.path}>
          الذهاب إلى «{descriptor.managedBy.label}»
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

/**
 * موزّع بلا خطّافات: الفرع المُدار في مكوّن مستقلّ كي لا يتغيّر عدد الخطّافات
 * بين قسم وآخر.
 */
export function SectionEditor(props: SectionEditorProps) {
  const descriptor = SECTION_REGISTRY[props.section.key];
  if (descriptor.managedBy) {
    return (
      <ManagedElsewhere
        descriptor={descriptor as SectionDescriptor & { managedBy: NonNullable<SectionDescriptor['managedBy']> }}
        onClose={props.onClose}
      />
    );
  }
  return <EditableSection {...props} />;
}

/**
 * نموذج القسم الواحد، مبنيّ من واصفات `SECTION_REGISTRY` ومتحقَّق منه بمخطّط
 * zod نفسه الذي يحرس المحتوى عند القراءة — فما يرفضه المحرِّر لا يمكن أن يصل
 * إلى الصفحة، وما يقبله لا يمكن أن يسقط لاحقاً إلى النصّ الأصلي بصمت.
 */
function EditableSection({
  section,
  onSave,
  onReset,
  isSaving,
  emptyReason,
  onDirtyChange,
  onLiveChange,
  onClose,
}: SectionEditorProps) {
  const descriptor = SECTION_REGISTRY[section.key];

  const form = useForm({
    resolver: zodResolver(SECTION_SCHEMAS[section.key]),
    defaultValues: section.content as Record<string, unknown>,
  });


  const { isDirty } = form.formState;
  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  // المعاينة المجاورة تتبع النموذج مع كل ضغطة مفتاح، لا عند الحفظ.
  const live = useWatch({ control: form.control });
  useEffect(() => onLiveChange?.(live), [live, onLiveChange]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          onSave(section.key, values);
          // إعادة ضبط القيم المُرسَلة كخطّ أساس جديد، وإلا بقي النموذج «متّسخاً»
          // بعد حفظ ناجح ولحذّر حارس التبديل من تعديلات لم تعد موجودة.
          form.reset(values as Record<string, unknown>);
        })}
        className="space-y-5"
      >
        <header className="flex items-start justify-between gap-3 border-b pb-3">
          <p className="text-sm text-muted-foreground">{descriptor.hint}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`إغلاق محرِّر ${descriptor.label}`}
            className="size-7 shrink-0"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>

        {descriptor.dataDriven && (
          <p className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            العناصر المعروضة في هذا القسم تأتي من بيانات المتجر، لا من هنا — النصوص أدناه فقط هي القابلة للتحرير.
          </p>
        )}

        {emptyReason && (
          <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            {emptyReason}
          </p>
        )}

        <div className="space-y-5">
          {descriptor.fields.map((field) => (
            <FieldRenderer key={field.name} field={field} />
          ))}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button type="submit" className="gap-2" disabled={isSaving}>
            <Save className="size-4" />
            {isSaving ? 'جاري الحفظ…' : 'حفظ التغييرات'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" className="gap-2" disabled={section.isPristine}>
                <RotateCcw className="size-4" />
                إعادة للأصل
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>إعادة «{descriptor.label}» إلى نصّه الأصلي؟</AlertDialogTitle>
                <AlertDialogDescription>
                  ستُلغى كل تعديلاتك على هذا القسم ويعود إلى النصّ والصور التي أُطلق بها، وسيُعاد إظهاره. لا يمكن التراجع.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onReset(section.key)}
                >
                  إعادة للأصل
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isDirty ? (
            <span className="text-xs font-bold text-warning-foreground">لديك تغييرات غير محفوظة.</span>
          ) : section.isPristine ? (
            <span className="text-xs text-muted-foreground">لم يُعدَّل هذا القسم بعد — يعرض نصّه الأصلي.</span>
          ) : null}
        </footer>
      </form>
    </Form>
  );
}
