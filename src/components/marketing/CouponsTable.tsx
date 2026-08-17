import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { COUPON_STATE_LABELS, couponState, couponSummary } from '@/lib/marketing/coupon';
import type { CouponState } from '@/lib/marketing/coupon';
import type { Coupon } from '@/lib/marketing/types';

/**
 * جدول الكوبونات.
 *
 * «الحالة» هنا محسوبة لا مقروءة من `isActive`: كوبون مفعّل انتهى تاريخه أو
 * اكتمل سقفه يبدو فعّالاً في قاعدة البيانات ولا يعمل عند العميلة — وهذا
 * بالضبط ما يجعل فريقاً يظنّ أن العرض شغّال وهو ليس كذلك.
 */

const STATE_TONE: Record<CouponState, string> = {
  active: 'bg-success/10 text-success',
  paused: 'bg-muted text-muted-foreground',
  scheduled: 'bg-info/10 text-info',
  expired: 'bg-destructive/10 text-destructive',
  exhausted: 'bg-warning/10 text-warning',
};

interface CouponsTableProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  onToggle: (coupon: Coupon) => void;
  isDeleting?: boolean;
}

export function CouponsTable({ coupons, onEdit, onDelete, onToggle, isDeleting }: CouponsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: 'نُسخ الرمز', description: code });
    } catch {
      toast({ title: 'تعذّر النسخ', description: code, variant: 'destructive' });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرمز</TableHead>
              <TableHead>القيمة</TableHead>
              <TableHead>الشروط</TableHead>
              <TableHead>الاستخدام</TableHead>
              <TableHead>الإيراد المنسوب</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => {
              const state = couponState(coupon);
              const used = coupon.redemptions;
              const limit = coupon.usageLimit;

              return (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <bdi dir="ltr" className="font-mono font-bold tracking-wider">
                        {coupon.code}
                      </bdi>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`نسخ الرمز ${coupon.code}`}
                        className="size-7 text-muted-foreground"
                        onClick={() => copy(coupon.code)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                    {coupon.note && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                        {coupon.note}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="font-semibold">{toArabicDigits(couponSummary(coupon))}</TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      {coupon.minOrder > 0 && (
                        <span>
                          من {toArabicDigits(coupon.minOrder)} <RiyalSymbol className="inline size-3" />
                        </span>
                      )}
                      {coupon.firstOrderOnly && <span>أوّل طلب فقط</span>}
                      {coupon.scope !== 'all' && (
                        <span>
                          {coupon.scope === 'category' ? 'تصنيفات محدّدة' : 'منتجات محدّدة'} (
                          {toArabicDigits(coupon.scopeValues.length)})
                        </span>
                      )}
                      {coupon.endsAt && (
                        <span>
                          حتى <bdi dir="ltr">{coupon.endsAt}</bdi>
                        </span>
                      )}
                      {coupon.minOrder === 0 &&
                        !coupon.firstOrderOnly &&
                        coupon.scope === 'all' &&
                        !coupon.endsAt && <span>—</span>}
                    </div>
                  </TableCell>

                  {/* «٧ من ٢٠٠» لا «٧ / ٢٠٠»: الشرطة المائلة بين رقمين عربيَّين
                      تلتبس اتجاهياً فيُقرأ الكسر مقلوباً، والكلمة تحسم القراءة. */}
                  <TableCell className="tabular-nums">
                    {toArabicDigits(used)}
                    {limit != null && (
                      <span className="text-muted-foreground"> من {toArabicDigits(limit)}</span>
                    )}
                  </TableCell>

                  <TableCell className="tabular-nums">
                    <span className="font-semibold text-primary">
                      <bdi>{toArabicDigits(Math.round(coupon.revenue))}</bdi>{' '}
                      <RiyalSymbol className="inline size-3.5" />
                    </span>
                    {coupon.discountGiven > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        مقابل {toArabicDigits(Math.round(coupon.discountGiven))} خصماً
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        STATE_TONE[state],
                      )}
                    >
                      {COUPON_STATE_LABELS[state]}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={() => onToggle(coupon)}
                        aria-label={coupon.isActive ? `إيقاف ${coupon.code}` : `تفعيل ${coupon.code}`}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="خيارات">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border shadow-md">
                          <DropdownMenuItem onClick={() => onEdit(coupon)}>
                            <Pencil className="size-4 me-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(coupon.id)}
                          >
                            <Trash2 className="size-4 me-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكوبون</AlertDialogTitle>
            <AlertDialogDescription>
              سجلّ استخدامه يُحذف معه. إن كنت تريد إيقافه فقط فاستخدم مفتاح التفعيل — يبقى الرمز
              وأرقامه، ويُرفض عند العميلة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
