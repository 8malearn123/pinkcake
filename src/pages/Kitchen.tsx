import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, EmptyState, LoadingState, ErrorState } from '@/components/ds';
import { useKitchenOrders, useUpdateKitchenOrderStatus, useMarkOrderReady, useSendToBranch, type KitchenOrder } from '@/hooks/useKitchenOrders';
import { useCustomOrdersForReview, type CustomOrderForReview } from '@/hooks/useCustomOrders';
import { OrderTransferDialog } from '@/components/orders/OrderTransferDialog';
import { HandoverBarcodeDisplay } from '@/components/orders/HandoverBarcodeDisplay';
import { OrderBriefDialog } from '@/components/orders/OrderBriefDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHandoverBarcode } from '@/hooks/useHandoverBarcodes';
import { OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';
import {
  ChefHat,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Package,
  Loader2,
  QrCode,
  AlertTriangle,
  ScanLine,
  Cake,
  ClipboardList,
  PartyPopper,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const formatTime = (time: string | null) => (time ? time.substring(0, 5) : '-');
const sortByCreated = (a: { created_at: string }, b: { created_at: string }) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

/* ── Prep-board lanes ─────────────────────────────────────────────────────
   Both regular and custom/occasion orders arrive paid and move through the
   same rail: paid → preparing → ready_to_ship. Each stage is a lane whose
   header carries its own live count. */
type LaneTone = 'warning' | 'info' | 'primary';

const LANE_TONE: Record<LaneTone, { iconBox: string; count: string; accent: string }> = {
  warning: { iconBox: 'bg-warning/10 text-warning', count: 'bg-warning/15 text-warning', accent: 'bg-warning' },
  info: { iconBox: 'bg-info/10 text-info', count: 'bg-info/15 text-info', accent: 'bg-info' },
  primary: { iconBox: 'gradient-pink text-white', count: 'bg-primary/15 text-primary', accent: 'gradient-pink' },
};

const LANES: { status: OrderStatus; label: string; icon: typeof Clock; tone: LaneTone }[] = [
  { status: 'paid', label: 'بانتظار البدء', icon: Clock, tone: 'warning' },
  { status: 'preparing', label: 'قيد التجهيز', icon: ChefHat, tone: 'info' },
  { status: 'ready_to_ship', label: 'جاهز للإرسال', icon: Package, tone: 'primary' },
];

function OrderBarcodeStatus({ orderId }: { orderId: string }) {
  const { data: barcode } = useHandoverBarcode(orderId, 'kitchen_handover');
  const hasBarcode = !!barcode;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        hasBarcode ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      )}
    >
      <QrCode className="w-3 h-3" />
      {hasBarcode ? 'باركود جاهز' : 'بدون باركود'}
    </span>
  );
}

function LaneEmpty() {
  return (
    <p className="text-xs text-muted-foreground/70 text-center py-8 border border-dashed border-border/50 rounded-xl">
      لا طلبات في هذه المرحلة
    </p>
  );
}

function Lane({ label, icon: Icon, tone, count, children }: {
  label: string; icon: typeof Clock; tone: LaneTone; count: number; children: React.ReactNode;
}) {
  const t = LANE_TONE[tone];
  return (
    <div className="rounded-2xl bg-muted/30 border border-border/40 p-3">
      <div className="flex items-center gap-2 px-1 pb-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', t.iconBox)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-semibold">{label}</span>
        <span className={cn('ms-auto text-xs font-bold px-2 py-0.5 rounded-full', t.count)}>{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* Status-appropriate prep buttons — shared by regular and custom/occasion cards. */
interface PrepActionsProps {
  order: { id: string; status: string };
  barcodeOpen: boolean;
  onToggleBarcode: () => void;
  onStart: () => void;
  onReady: () => void;
  onSend: () => void;
  busy: boolean;
  starting: boolean;
  readying: boolean;
  sending: boolean;
}

function PrepActions({ order, barcodeOpen, onToggleBarcode, onStart, onReady, onSend, busy, starting, readying, sending }: PrepActionsProps) {
  if (order.status === 'paid') {
    return (
      <Button onClick={onStart} className="w-full gradient-pink text-white shadow-warm hover:opacity-90" disabled={busy}>
        {starting ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <ChefHat className="w-4 h-4 me-1.5" />}
        بدء التجهيز
      </Button>
    );
  }
  if (order.status === 'preparing') {
    return (
      <Button onClick={onReady} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={busy}>
        {readying ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 me-1.5" />}
        تم التجهيز (إنشاء باركود)
      </Button>
    );
  }
  if (order.status === 'ready_to_ship') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <OrderBarcodeStatus orderId={order.id} />
          <Button onClick={onToggleBarcode} variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/5">
            <QrCode className="w-3.5 h-3.5 me-1" />
            {barcodeOpen ? 'إخفاء' : 'عرض الباركود'}
          </Button>
        </div>
        <Button onClick={onSend} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={busy}>
          {sending ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <ArrowLeft className="w-4 h-4 me-1.5" />}
          إرسال للفرع
        </Button>
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          يجب مسح الباركود من السائق أولاً
        </p>
        {barcodeOpen && (
          <div className="pt-2 border-t border-border/50">
            <HandoverBarcodeDisplay
              orderId={order.id}
              barcodeType="kitchen_handover"
              title="باركود تسليم المطبخ"
              description="يجب على السائق مسح هذا الباركود لاستلام الطلب"
              canGenerate={false}
            />
          </div>
        )}
      </div>
    );
  }
  return null;
}

type CardActionProps = Omit<PrepActionsProps, 'order'>;

/* Light, scan-in-a-glance card. Product + time lead; the lane already conveys
   status, so no redundant status badge. */
function PrepCard({ order, tone, ...actions }: { order: KitchenOrder; tone: LaneTone } & CardActionProps) {
  return (
    <Card className="overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn('h-1', LANE_TONE[tone].accent)} />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {formatTime(order.delivery_time)}
          </span>
        </div>

        <div className="space-y-0.5">
          {order.items?.map((item, index) => (
            <div key={index} className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-sm leading-snug">{item.product_name}</span>
              <span className="text-sm font-bold text-primary shrink-0">×{item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{order.branch_name || 'غير محدد'}</span>
        </div>

        {order.notes && (
          <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 rounded-md px-2 py-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{order.notes}</span>
          </div>
        )}

        <PrepActions order={order} {...actions} />
      </div>
    </Card>
  );
}

function CustomPrepCard({ order, tone, onBrief, ...actions }: {
  order: CustomOrderForReview; tone: LaneTone; onBrief: () => void;
} & CardActionProps) {
  const isEvent = order.order_kind === 'event';
  const peopleValue = isEvent ? order.guest_count : order.number_of_people;
  const chips = [order.flavor, order.filling, order.sugar_level].filter(Boolean) as string[];
  const subline = [order.occasion, peopleValue != null ? `${peopleValue} ${isEvent ? 'ضيف' : 'شخص'}` : null]
    .filter(Boolean).join(' · ');

  return (
    <Card className="overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn('h-1', isEvent ? 'gradient-pink' : 'bg-primary/40')} />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
          <Badge className="bg-primary/10 text-primary border-0 gap-1 text-[11px] px-2 py-0.5 font-medium">
            {isEvent ? <PartyPopper className="w-3 h-3" /> : <Cake className="w-3 h-3" />}
            {isEvent ? 'ضيافة' : 'مخصص'}
          </Badge>
        </div>

        <div>
          <p className="font-semibold text-sm leading-snug">{order.product_type}</p>
          {subline && <p className="text-xs text-muted-foreground mt-0.5">{subline}</p>}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate">{format(new Date(order.pickup_date), 'd MMM', { locale: ar })} · {order.pickup_time} · {order.branch_name}</span>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip, i) => (
              <span key={i} className="text-[11px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">{chip}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {order.total_amount != null && (
            <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> مدفوع · {order.total_amount} ر.س
            </span>
          )}
          <button onClick={onBrief} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ClipboardList className="w-3.5 h-3.5" /> التفاصيل الكاملة
          </button>
        </div>

        <PrepActions order={order} {...actions} />
      </div>
    </Card>
  );
}

export default function Kitchen() {
  const [transferOrderId, setTransferOrderId] = useState<string | null>(null);
  const [transferBranchId] = useState<string | null>(null);
  const [showBarcodeOrderId, setShowBarcodeOrderId] = useState<string | null>(null);
  const [briefOrder, setBriefOrder] = useState<CustomOrderForReview | null>(null);

  const { data: kitchenOrders = [], isLoading, error, refetch } = useKitchenOrders();
  const { data: customOrders = [], isLoading: customLoading, error: customError, refetch: refetchCustom } = useCustomOrdersForReview();

  const updateStatus = useUpdateKitchenOrderStatus();
  const markReady = useMarkOrderReady();
  const sendToBranch = useSendToBranch();

  const regularByLane = (status: OrderStatus) => [...kitchenOrders].filter((o) => o.status === status).sort(sortByCreated);
  const customByLane = (status: OrderStatus) => [...customOrders].filter((o) => o.status === status).sort(sortByCreated);

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingState label="جاري تحميل الطلبات..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <ErrorState title="حدث خطأ في تحميل الطلبات" onRetry={() => refetch()} />
      </MainLayout>
    );
  }

  const busy = updateStatus.isPending || markReady.isPending || sendToBranch.isPending;

  // Shared prep-action wiring for a given order id + status.
  const actionProps = (o: { id: string; status: string }) => ({
    barcodeOpen: showBarcodeOrderId === o.id,
    onToggleBarcode: () => setShowBarcodeOrderId(showBarcodeOrderId === o.id ? null : o.id),
    onStart: () => updateStatus.mutate({ orderId: o.id, status: 'preparing' }),
    onReady: () => markReady.mutate(o.id),
    onSend: () => sendToBranch.mutate(o.id),
    busy,
    starting: updateStatus.isPending,
    readying: markReady.isPending,
    sending: sendToBranch.isPending,
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="المطبخ المركزي"
          description="إدارة تجهيز الطلبات"
          icon={ChefHat}
          actions={
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { refetch(); refetchCustom(); }}>
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          }
        />

        <Tabs defaultValue="regular" dir="rtl" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="regular" className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              الطلبات العادية
              {kitchenOrders.length > 0 && <Badge variant="secondary" className="ms-1">{kitchenOrders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Cake className="w-4 h-4" />
              مخصص وضيافة
              {customOrders.length > 0 && <Badge variant="secondary" className="ms-1">{customOrders.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ── Regular orders: kanban prep board ── */}
          <TabsContent value="regular" className="space-y-5 mt-6">
            <Alert className="border-primary/20 bg-primary/5">
              <ScanLine className="h-4 w-4" />
              <AlertDescription>
                <strong>نظام التسليم بالباركود:</strong> يجب على السائق مسح الباركود من الطلب الجاهز قبل إرساله للفرع.
              </AlertDescription>
            </Alert>

            {kitchenOrders.length === 0 ? (
              <EmptyState
                icon={ChefHat}
                title="لا توجد طلبات للتجهيز حالياً"
                description="عندما يُدفع طلب جديد سيظهر هنا في مسار التجهيز مباشرة."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {LANES.map((lane) => {
                  const orders = regularByLane(lane.status);
                  return (
                    <Lane key={lane.status} label={lane.label} icon={lane.icon} tone={lane.tone} count={orders.length}>
                      {orders.length === 0 ? <LaneEmpty /> : orders.map((order) => (
                        <PrepCard key={order.id} order={order} tone={lane.tone} {...actionProps(order)} />
                      ))}
                    </Lane>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Custom / occasion: paid, prepared from a brief ── */}
          <TabsContent value="custom" className="space-y-5 mt-6">
            <Alert className="border-primary/20 bg-primary/5">
              <Cake className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong>طلبات مدفوعة:</strong> كيك مخصص وضيافة مناسبات — العميل دفع مسبقاً، جهّزها حسب التفاصيل المرفقة لكل طلب.
              </AlertDescription>
            </Alert>

            {customError ? (
              <ErrorState title="تعذّر تحميل الطلبات المخصصة" onRetry={() => refetchCustom()} />
            ) : customLoading ? (
              <LoadingState label="جاري تحميل الطلبات المخصصة..." />
            ) : customOrders.length === 0 ? (
              <EmptyState
                icon={Cake}
                title="لا توجد طلبات مخصصة أو ضيافة"
                description="ستظهر هنا طلبات الكيك المخصص والضيافة المدفوعة بانتظار التجهيز."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {LANES.map((lane) => {
                  const orders = customByLane(lane.status);
                  return (
                    <Lane key={lane.status} label={lane.label} icon={lane.icon} tone={lane.tone} count={orders.length}>
                      {orders.length === 0 ? <LaneEmpty /> : orders.map((order) => (
                        <CustomPrepCard
                          key={order.id}
                          order={order}
                          tone={lane.tone}
                          onBrief={() => setBriefOrder(order)}
                          {...actionProps(order)}
                        />
                      ))}
                    </Lane>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <OrderTransferDialog
          open={!!transferOrderId}
          onOpenChange={(open) => !open && setTransferOrderId(null)}
          orderId={transferOrderId || ''}
          currentBranchId={transferBranchId}
        />

        <OrderBriefDialog
          order={briefOrder}
          open={!!briefOrder}
          onOpenChange={(open) => !open && setBriefOrder(null)}
        />
      </div>
    </MainLayout>
  );
}
