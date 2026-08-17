import { useEffect, useState } from 'react';
import {
  SectionCard,
  StatTile,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiyalSymbol } from '@/components/ui/riyal';
import {
  AlertTriangle,
  Briefcase,
  CalendarHeart,
  Gift,
  Loader2,
  MessageCircle,
  Save,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toArabicDigits } from '@/lib/arabicNumerals';
import {
  useBusinessAccounts,
  useLoyaltyOverview,
  useLoyaltyRiskReport,
  useLoyaltySettings,
  useUpdateLoyaltySettings,
  type LoyaltySettings,
} from '@/hooks/useLoyaltyAdmin';
import { useReferralsForAdmin, type AdminReferralRow } from '@/hooks/useMarketing';

/**
 * «الولاء والإحالة» — محتوى صفحة `/loyalty` السابقة كما هي، داخل تبويب.
 *
 * ما تغيّر شيئان فقط: «التقويم الموسمي» انتقل إلى «نظرة عامة» (تقويم حملات لا
 * إعداد ولاء)، وأُضيف جدول الإحالات — كان `loyalty_referrals` يحمل سياسة قراءة
 * للمدير في القاعدة بلا أي واجهة تعرضه.
 *
 * قواعد البرنامج البنيوية لم تُمسّ: لا زرّ منح يدوي، ولا مكافأة بالريال.
 */

/** السقف المُلزِم للكلفة كنسبة من إيراد الأعضاء. تجاوزه قرار إعادة تصميم. */
const COST_CEILING_PCT = 3;

export function LoyaltyTab() {
  const overview = useLoyaltyOverview();
  const risk = useLoyaltyRiskReport();
  const settingsQuery = useLoyaltySettings();
  const updateSettings = useUpdateLoyaltySettings();

  const [draft, setDraft] = useState<LoyaltySettings | null>(null);

  useEffect(() => {
    if (settingsQuery.data) setDraft(settingsQuery.data);
  }, [settingsQuery.data]);

  const o = overview.data;
  const overBudget = (o?.cost_pct_of_revenue ?? 0) > COST_CEILING_PCT;

  const patch = (key: keyof LoyaltySettings, value: unknown) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <div className="space-y-6">
      {/* السقف الاقتصادي أوّل ما يُرى، لا مدفوناً في تبويب. البرنامج الذي
          يتجاوز ٣٪ من إيراد الأعضاء يُعاد تصميمه ولا يُواصَل. */}
      {overBudget && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">
              كلفة المكافآت تجاوزت السقف المُلزِم ({toArabicDigits(COST_CEILING_PCT)}٪)
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              النسبة الحالية {toArabicDigits(o?.cost_pct_of_revenue ?? 0)}٪ من إيراد الأعضاء خلال
              ٩٠ يوماً. راجع عتبة الكرت أو قيمة المكافأة قبل المتابعة.
            </p>
          </div>
        </div>
      )}

      {overview.isLoading ? (
        <LoadingState />
      ) : overview.isError ? (
        <ErrorState
          title="تعذّر تحميل بيانات البرنامج"
          description="تأكّد من تطبيق هجرات الولاء على المشروع."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="الأعضاء" value={toArabicDigits(o?.members ?? 0)} icon={Users} tone="primary" />
          <StatTile
            label="مناسبات محفوظة"
            value={toArabicDigits(o?.occasions_stored ?? 0)}
            icon={CalendarHeart}
            tone="info"
          />
          {/* المقياس الحاكم ليس عدد المنضمّات بل نسبة الموافقة التسويقية:
              ٧٤٪ من أعضاء برامج الولاء يصمتون خلال شهرين. */}
          <StatTile
            label="نسبة الموافقة التسويقية"
            value={`${toArabicDigits(o?.marketing_consent_rate ?? 0)}٪`}
            icon={MessageCircle}
            tone={(o?.marketing_consent_rate ?? 0) >= 65 ? 'success' : 'warning'}
          />
          <StatTile
            label="كلفة المكافآت من الإيراد"
            value={`${toArabicDigits(o?.cost_pct_of_revenue ?? 0)}٪`}
            icon={Gift}
            tone={overBudget ? 'destructive' : 'success'}
          />
        </div>
      )}

      <Tabs defaultValue="settings" dir="rtl" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="referrals">الإحالات</TabsTrigger>
          <TabsTrigger value="risk">المخاطر</TabsTrigger>
          <TabsTrigger value="business">حسابات الضيافة</TabsTrigger>
        </TabsList>

        {/* ── الإعدادات ─────────────────────────────────────────────── */}
        <TabsContent value="settings" className="mt-6">
          {settingsQuery.isLoading || !draft ? (
            <LoadingState />
          ) : (
            <SectionCard
              title="قواعد البرنامج"
              icon={Sparkles}
              action={
                <Button onClick={() => updateSettings.mutate(draft)} disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? (
                    <Loader2 className="size-4 me-2 animate-spin" />
                  ) : (
                    <Save className="size-4 me-2" />
                  )}
                  حفظ الإعدادات
                </Button>
              }
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
                  <div>
                    <Label htmlFor="loyalty-enabled" className="font-semibold">
                      تفعيل البرنامج
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      عند الإيقاف لا تُحتسب أختام ولا تُصدر مكافآت — والأرصدة القائمة تبقى كما هي.
                    </p>
                  </div>
                  <Switch
                    id="loyalty-enabled"
                    checked={draft.enabled}
                    onCheckedChange={(v) => patch('enabled', v)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <NumberField
                    id="stamps-required"
                    label="عدد خانات الكرت"
                    hint="٥ خانات مع خانة ممنوحة = ٤ طلبات فعلية (٢٫٩٪ كلفة)."
                    value={draft.stamps_required}
                    onChange={(v) => patch('stamps_required', v)}
                  />
                  <NumberField
                    id="endowed-stamps"
                    label="خانات ممنوحة عند الانضمام"
                    hint="التقدّم الممنوح يرفع الإتمام من ١٩٪ إلى ٣٤٪."
                    value={draft.endowed_stamps}
                    onChange={(v) => patch('endowed_stamps', v)}
                  />
                  <NumberField
                    id="stamp-min"
                    label="أدنى قيمة طلب للختم"
                    suffix
                    value={draft.stamp_min_order}
                    onChange={(v) => patch('stamp_min_order', v)}
                  />
                  <NumberField
                    id="redemption-min"
                    label="أدنى قيمة طلب لاستخدام مكافأة"
                    suffix
                    value={draft.redemption_min_order}
                    onChange={(v) => patch('redemption_min_order', v)}
                  />
                  <NumberField
                    id="redemption-max-pct"
                    label="سقف قيمة المكافأة من الطلب (٪)"
                    hint="يمنع تمويل جزء كبير من طلب مرتفع القيمة."
                    value={draft.redemption_max_pct}
                    onChange={(v) => patch('redemption_max_pct', v)}
                  />
                  <NumberField
                    id="registry-unlock"
                    label="مناسبات تفتح مكافأة التخصيص"
                    value={draft.registry_unlock_occasions}
                    onChange={(v) => patch('registry_unlock_occasions', v)}
                  />
                  <NumberField
                    id="inactivity"
                    label="انتهاء الأختام بالخمول (شهر)"
                    hint="بالخمول لا بمرور الزمن — ويحمي أيضاً من إعادة تدوير أرقام الجوال."
                    value={draft.inactivity_expiry_months}
                    onChange={(v) => patch('inactivity_expiry_months', v)}
                  />
                  <NumberField
                    id="tier-threshold"
                    label="عتبة «دائرة مميّزة»"
                    suffix
                    value={draft.tier_threshold_amount}
                    onChange={(v) => patch('tier_threshold_amount', v)}
                  />
                  <NumberField
                    id="tier-window"
                    label="نافذة احتساب الشريحة (شهر)"
                    hint="على الإنفاق لا على التكرار — دورة الشراء هنا سنوية."
                    value={draft.tier_window_months}
                    onChange={(v) => patch('tier_window_months', v)}
                  />
                  <NumberField
                    id="referral-cap"
                    label="سقف الدعوات سنوياً"
                    value={draft.referral_cap_per_year}
                    onChange={(v) => patch('referral_cap_per_year', v)}
                  />
                  <NumberField
                    id="referral-vesting"
                    label="تثبيت مكافأة الإحالة (ساعة)"
                    hint="بعد التسليم — لا توجد نافذة إرجاع للكيك."
                    value={draft.referral_vesting_hours}
                    onChange={(v) => patch('referral_vesting_hours', v)}
                  />
                </div>

                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  لا يوجد في هذه اللوحة زرّ لمنح أختام يدوياً، وهذا مقصود: دوال إنشاء الطلب
                  تعمل بصلاحية مرتفعة، فزرّ المنح اليدوي يعني إمكان توليد مكافآت بلا أن يمرّ
                  ريال بالصندوق. الاستحقاق مشتقّ من طلب مكتمل فقط.
                </p>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* ── الإحالات ──────────────────────────────────────────────── */}
        <TabsContent value="referrals" className="mt-6">
          <ReferralsPanel />
        </TabsContent>

        {/* ── المخاطر ───────────────────────────────────────────────── */}
        <TabsContent value="risk" className="mt-6">
          <SectionCard title="تقرير المخاطر الأسبوعي" icon={ShieldAlert}>
            {risk.isLoading ? (
              <LoadingState />
            ) : (
              <ul className="space-y-3">
                {(risk.data ?? []).map((r) => (
                  <li
                    key={r.metric}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold">{r.label}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-2xl font-black',
                        r.metric === 'ledger_drift' && r.value > 0
                          ? 'text-destructive'
                          : r.metric === 'top_decile_share' && r.value > 50
                            ? 'text-warning'
                            : 'text-foreground',
                      )}
                    >
                      {toArabicDigits(r.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        {/* ── حسابات الضيافة ────────────────────────────────────────── */}
        <TabsContent value="business" className="mt-6">
          <BusinessAccountsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NumberField({
  id,
  label,
  hint,
  value,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  suffix?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {label}
        {suffix && <RiyalSymbol className="size-3.5 text-muted-foreground" />}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        dir="ltr"
        className="text-end"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const REFERRAL_STATUS: Record<AdminReferralRow['status'], { label: string; tone: string }> = {
  pending: { label: 'بانتظار أوّل طلب', tone: 'bg-warning/10 text-warning' },
  vested: { label: 'اكتملت', tone: 'bg-info/10 text-info' },
  rewarded: { label: 'صُرفت المكافأة', tone: 'bg-success/10 text-success' },
  rejected: { label: 'مرفوضة', tone: 'bg-destructive/10 text-destructive' },
  review: { label: 'تحتاج مراجعة', tone: 'bg-destructive/10 text-destructive' },
};

function ReferralsPanel() {
  const { data: rows = [], isLoading } = useReferralsForAdmin();

  return (
    <SectionCard title="الإحالات" icon={UserPlus}>
      <p className="mb-4 text-sm text-muted-foreground">
        المكافأة تُصرف بعد <bdi>٧٢</bdi> ساعة من تسليم أوّل طلب للمُحال إليها، لا عند تسجيلها —
        فلا توجد نافذة إرجاع للكيك، ونافذة التثبيت هي الضابط الوحيد المتاح. صفوف «تحتاج مراجعة»
        هي ما اشتبه به النظام آلياً.
      </p>

      {isLoading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="لا توجد إحالات بعد"
          description="تظهر هنا حين تشارك عميلة رمز دعوتها وتُسجّل صديقتها به."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-3 text-start font-medium">الداعية</th>
                <th className="p-3 text-start font-medium">الرمز</th>
                <th className="p-3 text-start font-medium">المُحال إليها</th>
                <th className="p-3 text-start font-medium">الحالة</th>
                <th className="p-3 text-start font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = REFERRAL_STATUS[r.status];
                return (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="p-3 font-semibold">{r.referrer_name}</td>
                    <td className="p-3">
                      <bdi dir="ltr" className="font-mono text-xs">{r.referrer_code}</bdi>
                    </td>
                    <td className="p-3">
                      <bdi dir="ltr">{r.referee_phone}</bdi>
                    </td>
                    <td className="p-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', status.tone)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <bdi dir="ltr">{r.created_at}</bdi>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function BusinessAccountsPanel() {
  const { data: accounts = [], isLoading } = useBusinessAccounts();

  return (
    <SectionCard title="حسابات ضيافة المناسبات" icon={Briefcase}>
      <p className="mb-4 text-sm text-muted-foreground">
        نموذج منفصل عن كرت الأختام: مشترٍ مؤسسي وتكرار أسبوعي-شهري، والقرار على الاعتمادية.
        رصيد ضيافة عيني ٤٪ ينتهي خلال ٩٠ يوماً وغير متدحرج.
      </p>

      {isLoading ? (
        <LoadingState />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="لا توجد حسابات ضيافة بعد"
          description="تُنشأ للعملاء المؤسسيين المتكرّرين مع رقم ضريبي ومسؤول حساب مسمّى."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-start text-muted-foreground">
                <th className="p-3 text-start font-medium">الجهة</th>
                <th className="p-3 text-start font-medium">مسؤول التواصل</th>
                <th className="p-3 text-start font-medium">طلبات ٩٠ يوماً</th>
                <th className="p-3 text-start font-medium">الإنفاق</th>
                <th className="p-3 text-start font-medium">الرصيد العيني</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-border/60">
                  <td className="p-3">
                    <div className="font-semibold">{a.company_name}</div>
                    {a.vat_number && (
                      <div className="text-xs text-muted-foreground">
                        <bdi dir="ltr">{a.vat_number}</bdi>
                      </div>
                    )}
                  </td>
                  <td className="p-3">{a.contact_name}</td>
                  <td className="p-3">{toArabicDigits(a.orders_90d)}</td>
                  <td className="p-3">
                    <bdi>{toArabicDigits(Math.round(a.spend_90d))}</bdi>{' '}
                    <RiyalSymbol className="inline size-3.5" />
                  </td>
                  <td className="p-3 font-semibold text-primary">
                    <bdi>{toArabicDigits(Math.round(a.credit_balance))}</bdi>{' '}
                    <RiyalSymbol className="inline size-3.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
