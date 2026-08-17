import { useMemo, useState } from 'react';
import { Plus, Search, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState, StatTile } from '@/components/ds';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { COUPON_STATE_LABELS, couponState } from '@/lib/marketing/coupon';
import type { CouponState } from '@/lib/marketing/coupon';
import type { Coupon, CouponDraft } from '@/lib/marketing/types';
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useSetCouponActive,
  useUpdateCoupon,
} from '@/hooks/useMarketing';
import { CouponsTable } from './CouponsTable';
import { CouponForm } from './CouponForm';

/**
 * «الكوبونات».
 *
 * قبل هذا التبويب كانت رموز الخصم جدولاً مثبّتاً في `src/lib/demo/rpc.ts`،
 * أي أن الرمز الذي يعلنه المتجر في ثلاثة مواضع لم يكن لأحد أن يوقفه أو يغيّر
 * قيمته أو يعرف كم مرّة استُخدم.
 */

const FILTERS: { key: 'all' | CouponState; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: COUPON_STATE_LABELS.active },
  { key: 'scheduled', label: COUPON_STATE_LABELS.scheduled },
  { key: 'paused', label: COUPON_STATE_LABELS.paused },
  { key: 'expired', label: COUPON_STATE_LABELS.expired },
  { key: 'exhausted', label: COUPON_STATE_LABELS.exhausted },
];

export function CouponsTab() {
  const { data: coupons, isLoading, error } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const setActive = useSetCouponActive();

  const [isFormOpen, setIsFormOpen] = useState(false);
  // الهوية لا الصف: النموذج المفتوح يجب أن يتبع الكوبون الحيّ، فتبديل حالته
  // من الجدول ينعكس فيه بدل أن يعرض ما كان عليه لحظة الفتح.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | CouponState>('all');

  const rows = useMemo(() => coupons ?? [], [coupons]);
  const selected = useMemo(
    () => (selectedId ? (rows.find((c) => c.id === selectedId) ?? null) : null),
    [rows, selectedId],
  );

  const visible = useMemo(() => {
    const q = query.trim().toUpperCase();
    return rows.filter((c) => {
      const matchesQuery = q === '' || c.code.includes(q) || c.note.toUpperCase().includes(q);
      const matchesFilter = filter === 'all' || couponState(c) === filter;
      return matchesQuery && matchesFilter;
    });
  }, [rows, query, filter]);

  const stats = useMemo(() => {
    const live = rows.filter((c) => couponState(c) === 'active').length;
    const redemptions = rows.reduce((n, c) => n + c.redemptions, 0);
    const discount = rows.reduce((n, c) => n + c.discountGiven, 0);
    const revenue = rows.reduce((n, c) => n + c.revenue, 0);
    return { live, redemptions, discount, revenue };
  }, [rows]);

  const openNew = () => {
    setSelectedId(null);
    setIsFormOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setSelectedId(coupon.id);
    setIsFormOpen(true);
  };

  const submit = (draft: CouponDraft) => {
    const onSuccess = () => setIsFormOpen(false);
    if (selected) updateCoupon.mutate({ id: selected.id, draft }, { onSuccess });
    else createCoupon.mutate(draft, { onSuccess });
  };

  if (isLoading) return <LoadingState label="جاري تحميل الكوبونات..." />;
  if (error) {
    return (
      <ErrorState
        title="تعذّر تحميل الكوبونات"
        description={(error as Error).message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="كوبونات فعّالة"
          value={toArabicDigits(stats.live)}
          icon={TicketPercent}
          tone="primary"
        />
        <StatTile label="مرّات الاستخدام" value={toArabicDigits(stats.redemptions)} tone="info" />
        <StatTile
          label="خصم مُنح"
          value={
            <>
              <bdi>{toArabicDigits(Math.round(stats.discount))}</bdi>{' '}
              <RiyalSymbol className="inline size-5" />
            </>
          }
          tone="warning"
        />
        <StatTile
          label="إيراد منسوب"
          value={
            <>
              <bdi>{toArabicDigits(Math.round(stats.revenue))}</bdi>{' '}
              <RiyalSymbol className="inline size-5" />
            </>
          }
          tone="success"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث برمز أو ملاحظة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-10"
          />
        </div>
        <Button onClick={openNew} className="gap-2 sm:ms-auto">
          <Plus className="size-4" />
          كوبون جديد
        </Button>
      </div>

      {/* أزرار لا شارات قابلة للنقر: التصفية تُستخدم بلوحة المفاتيح أيضاً،
          و`aria-pressed` هو ما يخبر قارئ الشاشة أيّها المطبَّق. */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية الكوبونات">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            <Badge variant={filter === f.key ? 'default' : 'outline'} className="cursor-pointer">
              {f.label}
            </Badge>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title={rows.length === 0 ? 'لا توجد كوبونات بعد' : 'لا توجد نتائج'}
          description={
            rows.length === 0
              ? 'أنشئ أوّل رمز خصم — سيعمل مباشرةً في سلّة المتجر.'
              : 'جرّب كلمة أخرى أو غيّر التصفية.'
          }
          action={
            rows.length === 0 ? (
              <Button onClick={openNew} className="gap-2">
                <Plus className="size-4" />
                كوبون جديد
              </Button>
            ) : undefined
          }
        />
      ) : (
        <CouponsTable
          coupons={visible}
          onEdit={openEdit}
          onDelete={(id) => deleteCoupon.mutate(id)}
          onToggle={(c) => setActive.mutate({ id: c.id, isActive: !c.isActive })}
          isDeleting={deleteCoupon.isPending}
        />
      )}

      <CouponForm
        key={selected?.id ?? 'new'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        coupon={selected}
        otherCodes={rows.filter((c) => c.id !== selected?.id).map((c) => c.code)}
        onSubmit={submit}
        isLoading={createCoupon.isPending || updateCoupon.isPending}
      />
    </div>
  );
}
