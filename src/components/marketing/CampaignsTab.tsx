import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { EmptyState, LoadingState, SectionCard } from '@/components/ds';
import { cn } from '@/lib/utils';
import { toArabicDigits } from '@/lib/arabicNumerals';
import {
  MAX_BODY_LENGTH,
  estimateSegments,
  renderCampaignBody,
  sendWindowBlock,
  validateCampaign,
} from '@/lib/marketing/campaign';
import {
  AUDIENCES,
  AUDIENCE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  type AudienceKey,
  type CampaignDraft,
  type CampaignMessage,
  type CampaignSendResult,
  type CampaignStatus,
} from '@/lib/marketing/types';
import { useCoupons } from '@/hooks/useMarketing';
import {
  useAudienceSize,
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useSendCampaign,
  useUpdateCampaign,
} from '@/hooks/useCampaigns';

/**
 * «الرسائل التسويقية».
 *
 * ثلاث قواعد مبنيّة في الشاشة لا مكتوبة في دليل تشغيل:
 *
 *   ١) لا شريحة «الجميع». كل شريحة مشروطة بموافقة تسويقية مسجّلة، لأن الرسالة
 *      التي تحمل عرضاً تسويقٌ مباشر لا يشمله استثناء «التعامل السابق».
 *   ٢) زرّ الإرسال معطّل خارج ٨ صباحاً–١٠ مساءً بتوقيت الرياض، مع ذكر السبب.
 *   ٣) لا إرسال قبل معاينة: «معاينة» تحسب الشريحة وتعرض النصّ كما سيصل، بلا
 *      إرسال — ودالة الحافّة تعيد الفحوص نفسها لأن المتصفّح ليس جهة إنفاذ.
 */

const STATUS_TONE: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-info/10 text-info',
  sending: 'bg-warning/10 text-warning',
  sent: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
};

const NO_COUPON = '__none__';

const EMPTY_DRAFT: CampaignDraft = {
  name: '',
  audience: 'all_consented',
  channel: 'whatsapp',
  body: '',
  couponCode: null,
  scheduledAt: null,
};

export function CampaignsTab() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: coupons = [] } = useCoupons();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CampaignSendResult | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: audienceSize = 0 } = useAudienceSize(draft.audience);
  const segments = estimateSegments(renderCampaignBody(draft.body, draft.couponCode));
  const windowBlock = sendWindowBlock(new Date());

  const activeCoupons = useMemo(() => coupons.filter((c) => c.isActive), [coupons]);
  const set = <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setResult(null);
  };

  const reset = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setResult(null);
  };

  const loadForEdit = (campaign: CampaignMessage) => {
    setEditingId(campaign.id);
    setDraft({
      name: campaign.name,
      audience: campaign.audience,
      channel: campaign.channel,
      body: campaign.body,
      couponCode: campaign.couponCode,
      scheduledAt: campaign.scheduledAt,
    });
    setError(null);
    setResult(null);
  };

  const save = () => {
    const message = validateCampaign(draft);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    if (editingId) updateCampaign.mutate({ id: editingId, draft }, { onSuccess: reset });
    else createCampaign.mutate(draft, { onSuccess: reset });
  };

  const preview = () => {
    const message = validateCampaign(draft);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    sendCampaign.mutate(
      { id: editingId, ...draft, dryRun: true },
      { onSuccess: setResult },
    );
  };

  const send = () => {
    setConfirmSend(false);
    sendCampaign.mutate(
      { id: editingId, ...draft, dryRun: false },
      {
        onSuccess: (res) => {
          setResult(res);
          if (!res.blockedReason) reset();
        },
      },
    );
  };

  const canSend = !!editingId && !windowBlock && !validateCampaign(draft);

  return (
    <div className="space-y-6">
      {/* الحاجز النظامي أوّل ما يُقرأ، لا حاشية أسفل النموذج. */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/50 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">لا تصل هذه الرسائل إلا لمن وافقت صراحةً على التسويق.</p>
          <p className="mt-1 text-muted-foreground">
            كل رسالة هنا تسويقٌ مباشر، فلا يشملها استثناء «التعامل السابق» الذي يقوم عليه تذكير
            المناسبات. الإرسال محصور بين ٨ صباحاً و١٠ مساءً بتوقيت الرياض، ولا تُراسَل صاحبة
            المناسبة المُهداة — السجلّ يحفظ اسماً وتاريخاً بلا وسيلة تواصل.
          </p>
        </div>
      </div>

      {windowBlock && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm">{windowBlock} يمكنك حفظ الحملة أو جدولتها الآن.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── المحرّر ── */}
        <div className="lg:col-span-3">
          <SectionCard
            title={editingId ? 'تعديل الحملة' : 'حملة جديدة'}
            icon={Send}
            action={
              editingId ? (
                <Button variant="ghost" size="sm" onClick={reset}>
                  حملة جديدة
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="cmp-name">اسم الحملة *</Label>
                <Input
                  id="cmp-name"
                  placeholder="تذكير موسم التخرّج"
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">داخلي — لا تراه العميلة.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cmp-audience">الشريحة</Label>
                <Select
                  value={draft.audience}
                  onValueChange={(v) => set('audience', v as AudienceKey)}
                >
                  <SelectTrigger id="cmp-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.key} value={a.key}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {AUDIENCES.find((a) => a.key === draft.audience)?.rationale}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cmp-channel">القناة</Label>
                  <Select
                    value={draft.channel}
                    onValueChange={(v) => set('channel', v === 'sms' ? 'sms' : 'whatsapp')}
                  >
                    <SelectTrigger id="cmp-channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md">
                      <SelectItem value="whatsapp">واتساب</SelectItem>
                      <SelectItem value="sms">رسالة نصية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cmp-coupon">رمز مرفق</Label>
                  <Select
                    value={draft.couponCode || NO_COUPON}
                    onValueChange={(v) => set('couponCode', v === NO_COUPON ? null : v)}
                  >
                    <SelectTrigger id="cmp-coupon">
                      <SelectValue placeholder="بلا رمز" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md">
                      <SelectItem value={NO_COUPON}>بلا رمز</SelectItem>
                      {activeCoupons.map((c) => (
                        <SelectItem key={c.id} value={c.code}>
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cmp-body">نصّ الرسالة *</Label>
                <Textarea
                  id="cmp-body"
                  rows={5}
                  maxLength={MAX_BODY_LENGTH}
                  placeholder="قرّب موسم التخرّج 🎓 عندنا علب مشتركة وتصاميم جاهزة تُسلَّم في يومها."
                  value={draft.body}
                  onChange={(e) => set('body', e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {toArabicDigits(segments.length)} حرفاً ·{' '}
                    {toArabicDigits(segments.segments)}{' '}
                    {segments.segments === 1 ? 'شريحة' : 'شرائح'}
                    {segments.unicode && ' (عربي — ٧٠ حرفاً للشريحة)'}
                  </span>
                  <span>يبقى {toArabicDigits(segments.remaining)} قبل شريحة جديدة</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cmp-schedule">موعد الإرسال</Label>
                <Input
                  id="cmp-schedule"
                  type="datetime-local"
                  dir="ltr"
                  value={draft.scheduledAt ?? ''}
                  onChange={(e) => set('scheduledAt', e.target.value || null)}
                />
                <p className="text-xs text-muted-foreground">
                  اتركه فارغاً للإرسال الفوري. الموعد يجب أن يقع داخل نافذة الإرسال.
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={save}
                  disabled={createCampaign.isPending || updateCampaign.isPending}
                  className="gap-2"
                >
                  {(createCampaign.isPending || updateCampaign.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {editingId ? 'حفظ التعديلات' : 'حفظ الحملة'}
                </Button>
                <Button
                  variant="outline"
                  onClick={preview}
                  disabled={sendCampaign.isPending}
                  className="gap-2"
                >
                  {sendCampaign.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                  معاينة
                </Button>
                <Button
                  variant="brand"
                  onClick={() => setConfirmSend(true)}
                  disabled={!canSend || sendCampaign.isPending}
                  className="gap-2"
                  title={
                    !editingId
                      ? 'احفظ الحملة أولاً'
                      : (windowBlock ?? undefined)
                  }
                >
                  <Send className="size-4" />
                  إرسال الآن
                </Button>
              </div>
              {!editingId && (
                <p className="text-xs text-muted-foreground">
                  الإرسال متاح بعد الحفظ — كي يُسجَّل الأثر على حملة لها اسم وسجلّ.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── المعاينة ── */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="كما ستصل" icon={Smartphone}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4 text-primary" />
                  {AUDIENCE_LABELS[draft.audience]}
                </span>
                <span className="text-lg font-semibold text-primary tabular-nums">
                  {toArabicDigits(result?.recipients ?? audienceSize)}
                </span>
              </div>

              <div className="rounded-2xl bg-secondary p-3">
                <div className="max-w-[85%] rounded-2xl rounded-ee-sm bg-card p-3 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {renderCampaignBody(draft.body, draft.couponCode) || (
                      <span className="text-muted-foreground">اكتب نصّ الرسالة لتظهر المعاينة…</span>
                    )}
                  </p>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  {draft.channel === 'whatsapp' ? 'واتساب' : 'رسالة نصية'}
                </p>
              </div>

              {result?.blockedReason && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{result.blockedReason}</p>
                </div>
              )}

              {result && !result.blockedReason && !result.dryRun && (
                <div className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/5 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <p className="text-sm">
                    وصلت إلى {toArabicDigits(result.sent)} من {toArabicDigits(result.recipients)}
                    {result.failed > 0 && ` · تعذّرت ${toArabicDigits(result.failed)}`}
                  </p>
                </div>
              )}

              {result && result.results.length > 0 && (
                <ul className="space-y-1.5 text-xs">
                  {result.results.map((r) => (
                    <li key={r.maskedPhone} className="flex items-center justify-between gap-2">
                      <bdi dir="ltr" className="text-muted-foreground">{r.maskedPhone}</bdi>
                      <span className={r.ok ? 'text-success' : 'text-destructive'}>
                        {r.ok ? 'وصلت' : (r.error ?? 'تعذّرت')}
                      </span>
                    </li>
                  ))}
                  <li className="pt-1 text-muted-foreground">عيّنة من النتائج.</li>
                </ul>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── السجلّ ── */}
      <SectionCard title="الحملات" icon={MessageCircle}>
        {isLoading ? (
          <LoadingState />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Send}
            title="لا توجد حملات بعد"
            description="اكتب أوّل حملة في المحرّر أعلاه."
            action={
              <Button onClick={reset} className="gap-2">
                <Plus className="size-4" />
                حملة جديدة
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{c.name}</span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        STATUS_TONE[c.status],
                      )}
                    >
                      {CAMPAIGN_STATUS_LABELS[c.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {AUDIENCE_LABELS[c.audience]} ·{' '}
                      {c.channel === 'whatsapp' ? 'واتساب' : 'رسالة نصية'}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.body}</p>
                  {c.status === 'sent' && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      وصلت {toArabicDigits(c.delivered)} من {toArabicDigits(c.recipients)}
                      {c.failed > 0 && ` · تعذّرت ${toArabicDigits(c.failed)}`}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {c.status !== 'sent' && (
                    <Button variant="outline" size="sm" onClick={() => loadForEdit(c)}>
                      تحرير
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="حذف الحملة"
                    className="text-destructive"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إرسال الحملة الآن؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستصل إلى نحو {toArabicDigits(audienceSize)} عميلة موافقة على التسويق. الرسالة
              المُرسَلة لا تُسترجَع ولا تُعدَّل بعد ذلك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={send}>إرسال</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحملة</AlertDialogTitle>
            <AlertDialogDescription>
              يُحذف سجلّها معها، بما فيه أرقام الوصول.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteCampaign.mutate(deleteId);
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
