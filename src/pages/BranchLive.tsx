import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMyBranch } from '@/hooks/useMyRoles';
import { useBranchOrders } from '@/hooks/useBranchOrders';
import { HandoverBarcodeScanner } from '@/components/orders/HandoverBarcodeScanner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Package, 
  ScanLine, 
  Clock, 
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
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
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!myBranch) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto">
          <Card className="border-destructive/30">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold text-destructive">
                لا يمكن الوصول
              </h2>
              <p className="text-muted-foreground">
                لم يتم تعيين فرع لحسابك. يرجى التواصل مع الإدارة.
              </p>
            </CardContent>
          </Card>
        </div>
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">العمليات المباشرة</h1>
              <p className="text-muted-foreground">
                فرع: <span className="font-medium text-foreground">{myBranch.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')}
            </span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 me-1" />
              تحديث
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">في الطريق</p>
                  <p className="text-2xl font-bold text-blue-600">{incomingOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">جاهز للاستلام</p>
                  <p className="text-2xl font-bold text-green-600">{readyOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">طلبات اليوم</p>
                  <p className="text-2xl font-bold text-orange-600">{todayOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-purple-600">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barcode Notice */}
        <Alert className="border-primary/30 bg-primary/5">
          <ScanLine className="h-4 w-4" />
          <AlertDescription>
            <strong>نظام الاستلام بالباركود:</strong> استخدم ماسح الباركود لاستلام الطلبات من السائق. 
            لا يمكن قبول الطلبات يدوياً - يجب مسح الباركود.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="gap-2">
              <Activity className="w-4 h-4" />
              الطلبات الواردة ({incomingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="scan" className="gap-2">
              <ScanLine className="w-4 h-4" />
              مسح الباركود
            </TabsTrigger>
            <TabsTrigger value="ready" className="gap-2">
              <Package className="w-4 h-4" />
              جاهز للاستلام ({readyOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : incomingOrders.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-xl font-medium text-muted-foreground">لا توجد طلبات في الطريق</p>
                <p className="text-sm text-muted-foreground mt-2">ستظهر الطلبات هنا فور إرسالها من المطبخ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomingOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-blue-500/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono text-lg">{order.order_number}</CardTitle>
                        <StatusBadge status={order.status as OrderStatus} showIcon={false} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {order.delivery_time?.substring(0, 5) || '-'} - {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ar-SA') : '-'}
                        </span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">المنتجات:</p>
                        <div className="space-y-1">
                          {order.items?.map((item: LiveOrderItem, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.product_name}</span>
                              <Badge variant="secondary">×{item.quantity}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          بانتظار وصول السائق - امسح الباركود لاستلام الطلب
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scan">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  مسح باركود التسليم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HandoverBarcodeScanner
                  title="مسح باركود السائق"
                  description="امسح الباركود من جوال السائق لتأكيد استلام الطلب"
                  expectedBarcodeTypes={['branch_handover']}
                  onScanSuccess={() => {
                    setActiveTab('ready');
                    refetch();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-xl font-medium text-muted-foreground">لا توجد طلبات جاهزة للاستلام</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-green-500/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono text-lg">{order.order_number}</CardTitle>
                        <StatusBadge status={order.status as OrderStatus} showIcon={false} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{order.customer_name}</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">المنتجات:</p>
                        <div className="space-y-1">
                          {order.items?.map((item: LiveOrderItem, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.product_name}</span>
                              <Badge variant="secondary">×{item.quantity}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          جاهز لاستلام العميل
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
