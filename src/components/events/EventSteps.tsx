import { cn } from '@/lib/utils';
import { Check, Minus, Plus, Users, Calendar, Truck, Store } from 'lucide-react';
import { LIVE_STATIONS } from '@/lib/eventCatalog';
import { suggestServers, type Occasion, type StationType } from '@/lib/eventPlanner';
import type { ServeStyle } from '@/lib/eventCatalog';
import type { StoreBranch } from '@/hooks/usePublicStore';
import { OCCASIONS, GUEST_BANDS, SERVE_STYLES } from './eventOptions';

const cardBase =
  'press relative rounded-2xl border p-4 text-center transition-all flex flex-col items-center justify-center gap-2.5 min-h-[112px]';
const cardSel = 'border-primary ring-1 ring-primary bg-primary/[0.06] shadow-soft-lift';
const cardIdle = 'border-border bg-card hover:border-primary/40';

function EmojiTile({ children, lg }: { children: React.ReactNode; lg?: boolean }) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-2xl bg-gradient-to-br from-blush to-card border border-border/40 shadow-inner',
        lg ? 'w-14 h-14 text-3xl' : 'w-11 h-11 text-2xl',
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}

export function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl md:text-3xl leading-tight">{title}</h2>
      {sub && <p className="text-sm text-muted-foreground mt-2">{sub}</p>}
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
        className="press w-10 h-10 rounded-full border border-border bg-card grid place-items-center disabled:opacity-40 hover:border-primary/50"
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
        className="press w-10 h-10 rounded-full border border-border bg-card grid place-items-center disabled:opacity-40 hover:border-primary/50"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function OccasionStep({ value, onChange }: { value: Occasion | null; onChange: (o: Occasion) => void }) {
  return (
    <div>
      <StepHeading title="وش نوع مناسبتك؟" sub="نضبط لكِ الاقتراح حسب المناسبة." />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {OCCASIONS.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} className={cn(cardBase, value === o.id ? cardSel : cardIdle)}>
            <EmojiTile lg>{o.emoji}</EmojiTile>
            <span className="font-bold text-sm">{o.label}</span>
          </button>
        ))}
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
              value === b.value ? 'border-primary bg-primary/[0.08] text-primary' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <bdi dir="ltr">{b.label}</bdi>
          </button>
        ))}
      </div>
      <div className="mt-5 max-w-xs">
        <label className="text-sm font-semibold mb-2 block">أو اكتبي العدد بالضبط</label>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 h-14 focus-within:border-primary transition-colors">
          <Users className="w-5 h-5 text-primary shrink-0" />
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={value || ''}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="٨٠"
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
      <StepHeading title="وش تحبّين نقدّمين لضيوفك؟" sub="تقدرين تختارين أكثر من خيار." />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVE_STYLES.map((s) => {
          const on = value.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)} className={cn(cardBase, on ? cardSel : cardIdle)}>
              {on && (
                <span className="absolute top-2 end-2 w-5 h-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <EmojiTile lg>{s.emoji}</EmojiTile>
              <span className="font-bold text-sm leading-tight">{s.label}</span>
              <span className="text-[11px] text-muted-foreground">{s.hint}</span>
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
  const opts: { id: StationType; label: string; emoji: string; hint: string }[] = [
    { id: 'none', label: 'لا، يكفي التوصيل', emoji: '🚚', hint: 'نوصّل الطلب جاهزاً' },
    { id: 'ready_corner', label: 'ركن حلا جاهز', emoji: '🍽️', hint: 'ركن مجهّز في موقعك' },
    { id: 'live', label: 'محطة حية', emoji: '🔥', hint: 'كنافة / وافل / قهوة مختصة' },
  ];
  return (
    <div>
      <StepHeading title="تبغين ركن ضيافة في موقع المناسبة؟" sub="اختياري — يضيف لمسة مميزة لضيوفك." />
      <div className="grid sm:grid-cols-3 gap-3">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange({ stationType: o.id, liveStationId: o.id === 'live' ? (liveStationId ?? LIVE_STATIONS[0].id) : null })}
            className={cn(cardBase, stationType === o.id ? cardSel : cardIdle)}
          >
            <EmojiTile lg>{o.emoji}</EmojiTile>
            <span className="font-bold text-sm">{o.label}</span>
            <span className="text-[11px] text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>
      {stationType === 'live' && (
        <div className="mt-5">
          <div className="text-sm font-semibold mb-2.5">اختاري نوع المحطة الحية</div>
          <div className="flex flex-wrap gap-2.5">
            {LIVE_STATIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => onChange({ liveStationId: s.id })}
                className={cn(
                  'press inline-flex items-center gap-2 rounded-full border ps-3 pe-4 h-11 transition-all',
                  liveStationId === s.id ? 'border-primary bg-primary/[0.08] text-primary font-semibold' : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <span className="text-lg" aria-hidden>{s.emoji}</span>
                {s.name.replace('محطة حية — ', '')}
              </button>
            ))}
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
      <StepHeading title="تحتاجين مقدّمي ضيافة في الموقع؟" sub="فريق يخدم الضيوف ويرتّب الطاولة طوال المناسبة." />
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <button
          onClick={() => onChange({ serversNeeded: false })}
          className={cn(cardBase, !serversNeeded ? cardSel : cardIdle)}
        >
          <EmojiTile lg>🙅‍♀️</EmojiTile>
          <span className="font-bold text-sm">لا، شكراً</span>
        </button>
        <button
          onClick={() => onChange({ serversNeeded: true, serversCount: serversCount || suggested, serviceHours: serviceHours || 3 })}
          className={cn(cardBase, serversNeeded ? cardSel : cardIdle)}
        >
          <EmojiTile lg>🤵</EmojiTile>
          <span className="font-bold text-sm">نعم، أحتاج</span>
        </button>
      </div>

      {serversNeeded && (
        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card/60 p-5 max-w-md">
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
      <StepHeading title="متى وأين؟" sub="ضيافة المناسبات تحتاج تجهيز مسبق — يُفضّل الطلب قبل ٣ أيام على الأقل." />
      <div className="space-y-5 max-w-md">
        <div>
          <label className="text-sm font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> تاريخ المناسبة</label>
          <input
            type="date"
            min={minDate}
            value={eventDate ?? ''}
            onChange={(e) => onChange({ eventDate: e.target.value })}
            className="w-full rounded-2xl border border-border bg-card px-4 h-14 outline-none focus:border-primary transition-colors text-start"
          />
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> الفرع</label>
          <div className="grid gap-2">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => onChange({ branchId: b.id })}
                className={cn(
                  'press rounded-2xl border px-4 py-3 text-start transition-all flex items-center justify-between gap-3',
                  branchId === b.id ? 'border-primary ring-1 ring-primary bg-primary/[0.06]' : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <span>
                  <span className="font-bold text-sm block">{b.name}</span>
                  {b.address && <span className="text-[11px] text-muted-foreground">{b.address}</span>}
                </span>
                {branchId === b.id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 block">طريقة الاستلام</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onChange({ fulfillmentMode: 'delivery' })}
              className={cn(cardBase, 'min-h-[88px]', fulfillmentMode === 'delivery' ? cardSel : cardIdle)}
            >
              <Truck className="w-6 h-6 text-primary" />
              <span className="font-bold text-sm">توصيل</span>
            </button>
            <button
              onClick={() => onChange({ fulfillmentMode: 'onsite_setup' })}
              className={cn(cardBase, 'min-h-[88px]', fulfillmentMode === 'onsite_setup' ? cardSel : cardIdle)}
            >
              <Store className="w-6 h-6 text-primary" />
              <span className="font-bold text-sm">تجهيز في الموقع</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
