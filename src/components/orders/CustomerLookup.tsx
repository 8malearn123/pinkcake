import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import { validateKsaPhone } from '@/lib/validation';
import { cn } from '@/lib/utils';
import {
  Search,
  Loader2,
  UserCheck,
  UserPlus,
  UserX,
  Phone,
  RotateCcw,
  Pencil,
} from 'lucide-react';

/** The customer fields every order form collects. */
export interface CustomerFields {
  name: string;
  phone: string;
  address: string;
}

/**
 * Where the lookup stands:
 * - `idle`    — nothing chosen yet; the phone search box is showing.
 * - `matched` — an existing customer was found for the number.
 * - `manual`  — staff are typing the full details (new customer, or editing a
 *               found one; both are upserted by phone on submit).
 */
export type CustomerLookupStatus = 'idle' | 'matched' | 'manual';

interface CustomerLookupProps {
  value: CustomerFields;
  /** Patch one or more fields on the parent's state/form. */
  onChange: (patch: Partial<CustomerFields>) => void;
  status: CustomerLookupStatus;
  onStatusChange: (status: CustomerLookupStatus) => void;
  /** Validation messages owned by the parent form, rendered under the inputs. */
  errors?: Partial<Record<keyof CustomerFields, string>>;
  disabled?: boolean;
}

/**
 * Customer step shared by the order forms: look the customer up by mobile
 * number first, and only then either use the record we found or add a new one.
 *
 * Staff never start from a blank name field — the phone is the key (the create
 * RPCs upsert the customer by phone), so searching first is what keeps one
 * customer from being duplicated under three spellings of their name.
 */
export function CustomerLookup({
  value,
  onChange,
  status,
  onStatusChange,
  errors,
  disabled,
}: CustomerLookupProps) {
  const lookup = useCustomerLookup();
  // The number being searched — separate from `value.phone`, which only gets
  // written once a customer is actually resolved (found or added).
  const [query, setQuery] = useState(value.phone);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [missedPhone, setMissedPhone] = useState<string | null>(null);

  const runSearch = async () => {
    const phone = query.trim();
    const message = validateKsaPhone(phone);
    if (message) {
      setQueryError(message);
      setMissedPhone(null);
      return;
    }
    setQueryError(null);

    const customer = await lookup.mutateAsync(phone).catch(() => undefined);
    if (customer === undefined) return; // request failed — the hook already toasted

    if (customer) {
      setMissedPhone(null);
      onChange({
        name: customer.name,
        phone: customer.phone,
        address: customer.address ?? '',
      });
      onStatusChange('matched');
      return;
    }

    // Unknown number — offer to add the customer with this phone.
    setMissedPhone(phone);
  };

  const startNewCustomer = () => {
    onChange({ name: '', phone: missedPhone ?? query.trim(), address: '' });
    setMissedPhone(null);
    onStatusChange('manual');
  };

  const searchAgain = () => {
    onChange({ name: '', phone: '', address: '' });
    setQuery('');
    setQueryError(null);
    setMissedPhone(null);
    lookup.reset();
    onStatusChange('idle');
  };

  /* ---------- Step 1: look the number up ---------- */
  if (status === 'idle') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerLookupPhone">رقم الجوال *</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="customerLookupPhone"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (queryError) setQueryError(null);
                if (missedPhone) setMissedPhone(null);
              }}
              onKeyDown={(e) => {
                // Enter searches — it must never submit the surrounding form.
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder="05xxxxxxxx"
              dir="ltr"
              className="text-start sm:flex-1"
              inputMode="tel"
              autoComplete="tel"
              disabled={disabled || lookup.isPending}
              aria-invalid={!!queryError}
              aria-describedby={queryError ? 'customerLookupPhone-error' : 'customerLookupPhone-hint'}
            />
            <Button
              type="button"
              onClick={runSearch}
              disabled={disabled || lookup.isPending}
              className="gradient-pink text-white sm:min-w-[140px]"
            >
              {lookup.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="me-2 h-4 w-4" />
              )}
              استعلام
            </Button>
          </div>
          {queryError ? (
            <p id="customerLookupPhone-error" className="text-sm text-destructive">
              {queryError}
            </p>
          ) : (
            <p id="customerLookupPhone-hint" className="text-sm text-muted-foreground">
              ابحث عن العميل برقم جواله أولاً — إن لم يكن مسجّلاً يمكنك إضافته بالبيانات الكاملة.
            </p>
          )}
        </div>

        {missedPhone && (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <UserX className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">لا يوجد عميل مسجّل بهذا الرقم</p>
                <p className="text-sm text-muted-foreground">
                  الرقم <span dir="ltr">{missedPhone}</span> غير موجود — أضِفه كعميل جديد بالبيانات
                  الكاملة.
                </p>
              </div>
            </div>
            <Button type="button" onClick={startNewCustomer} className="shrink-0">
              <UserPlus className="me-2 h-4 w-4" />
              إضافة عميل جديد
            </Button>
          </div>
        )}
      </div>
    );
  }

  /* ---------- Step 2a: an existing customer was found ---------- */
  if (status === 'matched') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <UserCheck className="h-4 w-4" />
              عميل مسجّل
            </span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onStatusChange('manual')}>
                <Pencil className="me-2 h-3.5 w-3.5" />
                تعديل البيانات
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={searchAgain}>
                <RotateCcw className="me-2 h-3.5 w-3.5" />
                بحث برقم آخر
              </Button>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <CustomerFact label="اسم العميل" value={value.name} />
            <CustomerFact label="رقم الجوال" value={value.phone} ltr />
            <CustomerFact label="العنوان" value={value.address} />
          </dl>
        </div>
      </div>
    );
  }

  /* ---------- Step 2b: full details for a new (or edited) customer ---------- */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <Phone className="h-4 w-4 text-primary" />
          <span dir="ltr">{value.phone}</span>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={searchAgain}>
          <RotateCcw className="me-2 h-3.5 w-3.5" />
          بحث برقم آخر
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerName">اسم العميل *</Label>
          <Input
            id="customerName"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="أدخل اسم العميل"
            className="text-start"
            maxLength={100}
            disabled={disabled}
            aria-invalid={!!errors?.name}
            aria-describedby={errors?.name ? 'customerName-error' : undefined}
          />
          {errors?.name && (
            <p id="customerName-error" className="text-sm text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerAddress">العنوان (اختياري)</Label>
          <Input
            id="customerAddress"
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="أدخل عنوان العميل"
            className="text-start"
            maxLength={500}
            disabled={disabled}
            aria-invalid={!!errors?.address}
            aria-describedby={errors?.address ? 'customerAddress-error' : undefined}
          />
          {errors?.address && (
            <p id="customerAddress-error" className="text-sm text-destructive">
              {errors.address}
            </p>
          )}
        </div>
      </div>

      {errors?.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
    </div>
  );
}

/** One label/value pair in the matched-customer card. */
function CustomerFact({
  label,
  value,
  ltr,
}: {
  label: string;
  value?: string;
  ltr?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn('truncate font-medium text-foreground', !value && 'text-muted-foreground')}
        dir={ltr ? 'ltr' : undefined}
      >
        {value?.trim() ? value : '—'}
      </dd>
    </div>
  );
}
