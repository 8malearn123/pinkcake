import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PROMO_SLOT_HINTS,
  PROMO_SLOT_LABELS,
  type Announcement,
  type AnnouncementDraft,
  type Coupon,
  type PromoSlot,
} from '@/lib/marketing/types';

/**
 * نموذج الإعلان.
 *
 * الحقول المعروضة تتبع الخانة: الشريط المتحرّك سطر واحد، وصندوق الهدية يحتاج
 * رمزاً، وشريط الموسم له عنوان فرعي وشارة. عرض كل الحقول لكل خانة يجعل نصف
 * النموذج بلا أثر — والمستخدم لا يعرف أيّها بلا أثر.
 */

const NO_COUPON = '__none__';

interface FormState {
  slot: PromoSlot;
  eyebrow: string;
  title: string;
  subtitle: string;
  couponCode: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const empty = (slot: PromoSlot): FormState => ({
  slot,
  eyebrow: '',
  title: '',
  subtitle: '',
  couponCode: '',
  ctaLabel: '',
  ctaHref: '',
  imageUrl: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
});

function fromAnnouncement(row: Announcement | null, slot: PromoSlot): FormState {
  if (!row) return empty(slot);
  return {
    slot: row.slot,
    eyebrow: row.eyebrow ?? '',
    title: row.title ?? '',
    subtitle: row.subtitle ?? '',
    couponCode: row.couponCode ?? '',
    ctaLabel: row.ctaLabel ?? '',
    ctaHref: row.ctaHref ?? '',
    imageUrl: row.imageUrl ?? '',
    startsAt: row.startsAt ?? '',
    endsAt: row.endsAt ?? '',
    isActive: row.isActive,
  };
}

function toDraft(form: FormState): AnnouncementDraft {
  return {
    slot: form.slot,
    eyebrow: form.eyebrow.trim(),
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    couponCode: form.couponCode.trim() || null,
    ctaLabel: form.ctaLabel.trim(),
    ctaHref: form.ctaHref.trim(),
    imageUrl: form.imageUrl.trim() || null,
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    isActive: form.isActive,
  };
}

interface AnnouncementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  /** الخانة الافتراضية عند الإضافة. */
  defaultSlot: PromoSlot;
  coupons: Coupon[];
  onSubmit: (draft: AnnouncementDraft) => void;
  isLoading?: boolean;
}

export function AnnouncementForm({
  open,
  onOpenChange,
  announcement,
  defaultSlot,
  coupons,
  onSubmit,
  isLoading,
}: AnnouncementFormProps) {
  const [form, setForm] = useState<FormState>(() => fromAnnouncement(announcement, defaultSlot));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(fromAnnouncement(announcement, defaultSlot));
      setError(null);
    }
  }, [announcement, defaultSlot, open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isTicker = form.slot === 'ticker';

  const submit = () => {
    if (!form.title.trim()) {
      setError('النصّ مطلوب');
      return;
    }
    setError(null);
    onSubmit(toDraft(form));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{announcement ? 'تعديل الإعلان' : 'إعلان جديد'}</DialogTitle>
          <DialogDescription>{PROMO_SLOT_HINTS[form.slot]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="ann-slot">مكان العرض</Label>
            <Select
              value={form.slot}
              onValueChange={(v) => set('slot', v as PromoSlot)}
              disabled={!!announcement}
            >
              <SelectTrigger id="ann-slot">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                {(Object.keys(PROMO_SLOT_LABELS) as PromoSlot[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROMO_SLOT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {announcement && (
              <p className="text-xs text-muted-foreground">
                الخانة لا تتغيّر بعد الإنشاء — احذف العنصر وأنشئه في خانته.
              </p>
            )}
          </div>

          {!isTicker && (
            <div className="space-y-1.5">
              <Label htmlFor="ann-eyebrow">السطر الصغير</Label>
              <Input
                id="ann-eyebrow"
                placeholder="هديّة ترحيبية"
                value={form.eyebrow}
                onChange={(e) => set('eyebrow', e.target.value)}
              />
              {form.slot === 'gift_box' && (
                <p className="text-xs text-muted-foreground">
                  <bdi dir="ltr">{'{store}'}</bdi> يُستبدل باسم المتجر من الإعدادات.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ann-title">{isTicker ? 'نصّ العنصر *' : 'العنوان *'}</Label>
            <Input
              id="ann-title"
              placeholder={isTicker ? 'توصيل مجاني للطلبات فوق ٢٠٠ {riyal}' : 'خصم ١٥٪ على أوّل طلب'}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
            {isTicker && (
              <p className="text-xs text-muted-foreground">
                <bdi dir="ltr">{'{riyal}'}</bdi> يُستبدل بعلامة الريال الرسمية.
              </p>
            )}
          </div>

          {!isTicker && (
            <div className="space-y-1.5">
              <Label htmlFor="ann-subtitle">النصّ المساند</Label>
              <Textarea
                id="ann-subtitle"
                rows={2}
                value={form.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ann-coupon">الكوبون المرتبط</Label>
            <Select
              value={form.couponCode || NO_COUPON}
              onValueChange={(v) => set('couponCode', v === NO_COUPON ? '' : v)}
            >
              <SelectTrigger id="ann-coupon">
                <SelectValue placeholder="بلا رمز" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                <SelectItem value={NO_COUPON}>بلا رمز</SelectItem>
                {coupons.map((c) => (
                  <SelectItem key={c.id} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              الرمز يُعرض للعميلة هنا — اختر رمزاً فعّالاً، وإلا أعلن المتجر عرضاً لا يعمل.
            </p>
          </div>

          {!isTicker && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ann-cta">نصّ الزرّ / الشارة</Label>
                <Input
                  id="ann-cta"
                  placeholder="تسوّقي الآن"
                  value={form.ctaLabel}
                  onChange={(e) => set('ctaLabel', e.target.value)}
                />
              </div>
              {form.slot === 'offer_banner' && (
                <div className="space-y-1.5">
                  <Label htmlFor="ann-href">وجهة الزرّ</Label>
                  <Input
                    id="ann-href"
                    dir="ltr"
                    className="text-start"
                    placeholder="#shop"
                    value={form.ctaHref}
                    onChange={(e) => set('ctaHref', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ann-start">يبدأ في</Label>
              <Input
                id="ann-start"
                type="date"
                dir="ltr"
                value={form.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-end">ينتهي في</Label>
              <Input
                id="ann-end"
                type="date"
                dir="ltr"
                value={form.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
            <div>
              <Label htmlFor="ann-active" className="font-semibold">
                مفعّل
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                غير المفعّل يبقى هنا ولا يظهر في المتجر.
              </p>
            </div>
            <Switch
              id="ann-active"
              checked={form.isActive}
              onCheckedChange={(v) => set('isActive', v)}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={submit} disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 me-2 animate-spin" />}
            {announcement ? 'حفظ التغييرات' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
