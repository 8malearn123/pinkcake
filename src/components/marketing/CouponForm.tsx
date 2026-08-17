import { useEffect, useMemo, useState } from 'react';
import { Loader2, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { RiyalSymbol } from '@/components/ui/riyal';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/useProducts';
import { MAX_PERCENT, couponDiscount, normalizeCode, validateDraft } from '@/lib/marketing/coupon';
import type { Coupon, CouponDraft, CouponKind, CouponScope } from '@/lib/marketing/types';

/**
 * نموذج الكوبون.
 *
 * الفحص هنا يستدعي `validateDraft` نفسها التي تستدعيها طبقة البيانات، فلا
 * تنفرد الواجهة بقاعدة ولا يمرّ كوبون فاسد لأن أحداً نادى الدالة مباشرة. لهذا
 * لا zod هنا: القواعد أصلاً مكتوبة مرّة واحدة في `src/lib/marketing/coupon.ts`،
 * وتكرارها في مخطّط ثانٍ يعني نسختين تفترقان.
 *
 * «معاينة على سلة» أسفل النموذج ليست زينة: الفرق بين ١٥٪ بسقف ٤٠ ريالاً و١٥٪
 * بلا سقف لا يظهر إلا كرقم على سلة حقيقية.
 */

const KIND_LABELS: Record<CouponKind, string> = {
  percent: 'نسبة مئوية',
  fixed: 'مبلغ ثابت',
  free_delivery: 'توصيل مجاني',
};

const SCOPE_LABELS: Record<CouponScope, string> = {
  all: 'كل المنتجات',
  category: 'تصنيفات محدّدة',
  product: 'منتجات محدّدة',
};

/** حقول النموذج. الأرقام الاختيارية نصوص كي يعبّر الفراغ عن «بلا حد». */
interface FormState {
  code: string;
  kind: CouponKind;
  value: string;
  maxDiscount: string;
  minOrder: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  firstOrderOnly: boolean;
  scope: CouponScope;
  scopeValues: string[];
  stackableWithLoyalty: boolean;
  isActive: boolean;
  note: string;
}

const EMPTY: FormState = {
  code: '',
  kind: 'percent',
  value: '10',
  maxDiscount: '',
  minOrder: '0',
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  perCustomerLimit: '',
  firstOrderOnly: false,
  scope: 'all',
  scopeValues: [],
  stackableWithLoyalty: false,
  isActive: true,
  note: '',
};

function fromCoupon(coupon: Coupon | null): FormState {
  if (!coupon) return EMPTY;
  return {
    code: coupon.code,
    kind: coupon.kind,
    value: String(coupon.value ?? 0),
    maxDiscount: coupon.maxDiscount == null ? '' : String(coupon.maxDiscount),
    minOrder: String(coupon.minOrder ?? 0),
    startsAt: coupon.startsAt ?? '',
    endsAt: coupon.endsAt ?? '',
    usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit),
    perCustomerLimit: coupon.perCustomerLimit == null ? '' : String(coupon.perCustomerLimit),
    firstOrderOnly: coupon.firstOrderOnly,
    scope: coupon.scope,
    scopeValues: coupon.scopeValues ?? [],
    stackableWithLoyalty: coupon.stackableWithLoyalty,
    isActive: coupon.isActive,
    note: coupon.note ?? '',
  };
}

const num = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

function toDraft(form: FormState): CouponDraft {
  // خاصية خاصية لا تحويل جملة: تحت `strict: false` يمرّ حقل ناقص صامتاً.
  return {
    code: normalizeCode(form.code),
    kind: form.kind,
    value: form.kind === 'free_delivery' ? 0 : (num(form.value) ?? 0),
    maxDiscount: form.kind === 'percent' ? num(form.maxDiscount) : null,
    minOrder: num(form.minOrder) ?? 0,
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    usageLimit: num(form.usageLimit),
    perCustomerLimit: num(form.perCustomerLimit),
    firstOrderOnly: form.firstOrderOnly,
    scope: form.scope,
    scopeValues: form.scope === 'all' ? [] : form.scopeValues,
    stackableWithLoyalty: form.stackableWithLoyalty,
    isActive: form.isActive,
    note: form.note.trim(),
  };
}

/** سلة افتراضية للمعاينة — قيمة قريبة من متوسّط الطلب. */
const PREVIEW_BASKET = 200;

interface CouponFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  /** رموز الكوبونات الأخرى — لمنع التكرار. */
  otherCodes: string[];
  onSubmit: (draft: CouponDraft) => void;
  isLoading?: boolean;
}

export function CouponForm({
  open,
  onOpenChange,
  coupon,
  otherCodes,
  onSubmit,
  isLoading,
}: CouponFormProps) {
  const [form, setForm] = useState<FormState>(() => fromCoupon(coupon));
  const [error, setError] = useState<string | null>(null);
  const { data: products } = useProducts();

  useEffect(() => {
    if (open) {
      setForm(fromCoupon(coupon));
      setError(null);
    }
  }, [coupon, open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const categories = useMemo(
    () =>
      [
        ...new Set(
          (products ?? [])
            .map((p) => p.category)
            .filter((c): c is string => !!c && c.trim() !== ''),
        ),
      ].sort(),
    [products],
  );

  const draft = toDraft(form);
  const preview = couponDiscount(
    { ...draft, id: '', createdAt: 0, redemptions: 0, discountGiven: 0, revenue: 0 },
    PREVIEW_BASKET,
  );

  const submit = () => {
    const message = validateDraft(draft, otherCodes);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    onSubmit(draft);
  };

  const toggleScopeValue = (value: string) =>
    setForm((f) => ({
      ...f,
      scopeValues: f.scopeValues.includes(value)
        ? f.scopeValues.filter((v) => v !== value)
        : [...f.scopeValues, value],
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? 'تعديل الكوبون' : 'كوبون جديد'}</DialogTitle>
          <DialogDescription>
            الرمز هو ما تكتبه العميلة في السلة — اجعله قصيراً وسهل الإملاء.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* الرمز والنوع */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code">الرمز *</Label>
              <Input
                id="coupon-code"
                dir="ltr"
                className="text-start font-mono tracking-wider"
                placeholder="CAKE15"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coupon-kind">نوع الخصم</Label>
              <Select value={form.kind} onValueChange={(v) => set('kind', v as CouponKind)}>
                <SelectTrigger id="coupon-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  {(Object.keys(KIND_LABELS) as CouponKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* القيمة والسقف */}
          {form.kind !== 'free_delivery' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberInput
                id="coupon-value"
                label={form.kind === 'percent' ? `النسبة (١–${MAX_PERCENT})` : 'قيمة الخصم'}
                riyal={form.kind === 'fixed'}
                value={form.value}
                onChange={(v) => set('value', v)}
              />
              {form.kind === 'percent' && (
                <NumberInput
                  id="coupon-cap"
                  label="سقف الخصم"
                  riyal
                  placeholder="بلا سقف"
                  hint="نسبة بلا سقف على طلب ضيافة كبير تعني خصماً بمئات الريالات."
                  value={form.maxDiscount}
                  onChange={(v) => set('maxDiscount', v)}
                />
              )}
            </div>
          )}

          {/* الشروط */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberInput
              id="coupon-min"
              label="أدنى قيمة طلب"
              riyal
              placeholder="0"
              value={form.minOrder}
              onChange={(v) => set('minOrder', v)}
            />
            <NumberInput
              id="coupon-limit"
              label="سقف الاستخدام الكلي"
              placeholder="بلا سقف"
              value={form.usageLimit}
              onChange={(v) => set('usageLimit', v)}
            />
            <NumberInput
              id="coupon-per-customer"
              label="سقف الاستخدام لكل عميلة"
              placeholder="بلا سقف"
              value={form.perCustomerLimit}
              onChange={(v) => set('perCustomerLimit', v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-start">يبدأ في</Label>
                <Input
                  id="coupon-start"
                  type="date"
                  dir="ltr"
                  value={form.startsAt}
                  onChange={(e) => set('startsAt', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-end">ينتهي في</Label>
                <Input
                  id="coupon-end"
                  type="date"
                  dir="ltr"
                  value={form.endsAt}
                  onChange={(e) => set('endsAt', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* النطاق */}
          <div className="space-y-2">
            <Label htmlFor="coupon-scope">ينطبق على</Label>
            <Select
              value={form.scope}
              onValueChange={(v) => setForm((f) => ({ ...f, scope: v as CouponScope, scopeValues: [] }))}
            >
              <SelectTrigger id="coupon-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                {(Object.keys(SCOPE_LABELS) as CouponScope[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SCOPE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.scope !== 'all' && (
              <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border p-3">
                {(form.scope === 'category'
                  ? categories
                  : (products ?? []).map((p) => p.id)
                ).map((value) => {
                  const label =
                    form.scope === 'category'
                      ? value
                      : ((products ?? []).find((p) => p.id === value)?.name ?? value);
                  const picked = form.scopeValues.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => toggleScopeValue(value)}
                    >
                      <Badge variant={picked ? 'default' : 'outline'} className="cursor-pointer">
                        {label}
                      </Badge>
                    </button>
                  );
                })}
                {(form.scope === 'category' ? categories : (products ?? [])).length === 0 && (
                  <p className="text-sm text-muted-foreground">لا توجد خيارات بعد.</p>
                )}
              </div>
            )}
          </div>

          {/* المفاتيح */}
          <div className="space-y-3">
            <ToggleRow
              id="coupon-first-order"
              label="أوّل طلب فقط"
              hint="الترحيبية. تُحسب على أوّل طلب مكتمل للعميلة."
              checked={form.firstOrderOnly}
              onChange={(v) => set('firstOrderOnly', v)}
            />
            <ToggleRow
              id="coupon-stackable"
              label="يُجمع مع مكافأة ولاء"
              hint="مكافآت «دائرة المناسبات» عينية لا خصماً — جمعها مع كوبون يضاعف الكلفة على الطلب نفسه."
              checked={form.stackableWithLoyalty}
              onChange={(v) => set('stackableWithLoyalty', v)}
            />
            <ToggleRow
              id="coupon-active"
              label="مفعّل"
              hint="الإيقاف يُبقي الرمز وأرقامه ويرفضه عند العميلة."
              checked={form.isActive}
              onChange={(v) => set('isActive', v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coupon-note">ملاحظة داخلية</Label>
            <Textarea
              id="coupon-note"
              rows={2}
              placeholder="لماذا أُنشئ هذا الرمز ومن يستخدمه"
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">لا تظهر للعميلة أبداً.</p>
          </div>

          {/* المعاينة */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TicketPercent className="size-4 text-primary" />
              على سلة بـ<bdi>{PREVIEW_BASKET}</bdi> <RiyalSymbol className="size-3.5" />
            </div>
            <div className="text-end">
              {form.kind === 'free_delivery' ? (
                <span className="font-bold text-primary">التوصيل مجاناً</span>
              ) : (
                <span className="font-bold text-primary">
                  خصم <bdi>{preview}</bdi> <RiyalSymbol className="inline size-3.5" />
                </span>
              )}
              {draft.minOrder > PREVIEW_BASKET && (
                <p className="mt-0.5 text-xs text-warning">
                  لن ينطبق — أدنى قيمة طلب أعلى من هذه السلة.
                </p>
              )}
            </div>
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
            {coupon ? 'حفظ التغييرات' : 'إنشاء الكوبون'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  riyal,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  riyal?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {label}
        {riyal && <RiyalSymbol className="size-3.5 text-muted-foreground" />}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        dir="ltr"
        className="text-end"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
  className,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 rounded-2xl border border-border p-4', className)}>
      <div className="min-w-0">
        <Label htmlFor={id} className="font-semibold">
          {label}
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
