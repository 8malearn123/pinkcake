import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { useMyLoyalty, useSetConsent } from '@/hooks/useLoyalty';

/**
 * تفضيلات الرسائل.
 *
 * الموافقات **مفصولة وغير مُفعّلة مسبقاً** — لا خانة واحدة تجمع «الحساب
 * والتسويق والتخصيص». هذا شرط في نظام حماية البيانات لا تفضيل تصميم: التسويق
 * لا يكون مشروعاً إلا بموافقة مأخوذة مباشرة من صاحبها، وسحبها يجب أن يكون بنفس
 * سهولة منحها.
 *
 * ملاحظة على ما لا يظهر هنا: تذكير المناسبة **المجرّد** (بلا سعر ولا عرض) لا
 * يتوقّف على هذا المفتاح، لأنه يستند إلى التعامل السابق؛ أما أي رسالة تحمل
 * عرضاً فلا تُرسل إلا بتفعيله. الفصل مطبّق في قوالب الرسائل نفسها.
 */
export function ConsentToggles() {
  const { data: summary, isLoading } = useMyLoyalty();
  const setConsent = useSetConsent();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          تفضيلات الرسائل
        </CardTitle>
        <CardDescription className="mt-1">
          تحكّمي بما يصلك، وغيّري رأيك متى شئت.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
          <div className="min-w-0">
            <Label htmlFor="consent-marketing" className="flex items-center gap-2 font-semibold">
              <MessageCircle className="size-4" />
              العروض والمكافآت عبر واتساب
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              رسائل تحمل عرضاً أو مكافأة. تذكيرات المناسبات المجرّدة تصلك بلا حاجة لهذا
              الخيار.
            </p>
          </div>
          <Switch
            id="consent-marketing"
            checked={!!summary?.consent_marketing}
            disabled={setConsent.isPending}
            onCheckedChange={(granted) => setConsent.mutate({ purpose: 'marketing', granted })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
