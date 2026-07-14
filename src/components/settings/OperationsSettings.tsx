import { useState } from 'react';
import { SectionCard } from '@/components/ds';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RiyalSymbol } from '@/components/ui/riyal';
import { useSettings, type DayKey } from '@/contexts/SettingsContext';
import { Truck, Clock, Save, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DAY_ORDER: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS: Record<DayKey, string> = {
  sun: 'الأحد', mon: 'الاثنين', tue: 'الثلاثاء', wed: 'الأربعاء',
  thu: 'الخميس', fri: 'الجمعة', sat: 'السبت',
};

/**
 * Operational settings (task A1) — delivery fee / free-delivery threshold (read
 * by the storefront checkout) and working hours. Persisted via SettingsContext
 * (localStorage), matching how store info & colors already work.
 */
export function OperationsSettings() {
  const { settings, updateDelivery, updateHours } = useSettings();
  const [freeThreshold, setFreeThreshold] = useState(String(settings.delivery.freeThreshold));
  const [fee, setFee] = useState(String(settings.delivery.fee));
  const [saved, setSaved] = useState(false);

  const saveDelivery = () => {
    const t = Number(freeThreshold);
    const f = Number(fee);
    if (Number.isNaN(t) || t < 0 || Number.isNaN(f) || f < 0) {
      return toast({ title: 'قيمة غير صالحة', description: 'أدخل أرقاماً صحيحة غير سالبة.', variant: 'destructive' });
    }
    updateDelivery({ freeThreshold: t, fee: f });
    setSaved(true);
    toast({ title: 'تم الحفظ', description: 'تم حفظ إعدادات التوصيل' });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionCard title="التوصيل" icon={Truck} contentClassName="space-y-4">
        <p className="text-sm text-muted-foreground -mt-2">
          تُستخدم هذه القيم في سلة العميل لحساب رسوم التوصيل وحد التوصيل المجاني.
        </p>
        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="freeThreshold">حد التوصيل المجاني</Label>
            <div className="flex items-center gap-2">
              <Input id="freeThreshold" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} inputMode="numeric" dir="ltr" className="text-start" />
              <RiyalSymbol className="shrink-0 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fee">رسوم التوصيل</Label>
            <div className="flex items-center gap-2">
              <Input id="fee" value={fee} onChange={(e) => setFee(e.target.value)} inputMode="numeric" dir="ltr" className="text-start" />
              <RiyalSymbol className="shrink-0 text-muted-foreground" />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          الطلبات بقيمة {freeThreshold || 0} <RiyalSymbol /> فأكثر تحصل على توصيل مجاني؛ وإلا تُضاف {fee || 0} <RiyalSymbol />.
        </p>
        <Button onClick={saveDelivery} className="gap-2">
          {saved ? <><Check className="w-4 h-4" /> تم الحفظ</> : <><Save className="w-4 h-4" /> حفظ إعدادات التوصيل</>}
        </Button>
      </SectionCard>

      <SectionCard title="ساعات العمل" icon={Clock} contentClassName="space-y-3">
        <p className="text-sm text-muted-foreground -mt-2">
          حدّد أيام وساعات العمل. تُحفظ للعرض والتخطيط ولا تحجب الطلبات حالياً (انظر HANDOFF).
        </p>
        <div className="space-y-2">
          {DAY_ORDER.map((day) => {
            const h = settings.hours[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className="w-16 shrink-0 text-sm font-medium">{DAY_LABELS[day]}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={!h.closed} onCheckedChange={(v) => updateHours(day, { closed: !v })} aria-label={`تفعيل يوم ${DAY_LABELS[day]}`} />
                  <span className="w-10 text-xs text-muted-foreground">{h.closed ? 'مغلق' : 'مفتوح'}</span>
                </div>
                <div className={h.closed ? 'pointer-events-none flex items-center gap-2 opacity-40' : 'flex items-center gap-2'}>
                  <Input type="time" value={h.open} onChange={(e) => updateHours(day, { open: e.target.value })} aria-label={`وقت فتح ${DAY_LABELS[day]}`} dir="ltr" className="h-9 w-28" />
                  <span className="text-sm text-muted-foreground">—</span>
                  <Input type="time" value={h.close} onChange={(e) => updateHours(day, { close: e.target.value })} aria-label={`وقت إغلاق ${DAY_LABELS[day]}`} dir="ltr" className="h-9 w-28" />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
