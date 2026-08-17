import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
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
import type { FieldDescriptor } from '@/lib/homepage/types';
import { FieldRenderer } from './FieldRenderer';

interface ItemListEditorProps {
  /** مسار المصفوفة داخل محتوى القسم، مثل `items`. */
  name: string;
  field: FieldDescriptor;
}

function SortableRow({
  id,
  index,
  name,
  itemFields,
  itemTitleField,
  itemNoun,
  onRemove,
}: {
  id: string;
  index: number;
  name: string;
  itemFields: FieldDescriptor[];
  itemTitleField?: string;
  itemNoun: string;
  onRemove: () => void;
}) {
  const form = useFormContext();
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const title = useWatch({
    control: form.control,
    name: `${name}.${index}.${itemTitleField ?? 'title'}`,
  }) as string | undefined;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-card ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label={`إعادة ترتيب ${title || itemNoun}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-start"
          aria-expanded={open}
        >
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          <span className="truncate text-sm font-medium">{title || `${itemNoun} بلا عنوان`}</span>
        </button>

        <FormField
          control={form.control}
          name={`${name}.${index}.visible`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Switch
                  checked={field.value !== false}
                  onCheckedChange={field.onChange}
                  aria-label={`إظهار ${title || itemNoun}`}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`حذف ${title || itemNoun}`}
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {open && (
        <div className="space-y-4 border-t p-4">
          {itemFields.map((f) => (
            <FieldRenderer key={f.name} field={f} prefix={`${name}.${index}`} />
          ))}
        </div>
      )}
    </li>
  );
}

/**
 * عناصر قسم متكرّرة: إضافة وحذف وترتيب بالسحب وإظهار لكل عنصر.
 *
 * الترتيب هنا هو ترتيب الظهور على الصفحة حرفياً — لا ترتيب داخلي تُعيد الشفرة
 * توزيعه بعد ذلك — كي يكون ما يراه المدير هو ما يراه الزبون.
 */
export function ItemListEditor({ name, field }: ItemListEditorProps) {
  const form = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name });
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const itemNoun = field.itemNoun ?? 'عنصر';
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from !== -1 && to !== -1) move(from, to);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold">{field.label}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => append(field.newItem?.() ?? {})}
        >
          <Plus className="size-4" />
          إضافة {itemNoun}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          لا توجد عناصر. القسم لن يظهر على الصفحة حتى تضيف {itemNoun} واحدة على الأقل.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {fields.map((f, index) => (
                <SortableRow
                  key={f.id}
                  id={f.id}
                  index={index}
                  name={name}
                  itemFields={field.itemFields ?? []}
                  itemTitleField={field.itemTitleField}
                  itemNoun={itemNoun}
                  onRemove={() => setPendingRemove(index)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <AlertDialog open={pendingRemove !== null} onOpenChange={() => setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف هذا العنصر من القسم. الحذف لا يُطبَّق حتى تحفظ القسم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingRemove !== null) remove(pendingRemove);
                setPendingRemove(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
