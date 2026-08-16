import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Clock, Copy, Gift, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { useMyRewards } from '@/hooks/useLoyalty';

const ORIGIN_LABELS: Record<string, string> = {
  stamp_card: 'كرت مكتمل',
  registry_unlock: 'تعبئة سجل المناسبات',
  referral_referrer: 'دعوتِ صديقة',
  referral_referee: 'دعوة صديقة',
  tier: 'ميزة دائمة',
};

/**
 * «مكافآتي».
 *
 * كل مكافأة هنا **صنف أو خدمة تُضاف بسعر صفر** — لا خصم ولا قسيمة بقيمة ريال.
 * الفرق ليس تجميلياً: العيني يكلّف ثلث قيمته المعلنة، ولا يمسّ وعاء الضريبة،
 * ولا يدرّب العميلة على انتظار التخفيض.
 */
export function RewardsPanel() {
  const { data: rewards = [], isLoading } = useMyRewards();
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 2000);
      toast({ title: 'نُسخ الرمز', description: 'أدخليه في السلة عند إتمام الطلب.' });
    } catch {
      toast({ title: 'تعذّر النسخ', description: code, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="size-5 text-primary" />
          مكافآتي
        </CardTitle>
        <CardDescription className="mt-1">
          تُضاف إلى طلبك مجاناً — الحد الأدنى للطلب {toArabicDigits(150)} ريال.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Sparkles className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">لا توجد مكافآت متاحة الآن</p>
            <p className="mt-1 text-sm text-muted-foreground">
              أكملي كرت المناسبات أو ادعي صديقة لتفتحي أوّل مكافأة.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rewards.map((r, i) => {
              const pending = !r.is_usable && r.status === 'available';
              return (
                <li
                  key={r.redemption_code ?? `${r.reward_code}-${i}`}
                  className={cn(
                    'rounded-2xl border p-4',
                    r.is_usable ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{r.name}</div>
                      {r.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{r.description}</p>
                      )}
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {ORIGIN_LABELS[r.origin] ?? 'مكافأة'}
                      </p>
                    </div>

                    {r.redemption_code && (
                      <Button
                        variant={r.is_usable ? 'default' : 'outline'}
                        size="sm"
                        className="shrink-0"
                        disabled={!r.is_usable}
                        onClick={() => copyCode(r.redemption_code as string)}
                      >
                        {copied === r.redemption_code ? (
                          <Check className="size-4 me-1.5" />
                        ) : (
                          <Copy className="size-4 me-1.5" />
                        )}
                        <bdi dir="ltr">{r.redemption_code}</bdi>
                      </Button>
                    )}
                  </div>

                  {/* نافذة تثبيت مكافأة الإحالة: القسيمة موجودة وغير قابلة
                      للاستخدام بعد — نقولها صراحةً بدل أن تبدو معطّلة بلا سبب. */}
                  {pending && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      تُفعّل بعد {toArabicDigits(72)} ساعة من تسليم طلب صديقتك.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
