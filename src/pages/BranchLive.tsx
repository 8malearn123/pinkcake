import { useState, useEffect, Fragment } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, LoadingState, EmptyState } from '@/components/ds';
import { useMyBranch } from '@/hooks/useMyRoles';
import { useBranchOrders } from '@/hooks/useBranchOrders';
import { HandoverBarcodeScanner } from '@/components/orders/HandoverBarcodeScanner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Activity,
  Package,
  ScanLine,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { OrderStatus } from '@/types/order';

interface LiveOrderItem {
  product_name: string;
  quantity: number;
  notes: string | null;
}

interface LiveOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  delivery_date: string | null;
  delivery_time: string | null;
  items: LiveOrderItem[];
  created_at: string;
}

/* Live "ticket" — order no + status ride the top, then time/customer, the
   product list, and a status-appropriate footer note. Same card language as
   the branch orders board. */
function LiveOrderCard({ order, mode }: { order: LiveOrder; mode: 'incoming' | 'ready' }) {
  return (
    <div className="flex flex-col p-4 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold text-primary">{order.order_number}</span>
        <StatusBadge status={order.status} showIcon={false} />
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {mode === 'incoming' ? (
          <>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="tabular-nums">
              {order.delivery_time?.substring(0, 5) || '-'}
              {order.delivery_date ? ` · ${new Date(order.delivery_date).toLocaleDateString('ar-SA-u-nu-latn')}` : ''}
            </span>
          </>
        ) : (
          <>
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{order.customer_name}</span>
          </>
        )}
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
          <p className="text-xs font-medium text-muted-foreground">المنتجات</p>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{item.product_name}</span>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums">×{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <div className={cn('mt-3 flex items-center gap-1.5 border-t border-border/50 pt-3 text-xs', mode === 'ready' ? 'text-success' : 'text-muted-foreground')}>
        {mode === 'ready' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Truck className="w-3.5 h-3.5 shrink-0" />}
        {mode === 'ready' ? 'جاهز لاستلام العميل' : 'بانتظار وصول السائق — امسح الباركود لاستلام الطلب'}
      </div>
    </div>
  );
}

export default function BranchLive() {
  const { data: myBranch, isLoading: branchLoading } = useMyBranch();
  const { data: orders = [], isLoading: ordersLoading, refetch } = useBranchOrders();
  const [activeTab, setActiveTab] = useState('live');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Set up realtime subscription
  useEffect(() => {
    if (!myBranch?.id) return;

    const channel = supabase
      .channel('branch-live-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `branch_id=eq.${myBranch.id}`,
        },
        () => {
          refetch();
          setLastRefresh(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myBranch?.id, refetch]);

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  if (branchLoading) {
    return (
      <MainLayout>
        <LoadingState label="جاري التحميل..." />
      </MainLayout>
    );
  }

  if (!myBranch) {
    return (
      <MainLayout>
        <EmptyState
          icon={AlertCircle}
          title="لا يمكن الوصول"
          description="لم يتم تعيين فرع لحسابك. يرجى التواصل مع الإدارة لربط حسابك بفرع."
          action={
            <Link to="/contact">
              <Button variant="outline">تواصل مع الإدارة</Button>
            </Link>
          }
        />
      </MainLayout>
    );
  }

  // Filter orders by status for live view
  const incomingOrders = orders.filter(o => o.status === 'in_transit');
  const readyOrders = orders.filter(o => o.status === 'ready_for_pickup');
  const todayOrders = orders.filter(o => {
    const today = new Date().toISOString().split('T')[0];
    return o.delivery_date === today;
  });

  const stages = [
    { key: 'in_transit', label: 'في الطريق', value: incomingOrders.length, icon: Truck, box: 'bg-info/10 text-info', text: 'text-info' },
    { key: 'ready', label: 'جاهز للاستلام', value: readyOrders.length, icon: CheckCircle2, box: 'bg-success/10 text-success', text: 'text-success' },
    { key: 'today', label: 'طلبات اليوم', value: todayOrders.length, icon: Clock, box: 'bg-warning/10 text-warning', text: 'text-warning' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="العمليات المباشرة"
          description={`فرع: ${myBranch.name}`}
          icon={Activity}
          actions={
            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA-u-nu-latn')}
              </span>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>
            </div>
          }
        />

        {/* Command bar — total (hero) + the branch flow */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center gap-3 p-5 bg-primary/[0.04] border-b lg:border-b-0 lg:border-e border-border/60 shrink-0">
              <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{orders.length}</p>
                <p className="text-xs text-muted-foreground mt-1.5">إجمالي الطلبات</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 p-4 flex-1 overflow-x-auto">
              {stages.map((stage, i) => (
                <Fragment key={stage.key}>
                  <div className="flex flex-col items-center gap-1.5 px-2 shrink-0">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stage.box)}>
                      <stage.icon className="w-5 h-5" />
                    </div>
                    <p className={cn('text-xl font-bold leading-none', stage.text)}>{stage.value}</p>
                    <p className="text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">{stage.label}</p>
                  </div>
                  {i < stages.length - 1 && <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Barcode Notice */}
        <Alert className="border-primary/30 bg-primary/5">
          <ScanLine className="h-4 w-4" />
          <AlertDescription>
            <strong>نظام الاستلام بالباركود:</strong> استخدم ماسح الباركود لاستلام الطلبات من السائق.
            لا يمكن قبول الطلبات يدوياً — يجب مسح الباركود.
          </AlertDescription>
        </Alert>

        {/* Tabs — dir="rtl" so the card grid inside lays out RTL */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="gap-2">
              <Activity className="w-4 h-4" />
              الطلبات الواردة
              {incomingOrders.length > 0 && <Badge variant="secondary" className="ms-1">{incomingOrders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="scan" className="gap-2">
              <ScanLine className="w-4 h-4" />
              مسح الباركود
            </TabsTrigger>
            <TabsTrigger value="ready" className="gap-2">
              <Package className="w-4 h-4" />
              جاهز للاستلام
              {readyOrders.length > 0 && <Badge variant="secondary" className="ms-1">{readyOrders.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-5">
            {ordersLoading ? (
              <LoadingState label="جاري تحميل الطلبات..." />
            ) : incomingOrders.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="لا توجد طلبات في الطريق"
                description="ستظهر الطلبات هنا فور إرسالها من المطبخ."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {incomingOrders.map((order) => (
                  <LiveOrderCard key={order.id} order={order} mode="incoming" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scan" className="mt-5">
            <div className="glass-card mx-auto max-w-xl rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <QrCode className="w-5 h-5 text-primary" />
                مسح باركود التسليم
              </h2>
              <HandoverBarcodeScanner
                title="مسح باركود السائق"
                description="امسح الباركود من جوال السائق لتأكيد استلام الطلب"
                expectedBarcodeTypes={['branch_handover']}
                onScanSuccess={() => {
                  setActiveTab('ready');
                  refetch();
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="ready" className="mt-5">
            {readyOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="لا توجد طلبات جاهزة للاستلام"
                description="الطلبات المستلمة من السائق ستظهر هنا."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {readyOrders.map((order) => (
                  <LiveOrderCard key={order.id} order={order} mode="ready" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
