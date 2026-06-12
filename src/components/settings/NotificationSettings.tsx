import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, BellOff, Save, AlertTriangle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ORDER_STATUS_LABELS } from '@/types/order';
import {
  NOTIFIABLE_STATUSES,
  type NotificationProviderName,
  type NotificationChannel,
} from '@/lib/notifications';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  useNotificationLog,
  type NotificationSettings as Settings,
} from '@/hooks/useNotifications';

const PROVIDERS: { value: NotificationProviderName; label: string }[] = [
  { value: 'mock', label: 'تجريبي (بدون إرسال فعلي)' },
  { value: 'unifonic', label: 'Unifonic' },
  { value: 'msegat', label: 'مسجاتي (Msegat)' },
  { value: 'twilio', label: 'Twilio' },
];

const SEND_STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: 'تم الإرسال', cls: 'bg-success/10 text-success' },
  failed: { label: 'فشل', cls: 'bg-destructive/10 text-destructive' },
  pending: { label: 'قيد الانتظار', cls: 'bg-warning/10 text-warning' },
  skipped: { label: 'تم التخطّي', cls: 'bg-muted text-muted-foreground' },
};

export function NotificationSettings() {
  const { data: settings, isLoading } = useNotificationSettings();
  const { data: log = [], isLoading: logLoading } = useNotificationLog();
  const updateSettings = useUpdateNotificationSettings();

  const [draft, setDraft] = useState<Settings | null>(null);
  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  // Migration not applied / tables absent → guide the operator instead of crashing.
  if (!settings || !draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            الإشعارات غير مُهيّأة بعد
          </CardTitle>
          <CardDescription>
            لتفعيل إشعارات الطلبات، طبّق ترحيل قاعدة البيانات وانشر دالة الإرسال، ثم حدّث الصفحة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal ps-5 space-y-1.5 text-sm text-muted-foreground">
            <li>طبّق الترحيل: <code className="text-foreground">supabase db push</code></li>
            <li>انشر الدالة: <code className="text-foreground">supabase functions deploy send-notification</code></li>
            <li>راجع دليل الإعداد في <code className="text-foreground">docs/notifications.md</code></li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const set = (patch: Partial<Settings>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {draft.enabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            إعدادات الإشعارات
          </CardTitle>
          <CardDescription>
            إشعارات تلقائية للعميل عبر الرسائل القصيرة أو واتساب عند تغيّر حالة الطلب.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-w-xl">
          {/* Master toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">تفعيل الإشعارات</p>
              <p className="text-sm text-muted-foreground">إرسال رسائل للعملاء عند المراحل المهمة.</p>
            </div>
            <Switch
              checked={draft.enabled}
              onCheckedChange={(enabled) => set({ enabled })}
              aria-label="تفعيل الإشعارات"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>مزوّد الخدمة</Label>
              <Select
                value={draft.provider}
                onValueChange={(provider) => set({ provider: provider as NotificationProviderName })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>القناة</Label>
              <Select
                value={draft.channel}
                onValueChange={(channel) => set({ channel: channel as NotificationChannel })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">رسالة قصيرة SMS</SelectItem>
                  <SelectItem value="whatsapp">واتساب</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_url">رابط التتبّع الأساسي</Label>
            <Input
              id="base_url"
              dir="ltr"
              placeholder="https://app.example.com"
              value={draft.base_url ?? ''}
              onChange={(e) => set({ base_url: e.target.value || null })}
            />
            <p className="text-xs text-muted-foreground">
              يُستخدم لبناء رابط تتبّع الطلب داخل الرسالة. اتركه فارغاً لإخفاء الرابط.
            </p>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            تُرسل الإشعارات عند الحالات التالية فقط:{' '}
            {NOTIFIABLE_STATUSES.map((s) => ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS] ?? s).join(' · ')}
          </div>

          <Button
            onClick={() => updateSettings.mutate(draft)}
            disabled={!dirty || updateSettings.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            سجل الإشعارات
          </CardTitle>
          <CardDescription>آخر {log.length} محاولة إرسال.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : log.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>لا توجد إشعارات بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطلب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>النتيجة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((row) => {
                  const badge = SEND_STATUS[row.send_status] ?? SEND_STATUS.pending;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.order_number ?? '—'}</TableCell>
                      <TableCell>
                        {row.status
                          ? ORDER_STATUS_LABELS[row.status as keyof typeof ORDER_STATUS_LABELS] ?? row.status
                          : '—'}
                      </TableCell>
                      <TableCell dir="ltr" className="text-start">{row.recipient ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={badge.cls}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(row.created_at), 'd MMM HH:mm', { locale: ar })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
