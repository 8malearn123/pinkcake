import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CalendarRange,
  Coins,
  Megaphone,
  Send,
  Sparkles,
  TicketPercent,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState, LoadingState, SectionCard, StatTile } from '@/components/ds';
import { RiyalSymbol } from '@/components/ui/riyal';
import { cn } from '@/lib/utils';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { formatSARText } from '@/lib/currency';
import { SEASON_ANCHORS } from '@/lib/loyalty/calendar';
import { applySeasonOverrides, daysUntilSeason, pendingSeasons } from '@/lib/marketing/seasons';
import {
  useCouponPerformance,
  useMarketingOverview,
  useSeasonOverrides,
  useSetSeasonOverride,
} from '@/hooks/useMarketing';

/**
 * «نظرة عامة» — الأداء والتقويم.
 *
 * المقياس الرئيس هنا **ليس** عدد مرّات الاستخدام بل «العائد على الخصم»: كم
 * ريالاً من الإيراد مقابل كل ريال تنازلنا عنه. كوبون يُستخدم كثيراً بعائد ١٫٢
 * ليس نجاحاً — هو تنازل عن هامش لعملاء كانوا سيشترون.
 *
 * والتقويم انتقل إلى هنا من «دائرة المناسبات» لأنه تقويم حملات لا إعداد ولاء —
 * وهو ما يقوله تعليق `src/lib/loyalty/calendar.ts` نفسه.
 */

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--primary) / 0.6)',
];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  fontSize: 13,
  boxShadow: '0 8px 24px hsl(var(--primary) / 0.12)',
};

type MarketingTab = 'overview' | 'coupons' | 'offers' | 'combos' | 'campaigns' | 'loyalty';

export function OverviewTab({ onNavigate }: { onNavigate: (tab: MarketingTab) => void }) {
  const { data: overview, isLoading } = useMarketingOverview();
  const { data: performance = [] } = useCouponPerformance();

  const o = overview;
  // ٣ ريالات إيراد لكل ريال خصم هو الحد الذي يبدأ تحته الكوبون بأكل الهامش
  // بدل أن يفتح طلباً جديداً.
  const weakReturn = (o?.return_on_discount ?? 0) > 0 && (o?.return_on_discount ?? 0) < 3;

  const mix = useMemo(
    () => performance.map((p) => ({ name: p.code, value: p.revenue })),
    [performance],
  );

  if (isLoading) return <LoadingState label="جاري تحميل الأداء..." />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="العائد على الخصم"
          value={
            <>
              <bdi>{toArabicDigits(o?.return_on_discount ?? 0)}</bdi>
              <span className="text-lg font-bold">×</span>
            </>
          }
          icon={TrendingUp}
          tone={weakReturn ? 'warning' : 'primary'}
        />
        <StatTile
          label="كوبونات فعّالة"
          value={toArabicDigits(o?.active_coupons ?? 0)}
          icon={TicketPercent}
          tone="info"
        />
        <StatTile
          label="إيراد منسوب للكوبونات"
          value={
            <>
              <bdi>{toArabicDigits(Math.round(o?.attributed_revenue ?? 0))}</bdi>{' '}
              <RiyalSymbol className="inline size-5" />
            </>
          }
          icon={Coins}
          tone="success"
        />
        <StatTile
          label="نسبة وصول الرسائل"
          value={`${toArabicDigits(o?.delivery_rate ?? 0)}٪`}
          icon={Send}
          tone={(o?.delivery_rate ?? 0) >= 90 ? 'success' : 'warning'}
        />
      </div>

      {weakReturn && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">العائد على الخصم منخفض</p>
            <p className="mt-1 text-sm text-muted-foreground">
              كل ريال خصم يعيد {toArabicDigits(o?.return_on_discount ?? 0)} ريالاً فقط. راجع
              الكوبونات بلا سقف أو بلا شرط أوّل طلب — غالباً تموّل طلبات كانت ستحدث بلا خصم.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="الإيراد مقابل الخصم لكل كوبون" icon={TicketPercent}>
          {performance.length === 0 ? (
            <EmptyState
              icon={TicketPercent}
              title="لا توجد بيانات استخدام بعد"
              description="تظهر الأرقام هنا بعد أوّل طلب يُستخدم فيه رمز."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={performance} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="code"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width={52}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number, name: string) => [formatSARText(value), name]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                <Bar
                  dataKey="revenue"
                  name="الإيراد"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="discount_given"
                  name="الخصم"
                  fill="hsl(var(--warning))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="توزيع الإيراد بين الرموز" icon={Sparkles}>
          {mix.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="لا توجد بيانات بعد"
              description="يحتاج الرسم إلى رمز واحد مستخدَم على الأقل."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={mix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={104}
                  paddingAngle={3}
                  stroke="none"
                >
                  {mix.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number, name: string) => [formatSARText(value), name]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink
          icon={TicketPercent}
          label="الكوبونات"
          value={`${toArabicDigits(o?.redemptions ?? 0)} استخداماً`}
          onClick={() => onNavigate('coupons')}
        />
        <QuickLink
          icon={Megaphone}
          label="إعلانات ظاهرة"
          value={toArabicDigits(o?.live_announcements ?? 0)}
          onClick={() => onNavigate('offers')}
        />
        <QuickLink
          icon={Send}
          label="حملات أُرسلت"
          value={toArabicDigits(o?.campaigns_sent ?? 0)}
          onClick={() => onNavigate('campaigns')}
        />
      </div>

      <SeasonCalendar />
    </div>
  );
}

function QuickLink({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card flex items-center gap-3 rounded-2xl p-4 text-start transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ink-soft-lg"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted-foreground">{value}</span>
      </span>
    </button>
  );
}

/**
 * تقويم الحملات. المواسم الهجرية تُضبط هنا سنوياً — كانت اللوحة تحذّر من أنها
 * تحتاج ضبطاً ولا تعطي حقلاً لضبطها.
 */
function SeasonCalendar() {
  const year = new Date().getFullYear();
  const { data: overrides = [] } = useSeasonOverrides();
  const setOverride = useSetSeasonOverride();
  const [editing, setEditing] = useState<string | null>(null);
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const anchors = useMemo(
    () => applySeasonOverrides(overrides, year, SEASON_ANCHORS),
    [overrides, year],
  );
  const pending = useMemo(() => pendingSeasons(overrides, year, SEASON_ANCHORS), [overrides, year]);

  const startEdit = (id: string) => {
    const current = anchors.find((a) => a.id === id);
    setEditing(id);
    setMonth(current?.month ? String(current.month) : '');
    setDay(current?.day ? String(current.day) : '');
  };

  const save = (id: string) => {
    setOverride.mutate(
      { id, year, month: Number(month), day: Number(day) },
      { onSuccess: () => setEditing(null) },
    );
  };

  return (
    <SectionCard title="تقويم الحملات" icon={CalendarRange}>
      {pending.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm">
            {toArabicDigits(pending.length)} مواسم هجرية بحاجة إلى ضبط تواريخ سنة{' '}
            <bdi dir="ltr">{year}</bdi>. لا تُثبَّت في الشيفرة: تتقدّم ١٠–١١ يوماً سنوياً وترتبط
            بالإعلان الرسمي.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {anchors.map((s) => {
          const days = daysUntilSeason(s);
          const isEditing = editing === s.id;

          return (
            <li key={s.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{s.name}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {days != null && (
                    <span className="text-xs text-muted-foreground">
                      بعد {toArabicDigits(days)} يوماً
                    </span>
                  )}
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      s.basis === 'hijri' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info',
                    )}
                  >
                    {s.basis === 'hijri' ? 'هجري — يُضبط سنوياً' : 'ميلادي — ثابت'}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">{s.play}</p>
              {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}

              {s.basis === 'hijri' && (
                <div className="mt-3">
                  {isEditing ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`m-${s.id}`} className="text-xs">
                          الشهر
                        </Label>
                        <Input
                          id={`m-${s.id}`}
                          type="number"
                          min={1}
                          max={12}
                          dir="ltr"
                          className="h-9 w-20 text-end"
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`d-${s.id}`} className="text-xs">
                          اليوم
                        </Label>
                        <Input
                          id={`d-${s.id}`}
                          type="number"
                          min={1}
                          max={31}
                          dir="ltr"
                          className="h-9 w-20 text-end"
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                        />
                      </div>
                      <Button size="sm" onClick={() => save(s.id)} disabled={setOverride.isPending}>
                        حفظ
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        إلغاء
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEdit(s.id)}>
                      {s.month && s.day
                        ? `مضبوط: ${toArabicDigits(s.day)}/${toArabicDigits(s.month)} — تعديل`
                        : `اضبط تاريخ ${year}`}
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
