import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarHeart, Gift, Pencil, Plus, Trash2 } from 'lucide-react';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { useDeleteOccasion, useMyLoyalty, useMyOccasions } from '@/hooks/useLoyalty';
import {
  HIJRI_MONTHS,
  OCCASION_TYPES,
  daysUntilLabel,
  occasionsToUnlock,
  pluralAr,
  type LoyaltyOccasion,
} from '@/lib/loyalty/program';
import { OccasionDialog } from './OccasionDialog';

const TYPE_EMOJI = OCCASION_TYPES.reduce<Record<string, string>>(
  (acc, t) => ({ ...acc, [t.value]: t.emoji }),
  {},
);

/**
 * «سجل المناسبات» — قلب البرنامج، لا زخرفة حوله.
 *
 * الحافز معروض صراحةً: تعبئة السجل تفتح مكافأة تُستخدم فوراً. ندفع مقابل
 * التقاط التواريخ لا مقابل التسجيل — مكافأة التسجيل هي أكثر ما يُساء استغلاله
 * في برنامج منخفض التكرار، إذ تساوي أكثر من سنة من الاستحقاق المشروع.
 */
export function OccasionRegistry() {
  const { data: occasions = [], isLoading } = useMyOccasions();
  const { data: summary } = useMyLoyalty();
  const remove = useDeleteOccasion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyOccasion | null>(null);

  const toUnlock = occasionsToUnlock(summary);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (occasion: LoyaltyOccasion) => {
    setEditing(occasion);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarHeart className="size-5 text-primary" />
              سجل المناسبات
            </CardTitle>
            <CardDescription className="mt-1">
              احفظي مناسباتك ونذكّرك قبلها بوقت كافٍ للتجهيز.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd} className="shrink-0">
            <Plus className="size-4 me-1.5" />
            أضيفي مناسبة
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* الحافز — يختفي فور فتح المكافأة بدل أن يبقى معلّقاً بلا معنى. */}
        {toUnlock > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-soft/20 p-4">
            <Gift className="mt-0.5 size-5 shrink-0 text-gold-deep" />
            <p className="text-sm leading-relaxed">
              سجّلي{' '}
              <strong>
                {toArabicDigits(toUnlock)}{' '}
                {pluralAr(toUnlock, 'مناسبة إضافية', 'مناسبتين إضافيتين', 'مناسبات إضافية', 'مناسبة إضافية')}
              </strong>{' '}
              وافتحي «لمسة التخصيص» مجاناً على طلبك القادم.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : occasions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <CalendarHeart className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">لا توجد مناسبات محفوظة بعد</p>
            <p className="mt-1 text-sm text-muted-foreground">
              أضيفي أوّل مناسبة — يكفي الاسم واليوم والشهر.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {occasions.map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg">
                  {TYPE_EMOJI[o.occasion_type] ?? '✨'}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{o.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {toArabicDigits(o.occasion_day)} {HIJRI_MONTHS[o.occasion_month - 1]} ·{' '}
                    {daysUntilLabel(o.days_until)}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`تعديل ${o.label}`}
                  onClick={() => openEdit(o)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`حذف ${o.label}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove.mutate(o.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <OccasionDialog open={dialogOpen} onOpenChange={setDialogOpen} occasion={editing} />
    </Card>
  );
}
