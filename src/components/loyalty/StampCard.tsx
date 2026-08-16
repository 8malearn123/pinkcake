import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { useMyLoyalty } from '@/hooks/useLoyalty';
import { pluralAr, stampProgress } from '@/lib/loyalty/program';

/**
 * كرت الأختام.
 *
 * الخانة الأولى ممنوحة عند الانضمام لا مجاناً بلا سبب: «التقدّم الممنوح»
 * (Nunes & Drèze) رفع نسبة الإتمام من ١٩٪ إلى ٣٤٪ بنفس الجهد الحقيقي — كرت من
 * خمس خانات يبدأ من واحدة أفضل من كرت من أربع يبدأ من صفر، رغم أن العدد
 * المطلوب فعلياً واحد في الحالتين.
 */
export function StampCard() {
  const { data: summary, isLoading } = useMyLoyalty();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary?.enabled) return null;

  const progress = stampProgress(summary.stamp_balance, summary.stamps_required);
  const isCircle = summary.tier === 'circle';

  return (
    <Card className={cn(isCircle && 'border-gold/50')}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cake className="size-5 text-primary" />
              كرت المناسبات
            </CardTitle>
            <CardDescription className="mt-1">
              كل طلب مكتمل يضيف ختماً — والكرت الكامل مكافأة عينية.
            </CardDescription>
          </div>

          {isCircle && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/50 bg-gold-soft/25 px-3 py-1 text-xs font-semibold text-gold-deep">
              <Crown className="size-3.5" />
              دائرة مميّزة
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {progress.slots.map((filled, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                'grid size-11 place-items-center rounded-full border-2 transition-colors',
                filled
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-dashed border-primary/30 bg-primary/5 text-primary/30',
              )}
            >
              <Cake className="size-5" />
            </span>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {progress.complete ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="size-4" />
              كرتك مكتمل — مكافأتك بانتظارك في «مكافآتي».
            </span>
          ) : (
            <>
              باقي{' '}
              <strong className="text-foreground">
                {toArabicDigits(progress.remaining)}{' '}
                {pluralAr(progress.remaining, 'طلب', 'طلبان', 'طلبات', 'طلب')}
              </strong>{' '}
              حتى مكافأتك القادمة.
            </>
          )}
        </p>

        {!isCircle && summary.tier_threshold > 0 && (
          <p className="text-xs text-muted-foreground">
            «دائرة مميّزة» تفتح أولوية مواعيد الخميس والجمعة ومواسم العيد — تُحتسب على
            إنفاق آخر {toArabicDigits(24)} شهراً.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
