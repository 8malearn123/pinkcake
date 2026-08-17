import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Gift,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Trash2,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingState, SectionCard } from '@/components/ds';
import { RiyalSymbol, RiyalText } from '@/components/ui/riyal';
import { cn } from '@/lib/utils';
import {
  PROMO_SLOTS,
  PROMO_SLOT_HINTS,
  PROMO_SLOT_LABELS,
  SINGLE_SLOTS,
  type Announcement,
  type AnnouncementDraft,
  type PromoSlot,
  type StoreOffers,
} from '@/lib/marketing/types';
import {
  useAnnouncements,
  useCoupons,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useSetAnnouncementActive,
  useStoreOffers,
  useUpdateAnnouncement,
  useUpdateStoreOffers,
} from '@/hooks/useMarketing';
import { AnnouncementForm } from './AnnouncementForm';

/**
 * «العروض والإعلانات».
 *
 * كل نصّ هنا كان مثبّتاً في مكوّن من مكوّنات المتجر: عناصر الشريط في
 * `StorefrontDecor`، وصندوق الهدية ورمزه في `GiftBox`، وعنوان الموسم في
 * `SeasonalSection`، وعتبة التوصيل المجاني في `src/lib/delivery.ts`. تغيير
 * كلمة واحدة كان يستلزم نشراً.
 */

const NO_COUPON = '__none__';

export function OffersTab() {
  const announcements = useAnnouncements();
  const { data: coupons = [] } = useCoupons();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const setAnnouncementActive = useSetAnnouncementActive();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formSlot, setFormSlot] = useState<PromoSlot>('ticker');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rows = useMemo(() => announcements.data ?? [], [announcements.data]);
  const selected = useMemo(
    () => (selectedId ? (rows.find((r) => r.id === selectedId) ?? null) : null),
    [rows, selectedId],
  );

  const openNew = (slot: PromoSlot) => {
    setSelectedId(null);
    setFormSlot(slot);
    setIsFormOpen(true);
  };

  const openEdit = (row: Announcement) => {
    setSelectedId(row.id);
    setFormSlot(row.slot);
    setIsFormOpen(true);
  };

  const submit = (draft: AnnouncementDraft) => {
    const onSuccess = () => setIsFormOpen(false);
    if (selected) updateAnnouncement.mutate({ id: selected.id, draft }, { onSuccess });
    else createAnnouncement.mutate(draft, { onSuccess });
  };

  if (announcements.isLoading) return <LoadingState label="جاري تحميل الإعلانات..." />;
  if (announcements.error) {
    return (
      <ErrorState
        title="تعذّر تحميل الإعلانات"
        description={(announcements.error as Error).message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StoreOffersCard coupons={coupons.map((c) => c.code)} />

      {PROMO_SLOTS.map((slot) => {
        const items = rows.filter((r) => r.slot === slot);
        const single = SINGLE_SLOTS.includes(slot);
        const liveCount = items.filter((r) => r.isActive).length;

        return (
          <SectionCard
            key={slot}
            title={PROMO_SLOT_LABELS[slot]}
            icon={Megaphone}
            action={
              <Button variant="outline" size="sm" className="gap-2" onClick={() => openNew(slot)}>
                <Plus className="size-4" />
                إضافة
              </Button>
            }
          >
            <p className="mb-4 text-sm text-muted-foreground">{PROMO_SLOT_HINTS[slot]}</p>

            {/* خانة مفردة بأكثر من مفعّل تعرض الأول فقط — قوله هنا أوضح من
                تركه يُكتشف على المتجر. */}
            {single && liveCount > 1 && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-sm">
                  مفعّل أكثر من عنصر في خانة تعرض واحداً — الأول فقط هو الظاهر.
                </p>
              </div>
            )}

            {items.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="لا يوجد عنصر في هذه الخانة"
                description="المتجر يعرض النصّ الافتراضي حتى تُضيف واحداً."
              />
            ) : (
              <ul className="space-y-3">
                {items.map((row) => (
                  <li
                    key={row.id}
                    className={cn(
                      'flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4',
                      row.isActive ? 'border-border' : 'border-dashed border-border bg-muted/30',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      {row.eyebrow && (
                        <p className="text-xs font-bold text-rose">{row.eyebrow}</p>
                      )}
                      {/* معاينة لا مصدر: الرمز النائب يُعرض كعلامة الريال هنا
                          كما سيراه الزائر، ويبقى نصّاً خاماً داخل النموذج. */}
                      <p className="font-semibold">
                        <RiyalText text={row.title} />
                      </p>
                      {row.subtitle && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {row.subtitle}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {row.couponCode && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-primary">
                            <bdi dir="ltr">{row.couponCode}</bdi>
                          </span>
                        )}
                        {row.ctaLabel && <span>الزرّ: {row.ctaLabel}</span>}
                        {(row.startsAt || row.endsAt) && (
                          <span>
                            <bdi dir="ltr">{row.startsAt || '…'}</bdi> →{' '}
                            <bdi dir="ltr">{row.endsAt || '…'}</bdi>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Switch
                        checked={row.isActive}
                        onCheckedChange={(v) =>
                          setAnnouncementActive.mutate({ id: row.id, isActive: v })
                        }
                        aria-label={row.isActive ? 'إيقاف العنصر' : 'تفعيل العنصر'}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="تعديل العنصر"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="حذف العنصر"
                        className="text-destructive"
                        onClick={() => setDeleteId(row.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        );
      })}

      <AnnouncementForm
        key={selected?.id ?? `new-${formSlot}`}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        announcement={selected}
        defaultSlot={formSlot}
        coupons={coupons}
        onSubmit={submit}
        isLoading={createAnnouncement.isPending || updateAnnouncement.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العنصر</AlertDialogTitle>
            <AlertDialogDescription>
              إن حُذف آخر عنصر في الخانة عاد المتجر إلى النصّ الافتراضي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteAnnouncement.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** العروض الدائمة — قواعد متجر لا حملة، فلها بطاقة واحدة بزرّ حفظ واحد. */
function StoreOffersCard({ coupons }: { coupons: string[] }) {
  const { data, isLoading, isSuccess } = useStoreOffers();
  const update = useUpdateStoreOffers();
  const [draft, setDraft] = useState<StoreOffers | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const patch = (key: keyof StoreOffers, value: unknown) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  if (isLoading) return <LoadingState label="جاري تحميل العروض..." />;

  // استعلام انتهى بلا صفّ = الدوال غير موجودة على هذا الخادم. بلا هذا الفرع
  // تبقى البطاقة على «جاري التحميل» إلى الأبد — عطلٌ يبدو بطئاً.
  if (isSuccess && !draft) {
    return (
      <ErrorState
        title="العروض غير مُهيّأة على هذا الخادم"
        description="القسم يعمل في الوضع التجريبي فقط في هذه المرحلة. المتجر يعرض النصوص والعروض الافتراضية — راجع docs/marketing.md."
      />
    );
  }
  if (!draft) return <LoadingState label="جاري تحميل العروض..." />;

  const missingCode =
    !!draft.firstOrderCouponCode && !coupons.includes(draft.firstOrderCouponCode);

  return (
    <SectionCard
      title="العروض الدائمة"
      icon={Truck}
      action={
        <Button onClick={() => update.mutate(draft)} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="size-4 me-2 animate-spin" />
          ) : (
            <Save className="size-4 me-2" />
          )}
          حفظ
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="free-delivery" className="flex items-center gap-1.5">
              عتبة التوصيل المجاني
              <RiyalSymbol className="size-3.5 text-muted-foreground" />
            </Label>
            <Input
              id="free-delivery"
              type="number"
              inputMode="numeric"
              dir="ltr"
              className="text-end"
              value={draft.freeDeliveryThreshold}
              onChange={(e) => patch('freeDeliveryThreshold', Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              يقرأها شريط التقدّم في السلة وصفحة المنتج معاً، فلا تختلف الثلاثة.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delivery-fee" className="flex items-center gap-1.5">
              رسوم التوصيل
              <RiyalSymbol className="size-3.5 text-muted-foreground" />
            </Label>
            <Input
              id="delivery-fee"
              type="number"
              inputMode="numeric"
              dir="ltr"
              className="text-end"
              value={draft.deliveryFee}
              onChange={(e) => patch('deliveryFee', Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="welcome-code">رمز الترحيب المعلن</Label>
            <Select
              value={draft.firstOrderCouponCode || NO_COUPON}
              onValueChange={(v) => patch('firstOrderCouponCode', v === NO_COUPON ? null : v)}
            >
              <SelectTrigger id="welcome-code">
                <SelectValue placeholder="بلا رمز" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                <SelectItem value={NO_COUPON}>بلا رمز</SelectItem>
                {coupons.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {missingCode && (
              <p className="text-xs text-destructive">
                هذا الرمز لم يعد موجوداً في قائمة الكوبونات.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <VisibilityRow
            id="show-meter"
            icon={Truck}
            label="شريط التوصيل المجاني"
            hint="أقوى دفعة لرفع قيمة السلة، ووعدها حقيقي — الرسوم المذكورة هي المحتسبة فعلاً."
            checked={draft.showFreeDeliveryMeter}
            onChange={(v) => patch('showFreeDeliveryMeter', v)}
          />
          <VisibilityRow
            id="show-gift"
            icon={Gift}
            label="صندوق الهدية"
            hint="يكشف رمز الترحيب في الصفحة الرئيسية."
            checked={draft.showGiftBox}
            onChange={(v) => patch('showGiftBox', v)}
          />
          <VisibilityRow
            id="show-banner"
            icon={Megaphone}
            label="بانر العرض"
            hint="بانر عريض بين تشكيلة الموسم وقائمة المنتجات."
            checked={draft.showOfferBanner}
            onChange={(v) => patch('showOfferBanner', v)}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function VisibilityRow({
  id,
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <Label htmlFor={id} className="font-semibold">
            {label}
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
