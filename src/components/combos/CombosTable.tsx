import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  AlertTriangle,
  Eye,
  EyeOff,
  GripVertical,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { priceCombo, resolvableMembers } from '@/lib/combos';
import { MIN_COMBO_MEMBERS, type ComboItem } from '@/lib/combosCatalog/types';
import type { PickableProduct } from './ComboProductPicker';

interface CombosTableProps {
  combos: ComboItem[];
  products: PickableProduct[];
  heroSrcFor: (combo: ComboItem) => string;
  onEdit: (combo: ComboItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onMakeBest: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

interface RowProps extends Omit<CombosTableProps, 'combos' | 'onReorder'> {
  combo: ComboItem;
  onDeleteClick: (id: string) => void;
}

function SortableRow({
  combo,
  products,
  heroSrcFor,
  onEdit,
  onDeleteClick,
  onToggleActive,
  onMakeBest,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: combo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const members = combo.items
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is PickableProduct => !!p);
  const pricing = priceCombo(members, combo.discountPct);
  // Sold-out members still count: stock comes back, a deleted product doesn't.
  const resolvable = resolvableMembers(combo, products);
  const willVanish = resolvable < MIN_COMBO_MEMBERS;
  const hero = heroSrcFor(combo);

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          aria-label={`إعادة ترتيب ${combo.name}`}
          className="cursor-grab rounded p-1 hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </button>
      </TableCell>

      <TableCell className="w-16">
        {hero ? (
          <img src={hero} alt="" loading="lazy" className="size-12 rounded-lg object-cover" />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
            <ImageOff className="size-4 text-muted-foreground" />
          </div>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: combo.accent }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{combo.name}</p>
            <p className="truncate text-xs text-muted-foreground">{combo.tagline || '—'}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        {members.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="flex items-center">
            {members.map((member, index) =>
              member.image_url ? (
                <img
                  key={member.id}
                  src={member.image_url}
                  alt={member.name}
                  title={member.name}
                  loading="lazy"
                  className={`size-8 rounded-full border-2 border-card object-cover ${index > 0 ? '-me-2' : ''}`}
                />
              ) : (
                <span
                  key={member.id}
                  title={member.name}
                  className={`grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[10px] ${index > 0 ? '-me-2' : ''}`}
                >
                  {member.name.slice(0, 1)}
                </span>
              ),
            )}
            <span className="ms-3 text-xs text-muted-foreground">
              {toArabicDigits(members.length)} أصناف
            </span>
          </div>
        )}
      </TableCell>

      <TableCell>
        {members.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="space-y-0.5">
            <span className="flex items-baseline gap-1 font-semibold">
              {toArabicDigits(pricing.price)} <RiyalSymbol className="text-[10px]" />
            </span>
            <span className="flex items-baseline gap-1 text-xs text-muted-foreground line-through">
              {toArabicDigits(pricing.original)} <RiyalSymbol className="text-[9px]" />
            </span>
          </div>
        )}
      </TableCell>

      <TableCell>
        <Badge variant="outline">خصم {toArabicDigits(combo.discountPct)}٪</Badge>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={combo.isActive ? 'default' : 'secondary'}>
            {combo.isActive ? 'ظاهر' : 'مخفي'}
          </Badge>
          {combo.best && (
            <Badge className="gap-1 bg-warning text-warning-foreground hover:bg-warning/90">
              <Sparkles className="size-3" /> الأكثر توفيراً
            </Badge>
          )}
          {willVanish && (
            <Badge
              variant="outline"
              className="gap-1 border-destructive/40 text-destructive"
              title="عدد المنتجات المتاحة في الكتالوج أقل من الحد الأدنى، لذلك لن تُعرض هذه البطاقة."
            >
              <AlertTriangle className="size-3" /> لن يظهر في المتجر
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="w-16">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`إجراءات ${combo.name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => onEdit(combo)} className="gap-2">
              <Pencil className="size-4" /> تعديل
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleActive(combo.id, !combo.isActive)}
              className="gap-2"
            >
              {combo.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {combo.isActive ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
            </DropdownMenuItem>
            {!combo.best && (
              <DropdownMenuItem onClick={() => onMakeBest(combo.id)} className="gap-2">
                <Sparkles className="size-4" /> تعيين كـ«الأكثر توفيراً»
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDeleteClick(combo.id)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" /> حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function CombosTable({
  combos,
  products,
  heroSrcFor,
  onEdit,
  onDelete,
  onToggleActive,
  onMakeBest,
  onReorder,
}: CombosTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [items, setItems] = useState(combos);

  // Adopt external changes (another tab, a reset) without an effect round-trip.
  if (combos.length !== items.length || combos.some((c, i) => c.id !== items[i]?.id)) {
    setItems(combos);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onReorder(next.map((item) => item.id));
  };

  const deleting = deleteId ? items.find((item) => item.id === deleteId) : null;

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-16">الصورة</TableHead>
              <TableHead>الكومبو</TableHead>
              <TableHead>المنتجات</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>الخصم</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  لا توجد كومبوهات حتى الآن
                </TableCell>
              </TableRow>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((combo) => (
                    <SortableRow
                      key={combo.id}
                      combo={combo}
                      products={products}
                      heroSrcFor={heroSrcFor}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDeleteClick={setDeleteId}
                      onToggleActive={onToggleActive}
                      onMakeBest={onMakeBest}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف «{deleting?.name}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف الكومبو وصورته المرفوعة نهائياً. المنتجات نفسها لن تتأثر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
