import { useState, Fragment } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/ds';
import { useDriverOrders } from '@/hooks/useHandoverBarcodes';
import { HandoverBarcodeScanner } from '@/components/orders/HandoverBarcodeScanner';
import { HandoverBarcodeDisplay } from '@/components/orders/HandoverBarcodeDisplay';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Truck,
  MapPin,
  Clock,
  Package,
  ScanLine,
  QrCode,
  ChevronLeft,
} from 'lucide-react';
import { OrderStatus } from '@/types/order';

type DriverFilter = 'all' | 'kitchen' | 'transit' | 'delivery';

export default function Driver() {
  const { data: orders = [], isLoading, error, refetch } = useDriverOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [filter, setFilter] = useState<DriverFilter>('all');

  const formatTime = (time: string | null) => (time ? time.substring(0, 5) : '-');
  const formatDate = (date: string | null) => (date ? new Date(date).toLocaleDateString('ar-SA-u-nu-latn') : '-');

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

  // Group orders by fulfilment stage
  const pendingKitchenPickup = orders.filter(o => o.status === 'ready_to_ship' && !o.handover_from_kitchen);
  const inTransit = orders.filter(o => o.status === 'in_transit' || (o.status === 'ready_to_ship' && o.handover_from_kitchen));
  const forDelivery = orders.filter(o => o.order_type === 'home_delivery' && o.status === 'ready_for_pickup');

  const displayedOrders =
    filter === 'kitchen' ? pendingKitchenPickup :
    filter === 'transit' ? inTransit :
    filter === 'delivery' ? forDelivery :
    orders;

  // Clickable command-bar stages: pick up from kitchen → in transit → deliver.
  const stages: { key: DriverFilter; label: string; value: number; icon: typeof Truck; box: string; text: string }[] = [
    { key: 'kitchen', label: 'للاستلام من المطبخ', value: pendingKitchenPickup.length, icon: Package, box: 'bg-warning/10 text-warning', text: 'text-warning' },
    { key: 'transit', label: 'في الطريق', value: inTransit.length, icon: Truck, box: 'bg-info/10 text-info', text: 'text-info' },
    { key: 'delivery', label: 'للتوصيل للعميل', value: forDelivery.length, icon: MapPin, box: 'bg-success/10 text-success', text: 'text-success' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="لوحة السائق"
          description="إدارة التسليمات والتوصيل"
          icon={Truck}
        />

        {/* Command bar — total (clears filter) + clickable fulfilment stages */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'flex items-center gap-3 p-5 text-start border-b lg:border-b-0 lg:border-e border-border/60 shrink-0 transition-colors',
                filter === 'all' ? 'bg-primary/[0.08]' : 'bg-primary/[0.04] hover:bg-primary/[0.06]'
              )}
            >
              <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{orders.length}</p>
                <p className="text-xs text-muted-foreground mt-1.5">إجمالي الطلبات</p>
              </div>
            </button>

            <div className="flex items-center justify-between gap-1 p-4 flex-1 overflow-x-auto">
              {stages.map((stage, i) => {
                const active = filter === stage.key;
                return (
                  <Fragment key={stage.key}>
                    <button
                      type="button"
                      onClick={() => setFilter(active ? 'all' : stage.key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 shrink-0 transition-colors',
                        active ? 'bg-muted' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all', stage.box, active && 'ring-2 ring-primary')}>
                        <stage.icon className="w-5 h-5" />
                      </div>
                      <p className={cn('text-xl font-bold leading-none', stage.text)}>{stage.value}</p>
                      <p className="text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">{stage.label}</p>
                    </button>
                    {i < stages.length - 1 && <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs — dir="rtl" so the card grid inside lays out RTL */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              الطلبات
              {orders.length > 0 && <Badge variant="secondary" className="ms-1">{orders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="kitchen-scan" className="gap-2">
              <ScanLine className="w-4 h-4" />
              مسح من المطبخ
            </TabsTrigger>
            <TabsTrigger value="delivery-scan" className="gap-2">
              <QrCode className="w-4 h-4" />
              مسح تسليم العميل
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-5">
            {displayedOrders.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="لا توجد طلبات للتوصيل حالياً"
                description={filter === 'all' ? 'ستظهر الطلبات هنا فور تجهيزها للشحن.' : 'لا توجد طلبات في هذه المرحلة.'}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {displayedOrders.map((order) => {
                  const selected = selectedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(selected ? null : order.id)}
                      className={cn(
                        'flex flex-col p-4 rounded-2xl border bg-card shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                        selected ? 'border-primary ring-2 ring-primary/40' : 'border-border/60 hover:border-primary/40'
                      )}
                    >
                      {/* Order no + status */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-primary">{order.order_number}</span>
                        <StatusBadge status={order.status as OrderStatus} showIcon={false} />
                      </div>

                      {/* Branch / pickup / customer */}
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{order.branch_name || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="tabular-nums">الاستلام: {formatTime(order.delivery_time)} - {formatDate(order.delivery_date)}</span>
                        </div>
                        {order.customer_name && (
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">العميل: {order.customer_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Order type + handover sub-status */}
                      <div className="mt-3 border-t border-border/50 pt-3">
                        <p className="mb-2 text-xs text-muted-foreground">
                          نوع الطلب: {order.order_type === 'home_delivery' ? 'توصيل منزلي' : 'استلام من الفرع'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {!order.handover_from_kitchen && order.status === 'ready_to_ship' && (
                            <span className="rounded bg-warning/10 px-2 py-1 text-xs text-warning">بانتظار الاستلام من المطبخ</span>
                          )}
                          {order.handover_from_kitchen && !order.handover_to_branch && (
                            <span className="rounded bg-info/10 px-2 py-1 text-xs text-info">في الطريق للفرع</span>
                          )}
                          {order.handover_to_branch && order.order_type === 'home_delivery' && (
                            <span className="rounded bg-success/10 px-2 py-1 text-xs text-success">جاهز للتوصيل للعميل</span>
                          )}
                        </div>
                      </div>

                      {/* Expandable handover barcode (kept from selection) */}
                      {selected && order.status === 'in_transit' && (
                        <div className="mt-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
                          <HandoverBarcodeDisplay
                            orderId={order.id}
                            barcodeType="branch_handover"
                            title="باركود تسليم الفرع"
                            description="اعرض هذا الباركود لمدير الفرع ليقوم بمسحه"
                            canGenerate
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="kitchen-scan" className="mt-5">
            <div className="glass-card mx-auto max-w-xl rounded-2xl p-6">
              <HandoverBarcodeScanner
                title="مسح باركود المطبخ"
                description="امسح الباركود من شاشة المطبخ لتأكيد استلام الطلب"
                expectedBarcodeTypes={['kitchen_handover']}
                onScanSuccess={() => {
                  setActiveTab('orders');
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="delivery-scan" className="mt-5">
            <div className="glass-card mx-auto max-w-xl rounded-2xl p-6">
              <HandoverBarcodeScanner
                title="مسح باركود العميل"
                description="امسح الباركود من جوال العميل لتأكيد تسليم الطلب"
                expectedBarcodeTypes={['customer_delivery']}
                onScanSuccess={() => {
                  setActiveTab('orders');
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
