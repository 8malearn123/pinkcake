import { useState } from 'react';
import { SectionCard } from '@/components/ds';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RiyalSymbol } from '@/components/ui/riyal';
import { TicketPercent, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCoupons, useSaveCoupon, useDeleteCoupon, type Coupon } from '@/hooks/useCoupons';

/**
 * Admin coupon management (task A2). CRUD over the same COUPONS source the
 * customer checkout validates against (validate_coupon), so codes created here
 * work at checkout immediately in demo mode.
 */
export function CouponsSettings() {
  const { data: coupons = [], isLoading } = useCoupons();
  const saveCoupon = useSaveCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [code, setCode] = useState('');
  const [kind, setKind] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmed = code.trim().toUpperCase();
    const num = Number(value);
    if (!trimmed) return toast({ title: 'بيانات ناقصة', description: 'أدخل رمز الكوبون.', variant: 'destructive' });
    if (!num || num <= 0) return toast({ title: 'قيمة غير صالحة', description: 'أدخل قيمة خصم أكبر من صفر.', variant: 'destructive' });
    if (kind === 'percent' && num > 100) return toast({ title: 'قيمة غير صالحة', description: 'نسبة الخصم لا تتجاوز 100%.', variant: 'destructive' });
    if (coupons.some((c) => c.code.toUpperCase() === trimmed)) return toast({ title: 'رمز مكرر', description: 'هذا الرمز موجود بالفعل.', variant: 'destructive' });
    saveCoupon.mutate(
      { code: trimmed, kind, value: num, active: true },
      { onSuccess: () => { setCode(''); setValue(''); setKind('percent'); } },
    );
  };

  const toggleActive = (c: Coupon) => saveCoupon.mutate({ ...c, active: !c.active });

  return (
    <SectionCard title="أكواد الخصم" icon={TicketPercent} contentClassName="space-y-6">
      <p className="text-sm text-muted-foreground -mt-2">
        أنشئ أكواد خصم يستخدمها العملاء عند الدفع. التغييرات تظهر مباشرة في السلة (وضع تجريبي).
      </p>

      {/* Add form */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end rounded-2xl border border-border bg-card/50 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="couponCode">الرمز</Label>
          <Input id="couponCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: SUMMER20" dir="ltr" className="text-start" />
        </div>
        <div className="space-y-1.5">
          <Label>نوع الخصم</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as 'percent' | 'fixed')}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">نسبة مئوية %</SelectItem>
              <SelectItem value="fixed">مبلغ ثابت</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="couponValue">القيمة</Label>
          <Input id="couponValue" value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" placeholder={kind === 'percent' ? '10' : '25'} dir="ltr" className="w-full sm:w-24 text-start" />
        </div>
        <Button onClick={handleAdd} disabled={saveCoupon.isPending} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أكواد خصم بعد.</p>
        ) : (
          coupons.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <TicketPercent className="w-4 h-4 text-primary shrink-0" />
              <bdi dir="ltr" className="font-mono font-bold text-sm">{c.code}</bdi>
              <Badge variant="secondary" className="shrink-0">
                {c.kind === 'percent' ? `${c.value}%` : <>{c.value} <RiyalSymbol /></>}
              </Badge>
              <span className="flex-1 truncate text-xs text-muted-foreground">{c.description || ''}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground">{c.active ? 'مفعّل' : 'موقوف'}</span>
                <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} aria-label={c.active ? 'إيقاف الكوبون' : 'تفعيل الكوبون'} />
              </div>
              <Button size="icon" variant="ghost" aria-label="حذف الكوبون" className="h-8 w-8 shrink-0 text-destructive" onClick={() => deleteCoupon.mutate(c.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
