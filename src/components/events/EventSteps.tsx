import { cn } from '@/lib/utils';
import {
  Check, Minus, Plus, Users, Calendar, Truck, Store, Utensils, Flame,
  UserX, ConciergeBell, type LucideIcon,
} from 'lucide-react';
import { LIVE_STATIONS } from '@/lib/eventCatalog';
import { suggestServers, type Occasion, type StationType } from '@/lib/eventPlanner';
import type { ServeStyle } from '@/lib/eventCatalog';
import type { StoreBranch } from '@/hooks/usePublicStore';
import { OCCASIONS, GUEST_BANDS, SERVE_STYLES } from './eventOptions';

const cardBase =
  'group press relative rounded-2xl border p-4 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[120px]';
const cardSel = 'border-primary ring-1 ring-primary bg-primary/[0.05] shadow-soft-lift';
const cardIdle = 'border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-soft-lift';

function IconTile({ icon: Icon, active, lg }: { icon: LucideIcon; active?: boolean; lg?: boolean }) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-2xl transition-all duration-200',
        lg ? 'w-14 h-14' : 'w-11 h-11',
        active
          ? 'bg-primary text-primary-foreground shadow-rose-glow'
          : 'bg-primary/[0.08] text-primary ring-1 ring-inset ring-primary/15 group-hover:bg-primary/[0.13]',
      )}
    >
      <Icon className={lg ? 'w-6 h-6' : 'w-5 h-5'} strokeWidth={1.75} />
    </span>
  );
}

function SelectedTick() {
  return (
    <span className="absolute top-2.5 end-2.5 w-5 h-5 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-sm">
      <Check className="w-3 h-3" strokeWidth={3} />
    </span>
  );
}

export function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl md:text-3xl leading-tight">{title}</h2>
      {sub && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{sub}</p>}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99, suffix }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="إنقاص"
        className="press w-10 h-10 rounded-full border border-border bg-card grid place-items-center disabled:opacity-40 hover:border-primary/50 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="min-w-[64px] text-center">
        <span className="font-display text-2xl"><bdi dir="ltr">{value}</bdi></span>
        {suffix && <span className="text-xs text-muted-foreground ms-1">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="زيادة"
        className="press w-10 h-10 rounded-full border border-border bg-card grid place-items-center disabled:opacity-40 hover:border-primary/50 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function OccasionStep({ value, onChange }: { value: Occasion | null; onChange: (o: Occasion) => void }) {
  return (
    <div>
      <StepHeading title="ما نوع مناسبتك؟" sub="نضبط لك الاقتراح حسب المناسبة." />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {OCCASIONS.map((o) => {
          const active = value === o.id;
          return (
            <button key={o.id} onClick={() => onChange(o.id)} className={cn(cardBase, active ? cardSel : cardIdle)}>
              {active && <SelectedTick />}
              <IconTile icon={o.icon} active={active} lg />
              <span className="font-bold text-sm">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GuestCountStep({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <StepHeading title="كم عدد ضيوفك تقريبًا؟" sub="نحسب الكميات بناءً على العدد." />
      <div className="flex flex-wrap gap-2.5">
        {GUEST_BANDS.map((b) => (
          <button
            key={b.label}
            onClick={() => onChange(b.value)}
            className={cn(
              'press rounded-full border px-5 h-12 font-bold transition-all',
              value === b.value
                ? 'border-primary bg-primary text-primary-foreground shadow-rose-glow'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <bdi dir="ltr">{b.label}</bdi>
          </button>
        ))}
      </div>
      <div className="mt-6 max-w-xs">
        <label className="text-sm font-semibold mb-2 block">أو اكتب العدد بالضبط</label>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 h-14 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
          <Users className="w-5 h-5 text-primary shrink-0" />
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={value || ''}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="80"
            dir="ltr"
            className="w-full bg-transparent outline-none text-lg font-bold text-start"
          />
          <span className="text-sm text-muted-foreground shrink-0">ضيف</span>
        </div>
      </div>
    </div>
  );
}

export function ServeStylesStep({ value, onChange }: { value: ServeStyle[]; onChange: (s: ServeStyle[]) => void }) {
  const toggle = (id: ServeStyle) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div>
      <StepHeading title="ما الذي تحب تقديمه لضيوفك؟" sub="يمكنك اختيار أكثر من صنف." />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVE_STYLES.map((s) => {
          const on = value.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)} className={cn(cardBase, on ? cardSel : cardIdle)}>
              {on && <SelectedTick />}
              <IconTile icon={s.icon} active={on} lg />
              <span className="font-bold text-sm leading-tight">{s.label}</span>
              <span className="text-[11px] text-muted-foreground -mt-1.5">{s.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StationStep({ stationType, liveStationId, onChange }: {
  stationType: StationType; liveStationId: string | null;
  onChange: (patch: { stationType?: StationType; liveStationId?: string | null }) => void;
}) {
  const opts: { id: StationType; label: string; icon: LucideIcon; hint: string }[] = [
    { id: 'none', label: 'لا، يكفي التوصيل', icon: Truck, hint: 'نوصّل الطلب جاهزاً' },
    { id: 'ready_corner', label: 'ركن حلا جاهز', icon: Utensils, hint: 'ركن مجهّز في موقعك' },
    { id: 'live', label: 'محطة حية', icon: Flame, hint: 'كنافة / وافل / قهوة مختصة' },
  ];
  return (
    <div>
      <StepHeading title="هل تريد ركن ضيافة في موقع المناسبة؟" sub="اختياري — يضيف لمسة مميزة لضيوفك." />
      <div className="grid sm:grid-cols-3 gap-3">
        {opts.map((o) => {
          const active = stationType === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange({ stationType: o.id, liveStationId: o.id === 'live' ? (liveStationId ?? LIVE_STATIONS[0].id) : null })}
              className={cn(cardBase, active ? cardSel : cardIdle)}
            >
              {active && <SelectedTick />}
              <IconTile icon={o.icon} active={active} lg />
              <span className="font-bold text-sm">{o.label}</span>
              <span className="text-[11px] text-muted-foreground -mt-1.5">{o.hint}</span>
            </button>
          );
        })}
      </div>
      {stationType === 'live' && (
        <div className="mt-5">
          <div className="text-sm font-semibold mb-2.5">اختر نوع المحطة الحية</div>
          <div className="flex flex-wrap gap-2.5">
            {LIVE_STATIONS.map((s) => {
              const active = liveStationId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onChange({ liveStationId: s.id })}
                  className={cn(
                    'press inline-flex items-center gap-2 rounded-full border ps-3 pe-4 h-11 transition-all',
                    active ? 'border-primary bg-primary/[0.08] text-primary font-semibold' : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <s.icon className="w-4 h-4" strokeWidth={1.75} />
                  {s.name.replace('محطة حية — ', '')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServersStep({ guests, serversNeeded, serversCount, serviceHours, onChange }: {
  guests: number; serversNeeded: boolean; serversCount: number; serviceHours: number;
  onChange: (patch: { serversNeeded?: boolean; serversCount?: number; serviceHours?: number }) => void;
}) {
  const suggested = suggestServers(guests);
  return (
    <div>
      <StepHeading title="هل تحتاج مقدّمي ضيافة في الموقع؟" sub="فريق يخدم الضيوف ويرتّب الطاولة طوال المناسبة." />
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <button onClick={() => onChange({ serversNeeded: false })} className={cn(cardBase, !serversNeeded ? cardSel : cardIdle)}>
          {!serversNeeded && <SelectedTick />}
          <IconTile icon={UserX} active={!serversNeeded} lg />
          <span className="font-bold text-sm">لا، شكراً</span>
        </button>
        <button
          onClick={() => onChange({ serversNeeded: true, serversCount: serversCount || suggested, serviceHours: serviceHours || 3 })}
          className={cn(cardBase, serversNeeded ? cardSel : cardIdle)}
        >
          {serversNeeded && <SelectedTick />}
          <IconTile icon={ConciergeBell} active={serversNeeded} lg />
          <span className="font-bold text-sm">نعم، أحتاج</span>
        </button>
      </div>

      {serversNeeded && (
        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 max-w-md shadow-soft-lift">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-sm">عدد المقدّمين</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">اقترحنا <bdi dir="ltr">{suggested}</bdi> حسب عدد ضيوفك</div>
            </div>
            <Stepper value={serversCount} min={1} max={20} onChange={(n) => onChange({ serversCount: n })} />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-5">
            <div>
              <div className="font-semibold text-sm">عدد ساعات الخدمة</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">المدة في الموقع</div>
            </div>
            <Stepper value={serviceHours} min={1} max={12} suffix="ساعة" onChange={(n) => onChange({ serviceHours: n })} />
          </div>
        </div>
      )}
    </div>
  );
}

export function WhenWhereStep({ eventDate, branchId, fulfillmentMode, branches, minDate, onChange }: {
  eventDate: string | null; branchId: string | null; fulfillmentMode: 'delivery' | 'onsite_setup';
  branches: StoreBranch[]; minDate: string;
  onChange: (patch: { eventDate?: string; branchId?: string; fulfillmentMode?: 'delivery' | 'onsite_setup' }) => void;
}) {
  return (
    <div>
      <StepHeading title="متى وأين؟" sub="ضيافة المناسبات تحتاج تجهيز مسبق — يُفضّل الطلب قبل 3 أيام على الأقل." />
      <div className="space-y-5 max-w-md">
        <div>
          <label className="text-sm font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> تاريخ المناسبة</label>
          <input
            type="date"
            min={minDate}
            value={eventDate ?? ''}
            onChange={(e) => onChange({ eventDate: e.target.value })}
            className="w-full rounded-2xl border border-border bg-card px-4 h-14 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-start"
          />
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> الفرع</label>
          <div className="grid gap-2">
            {branches.map((b) => {
              const active = branchId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => onChange({ branchId: b.id })}
                  className={cn(
                    'press rounded-2xl border px-4 py-3 text-start transition-all flex items-center justify-between gap-3',
                    active ? 'border-primary ring-1 ring-primary bg-primary/[0.05]' : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <span>
                    <span className="font-bold text-sm block">{b.name}</span>
                    {b.address && <span className="text-[11px] text-muted-foreground">{b.address}</span>}
                  </span>
                  <span className={cn('w-6 h-6 rounded-full grid place-items-center shrink-0 transition-colors', active ? 'bg-primary text-primary-foreground' : 'border-2 border-border')}>
                    {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 block">طريقة الاستلام</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onChange({ fulfillmentMode: 'delivery' })}
              className={cn(cardBase, 'min-h-[96px]', fulfillmentMode === 'delivery' ? cardSel : cardIdle)}
            >
              <IconTile icon={Truck} active={fulfillmentMode === 'delivery'} />
              <span className="font-bold text-sm">توصيل</span>
            </button>
            <button
              onClick={() => onChange({ fulfillmentMode: 'onsite_setup' })}
              className={cn(cardBase, 'min-h-[96px]', fulfillmentMode === 'onsite_setup' ? cardSel : cardIdle)}
            >
              <IconTile icon={Store} active={fulfillmentMode === 'onsite_setup'} />
              <span className="font-bold text-sm">تجهيز في الموقع</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
