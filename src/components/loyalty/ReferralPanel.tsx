import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Copy, Share2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { useMyReferral } from '@/hooks/useLoyalty';

/**
 * «ادعي صديقة».
 *
 * أقوى ما في هذه الفئة تجارياً: الكيكة تُرى في الحفلة أمام عشرات الأشخاص في
 * ذروة اللحظة العاطفية. والدراسة المرجعية (Schmitt, Skiera & Van den Bulte,
 * ‎J. Marketing 2011‎، ~١٠٠٠٠ عميل على ٣ سنوات مقابل مجموعة ضبط مطابقة) تجد أن
 * العميل المُحال أعلى قيمة عمرية بـ ١٦–٢٥٪، وأن ميزة البقاء تستمر لا تتآكل.
 *
 * المكافأة تُصرف بعد **تسليم** طلب المُحال إليه لا بعد تسجيله — لا توجد نافذة
 * إرجاع لكيك، فنافذة التثبيت هي الضابط الوحيد المتاح.
 */
export function ReferralPanel() {
  const { data: referral, isLoading } = useMyReferral();
  const [copied, setCopied] = useState(false);

  const code = referral?.code ?? '';
  const message = `جرّبي بينك كيك 🎂 استخدمي رمز دعوتي ${code} واحصلي على علبة كب كيك مجاناً مع أوّل طلب.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ title: 'نُسخ رمز الدعوة' });
    } catch {
      toast({ title: 'تعذّر النسخ', description: code, variant: 'destructive' });
    }
  };

  const share = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!referral) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          ادعي صديقة
        </CardTitle>
        <CardDescription className="mt-1">
          صديقتك تحصل على علبة كب كيك مع أوّل طلب، وأنتِ على لمسة التخصيص.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 rounded-xl border border-dashed border-gold/50 bg-gold-soft/15 px-4 py-3 text-center text-lg font-bold tracking-widest">
            <bdi dir="ltr">{code}</bdi>
          </code>
          <Button variant="outline" size="icon" aria-label="نسخ رمز الدعوة" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
          <Button size="icon" aria-label="مشاركة عبر واتساب" onClick={share}>
            <Share2 className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'دعوات', value: referral.invited },
            { label: 'اكتملت', value: referral.vested },
            { label: 'مكافآت', value: referral.rewarded },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3">
              <div className="text-xl font-bold text-primary">{toArabicDigits(s.value)}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          تُفعّل المكافأة بعد {toArabicDigits(72)} ساعة من تسليم طلب صديقتك الأوّل، وبحد أدنى{' '}
          {toArabicDigits(150)} ريال.
        </p>
      </CardContent>
    </Card>
  );
}
