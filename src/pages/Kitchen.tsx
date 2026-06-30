import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, EmptyState, LoadingState, ErrorState } from '@/components/ds';
import { useKitchenOrders, useUpdateKitchenOrderStatus, useMarkOrderReady, useSendToBranch, type KitchenOrder } from '@/hooks/useKitchenOrders';
import { useCustomOrdersForReview, type CustomOrderForReview } from '@/hooks/useCustomOrders';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderTransferDialog } from '@/components/orders/OrderTransferDialog';
import { HandoverBarcodeDisplay } from '@/components/orders/HandoverBarcodeDisplay';
import { ChefReviewDialog } from '@/components/orders/ChefReviewDialog';
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
  Users,
  Image,
  PartyPopper,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const formatTime = (time: string | null) => (time ? time.substring(0, 5) : '-');
const formatDate = (date: string | null) => (date ? new Date(date).toLocaleDateString('ar-SA') : '-');

/* ── Prep-board lanes ─────────────────────────────────────────────────────
   The kitchen is a ticket rail: paid orders wait, get prepared, then ship.
   Each workflow stage is a lane whose header carries its own live count, so
   no separate stats row is needed. */
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

interface PrepCardProps {
  order: KitchenOrder;
  tone: LaneTone;
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

function PrepCard({
  order, tone, barcodeOpen, onToggleBarcode, onStart, onReady, onSend, busy, starting, readying, sending,
}: PrepCardProps) {
  return (
    <Card className="overflow-hidden bg-card border-border/60 shadow-sm hover:shadow-soft-lift hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn('h-1.5', LANE_TONE[tone].accent)} />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono font-bold text-primary text-sm">{order.order_number}</span>
          <StatusBadge status={order.status as OrderStatus} showIcon={false} className="text-xs px-2 py-0.5" />
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{order.branch_name || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>الاستلام {formatTime(order.delivery_time)} · {formatDate(order.delivery_date)}</span>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 space-y-1">
          {order.items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="truncate">{item.product_name}</span>
              <span className="font-semibold text-muted-foreground shrink-0 ms-2">×{item.quantity}</span>
            </div>
          ))}
          {order.notes && (
            <p className="text-xs text-muted-foreground pt-1.5 mt-1 border-t border-border/50">
              <span className="font-medium">ملاحظات:</span> {order.notes}
            </p>
          )}
        </div>

        {order.status === 'paid' && (
          <Button onClick={onStart} className="w-full gradient-pink text-white shadow-warm hover:opacity-90" disabled={busy}>
            {starting ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <ChefHat className="w-4 h-4 me-1.5" />}
            بدء التجهيز
          </Button>
        )}

        {order.status === 'preparing' && (
          <Button onClick={onReady} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={busy}>
            {readying ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 me-1.5" />}
            تم التجهيز (إنشاء باركود)
          </Button>
        )}

        {order.status === 'ready_to_ship' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <OrderBarcodeStatus orderId={order.id} />
              <Button onClick={onToggleBarcode} variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/5">
                <QrCode className="w-3.5 h-3.5 me-1" />
                {barcodeOpen ? 'إخفاء' : 'عرض الباركود'}
              </Button>
            </div>
            <Button onClick={onSend} variant="outline" className="w-full text-primary border-primary/30 hover:bg-primary/5" disabled={busy}>
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
        )}
      </div>
    </Card>
  );
}

function CustomCard({ order, onReview }: { order: CustomOrderForReview; onReview: () => void }) {
  const isEvent = order.order_kind === 'event';
  const chips = [order.flavor, order.filling, order.sugar_level].filter(Boolean) as string[];

  return (
    <Card className="overflow-hidden bg-card border-border/60 shadow-sm hover:shadow-soft-lift hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn('h-1.5', isEvent ? 'gradient-pink' : 'bg-primary/40')} />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono font-bold text-primary text-sm">{order.order_number}</span>
          {isEvent ? (
            <Badge className="bg-primary text-primary-foreground gap-1">
              <PartyPopper className="w-3 h-3" /> ضيافة
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">بانتظار المراجعة</Badge>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {isEvent ? <PartyPopper className="w-5 h-5" /> : <Cake className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate leading-tight">{order.product_type}</p>
            {order.occasion && <p className="text-xs text-muted-foreground truncate">{order.occasion}</p>}
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          {order.number_of_people && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{order.number_of_people} شخص</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{order.branch_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{format(new Date(order.pickup_date), 'PPP', { locale: ar })} · {order.pickup_time}</span>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">{chip}</Badge>
            ))}
          </div>
        )}

        {order.writing_text && (
          <div className="rounded-xl bg-muted/40 p-2.5 text-sm">
            <span className="text-muted-foreground text-xs">الكتابة: </span>
            <span className="font-medium">"{order.writing_text}"</span>
          </div>
        )}

        {order.reference_image_url && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Image className="w-3.5 h-3.5" /> صورة مرجعية مرفقة
          </div>
        )}

        <Button onClick={onReview} className="w-full gradient-pink text-white shadow-warm hover:opacity-90">
          {isEvent ? <PartyPopper className="w-4 h-4 me-1.5" /> : <Cake className="w-4 h-4 me-1.5" />}
          مراجعة الطلب
        </Button>
      </div>
    </Card>
  );
}

export default function Kitchen() {
  const [transferOrderId, setTransferOrderId] = useState<string | null>(null);
  const [transferBranchId] = useState<string | null>(null);
  const [showBarcodeOrderId, setShowBarcodeOrderId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<CustomOrderForReview | null>(null);

  const { data: kitchenOrders = [], isLoading, error, refetch } = useKitchenOrders();
  const { data: customOrders = [], isLoading: customLoading, error: customError, refetch: refetchCustom } = useCustomOrdersForReview();

  const updateStatus = useUpdateKitchenOrderStatus();
  const markReady = useMarkOrderReady();
  const sendToBranch = useSendToBranch();

  // Oldest first within each lane so the chef works the queue in order.
  const byLane = (status: OrderStatus) =>
    [...kitchenOrders]
      .filter((o) => o.status === status)
      .sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime());

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="المطبخ المركزي"
          description="إدارة تجهيز الطلبات"
          icon={ChefHat}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => { refetch(); refetchCustom(); }}
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          }
        />

        <Tabs defaultValue="regular" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="regular" className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              الطلبات العادية
              {kitchenOrders.length > 0 && <Badge variant="secondary" className="ms-1">{kitchenOrders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Cake className="w-4 h-4" />
              طلبات مخصصة
              {customOrders.length > 0 && <Badge variant="destructive" className="ms-1">{customOrders.length}</Badge>}
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
                  const orders = byLane(lane.status);
                  const tone = LANE_TONE[lane.tone];
                  const Icon = lane.icon;
                  return (
                    <div key={lane.status} className="rounded-2xl bg-muted/30 border border-border/40 p-3">
                      <div className="flex items-center gap-2 px-1 pb-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', tone.iconBox)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">{lane.label}</span>
                        <span className={cn('ms-auto text-xs font-bold px-2 py-0.5 rounded-full', tone.count)}>
                          {orders.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {orders.length === 0 ? (
                          <p className="text-xs text-muted-foreground/70 text-center py-8 border border-dashed border-border/50 rounded-xl">
                            لا طلبات في هذه المرحلة
                          </p>
                        ) : (
                          orders.map((order) => (
                            <PrepCard
                              key={order.id}
                              order={order}
                              tone={lane.tone}
                              barcodeOpen={showBarcodeOrderId === order.id}
                              onToggleBarcode={() => setShowBarcodeOrderId(showBarcodeOrderId === order.id ? null : order.id)}
                              onStart={() => updateStatus.mutate({ orderId: order.id, status: 'preparing' })}
                              onReady={() => markReady.mutate(order.id)}
                              onSend={() => sendToBranch.mutate(order.id)}
                              busy={busy}
                              starting={updateStatus.isPending}
                              readying={markReady.isPending}
                              sending={sendToBranch.isPending}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Custom / hospitality review queue ── */}
          <TabsContent value="custom" className="space-y-5 mt-6">
            <Alert className="border-primary/30 bg-primary/10">
              <Cake className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                <strong>طلبات مخصصة:</strong> هذه الطلبات تتطلب مراجعة وتحديد السعر ووقت التحضير قبل إرسالها للعميل للموافقة.
              </AlertDescription>
            </Alert>

            {customError ? (
              <ErrorState title="تعذّر تحميل الطلبات المخصصة" onRetry={() => refetchCustom()} />
            ) : customLoading ? (
              <LoadingState label="جاري تحميل الطلبات المخصصة..." />
            ) : customOrders.length === 0 ? (
              <EmptyState
                icon={Cake}
                title="لا توجد طلبات مخصصة للمراجعة"
                description="ستظهر هنا طلبات الكيك المخصص والضيافة بانتظار التسعير."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {customOrders.map((order) => (
                  <CustomCard key={order.id} order={order} onReview={() => setReviewOrder(order)} />
                ))}
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

        <ChefReviewDialog
          order={reviewOrder}
          open={!!reviewOrder}
          onOpenChange={(open) => !open && setReviewOrder(null)}
        />
      </div>
    </MainLayout>
  );
}
