import { Fragment, useState } from 'react';
import { useContactSubmissions, useUpdateSubmission, ContactSubmission, SubmissionStatus } from '@/hooks/useContactSubmissions';
import { useOrders } from '@/hooks/useOrders';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, EmptyState, SkeletonList } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Phone,
  Mail,
  User,
  FileText,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusLabels: Record<SubmissionStatus, string> = {
  new: 'جديد',
  in_progress: 'قيد المتابعة',
  closed: 'مغلق',
};

const statusIcons: Record<SubmissionStatus, React.ReactNode> = {
  new: <Clock className="w-3.5 h-3.5" />,
  in_progress: <RefreshCw className="w-3.5 h-3.5" />,
  closed: <CheckCircle className="w-3.5 h-3.5" />,
};

const statusColors: Record<SubmissionStatus, string> = {
  new: 'bg-warning/10 text-warning',
  in_progress: 'bg-info/10 text-info',
  closed: 'bg-success/10 text-success',
};

type SubmissionKind = 'contact' | 'custom_order' | 'complaint';

const typeConfig: Record<SubmissionKind, { label: string; icon: typeof MessageCircle; className: string }> = {
  contact: { label: 'تواصل', icon: MessageCircle, className: 'bg-info/10 text-info' },
  custom_order: { label: 'طلب مخصص', icon: Package, className: 'bg-primary/10 text-primary' },
  complaint: { label: 'شكوى', icon: AlertTriangle, className: 'bg-warning/10 text-warning' },
};

const typeMeta = (type: string) =>
  typeConfig[type as SubmissionKind] ?? { label: type, icon: FileText, className: 'bg-muted text-muted-foreground' };

/* Request "ticket" — mirrors the live-board order card: a type chip + status pill
   ride the top, then the customer, a message preview, and a footer. Whole card
   is the trigger that opens the details dialog. */
function SubmissionCard({ submission, onView }: { submission: ContactSubmission; onView: () => void }) {
  const meta = typeMeta(submission.submission_type);
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full text-start p-3.5 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', meta.className)}>
          <meta.icon className="w-3.5 h-3.5" />
          {meta.label}
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', statusColors[submission.status])}>
          {statusIcons[submission.status]}
          {statusLabels[submission.status]}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold truncate">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {submission.customer_name}
        </span>
        <span dir="ltr" className="font-mono text-xs text-muted-foreground shrink-0">{submission.phone}</span>
      </div>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{submission.message}</p>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          {format(new Date(submission.created_at), 'dd MMM yyyy', { locale: ar })}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          عرض التفاصيل
          <ChevronLeft className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}

const RESOLUTION_LABELS: Record<string, string> = {
  refund: 'استرداد المبلغ',
  replacement: 'استبدال المنتج',
  discount: 'خصم تعويضي',
  apology: 'اعتذار',
  no_action: 'لا إجراء',
};

export default function ContactSubmissions() {
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState('');

  // Fetch all submissions once; filter + count client-side for instant tab switching.
  const { data: all = [], isLoading, isFetching, refetch } = useContactSubmissions();
  const { data: orders = [] } = useOrders();
  const updateSubmission = useUpdateSubmission();

  const submissions = selectedTab === 'all' ? all : all.filter((s) => s.submission_type === selectedTab);

  const handleViewDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setInternalNotes(submission.internal_notes || '');
    setResolutionType(submission.resolution_type || '');
    setLinkedOrderId(submission.linked_order_id || '');
    setDetailsOpen(true);
  };

  const handleUpdateStatus = (status: SubmissionStatus) => {
    if (!selectedSubmission) return;
    updateSubmission.mutate({
      id: selectedSubmission.id,
      status,
      internal_notes: internalNotes
    });
  };

  const handleSaveNotes = () => {
    if (!selectedSubmission) return;
    updateSubmission.mutate({
      id: selectedSubmission.id,
      internal_notes: internalNotes,
      ...(selectedSubmission.submission_type === 'complaint'
        ? { resolution_type: resolutionType || null, linked_order_id: linkedOrderId || null }
        : {}),
    });
  };

  // Status breakdown across ALL submissions (drives the command-bar pipeline).
  const total = all.length;
  const newCount = all.filter((s) => s.status === 'new').length;
  const inProgressCount = all.filter((s) => s.status === 'in_progress').length;
  const closedCount = all.filter((s) => s.status === 'closed').length;

  // Per-type counts for the tab badges.
  const typeCounts = {
    contact: all.filter((s) => s.submission_type === 'contact').length,
    custom_order: all.filter((s) => s.submission_type === 'custom_order').length,
    complaint: all.filter((s) => s.submission_type === 'complaint').length,
  };

  // The submission pipeline: new → in-progress → closed (same shape as the live board).
  const pipeline = [
    { key: 'new', label: 'جديد', value: newCount, icon: Clock, box: 'bg-warning/10 text-warning', text: 'text-warning' },
    { key: 'in_progress', label: 'قيد المتابعة', value: inProgressCount, icon: RefreshCw, box: 'bg-info/10 text-info', text: 'text-info' },
    { key: 'closed', label: 'مغلق', value: closedCount, icon: CheckCircle, box: 'bg-success/10 text-success', text: 'text-success' },
  ];

  const dialogMeta = selectedSubmission ? typeMeta(selectedSubmission.submission_type) : null;

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          title="الرسائل والطلبات"
          description="إدارة رسائل العملاء والطلبات المخصصة والشكاوى"
          icon={MessageCircle}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
              تحديث
            </Button>
          }
        />

        {/* Command bar — total (hero) + the status pipeline */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center gap-3 p-5 bg-primary/[0.04] border-b lg:border-b-0 lg:border-e border-border/60 shrink-0">
              <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{total}</p>
                <p className="text-xs text-muted-foreground mt-1.5">إجمالي الرسائل</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 p-4 flex-1 overflow-x-auto">
              {pipeline.map((stage, i) => (
                <Fragment key={stage.key}>
                  <div className="flex flex-col items-center gap-1.5 px-2 shrink-0">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stage.box)}>
                      <stage.icon className="w-5 h-5" />
                    </div>
                    <p className={cn('text-xl font-bold leading-none', stage.text)}>{stage.value}</p>
                    <p className="text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">{stage.label}</p>
                  </div>
                  {i < pipeline.length - 1 && <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs filter by type. dir="rtl" is required so the list + the card grid
            inside TabsContent lay out RTL (Radix Tabs defaults to LTR otherwise). */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} dir="rtl">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              الكل
              {total > 0 && <Badge variant="secondary" className="ms-1">{total}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1.5">
              <MessageCircle className="w-4 h-4" />
              تواصل
              {typeCounts.contact > 0 && <Badge variant="secondary" className="ms-1">{typeCounts.contact}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="custom_order" className="gap-1.5">
              <Package className="w-4 h-4" />
              طلبات مخصصة
              {typeCounts.custom_order > 0 && <Badge variant="secondary" className="ms-1">{typeCounts.custom_order}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="complaint" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              شكاوى
              {typeCounts.complaint > 0 && <Badge variant="secondary" className="ms-1">{typeCounts.complaint}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-5">
            {isLoading ? (
              <SkeletonList rows={4} />
            ) : submissions.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card">
                <EmptyState
                  icon={MessageCircle}
                  title="لا توجد رسائل"
                  description="ستظهر هنا رسائل العملاء والطلبات المخصصة والشكاوى عند وصولها."
                />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {submissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    onView={() => handleViewDetails(submission)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMeta && (
                <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg', dialogMeta.className)}>
                  <dialogMeta.icon className="w-4 h-4" />
                </span>
              )}
              {dialogMeta?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && format(new Date(selectedSubmission.created_at), 'dd MMMM yyyy, HH:mm', { locale: ar })}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{selectedSubmission.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span dir="ltr">{selectedSubmission.phone}</span>
                </div>
                {selectedSubmission.email && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span dir="ltr">{selectedSubmission.email}</span>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">الرسالة</label>
                <p className="mt-1 p-3 bg-muted/50 rounded-xl whitespace-pre-wrap">
                  {selectedSubmission.message}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                <Select
                  value={selectedSubmission.status}
                  onValueChange={(value) => handleUpdateStatus(value as SubmissionStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">جديد</SelectItem>
                    <SelectItem value="in_progress">قيد المتابعة</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Complaint resolution — resolution type + linked order */}
              {selectedSubmission.submission_type === 'complaint' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">نوع المعالجة</label>
                    <Select value={resolutionType || 'none'} onValueChange={(v) => setResolutionType(v === 'none' ? '' : v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="اختر المعالجة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">غير محددة</SelectItem>
                        {Object.entries(RESOLUTION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الطلب المرتبط</label>
                    <Select value={linkedOrderId || 'none'} onValueChange={(v) => setLinkedOrderId(v === 'none' ? '' : v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="اربط بطلب" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون</SelectItem>
                        {orders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">ملاحظات داخلية</label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  placeholder="أضف ملاحظات داخلية..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              إغلاق
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateSubmission.isPending}>
              {updateSubmission.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
