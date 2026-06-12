import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeOrders, RealtimeEvent } from '@/hooks/useRealtimeOrders';
import { useNavigate } from 'react-router-dom';
import { DeliveryCountdown } from '@/components/orders/DeliveryCountdown';
import {
  Activity,
  Radio,
  Package,
  Clock,
  CreditCard,
  ChefHat,
  Truck,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Bell,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Enums } from '@/integrations/supabase/types';

type OrderStatus = Enums<'order_status'>;

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  pending_approval: { label: 'بانتظار الموافقة', icon: <Clock className="w-4 h-4" />, color: 'text-warning', bgColor: 'bg-warning/10' },
  awaiting_payment: { label: 'بانتظار الدفع', icon: <CreditCard className="w-4 h-4" />, color: 'text-warning', bgColor: 'bg-warning/10' },
  paid: { label: 'تم الدفع', icon: <DollarSign className="w-4 h-4" />, color: 'text-success', bgColor: 'bg-success/10' },
  preparing: { label: 'قيد التحضير', icon: <ChefHat className="w-4 h-4" />, color: 'text-info', bgColor: 'bg-info/10' },
  ready_to_ship: { label: 'جاهز للشحن', icon: <Package className="w-4 h-4" />, color: 'text-info', bgColor: 'bg-info/10' },
  in_transit: { label: 'في الطريق', icon: <Truck className="w-4 h-4" />, color: 'text-primary', bgColor: 'bg-primary/10' },
  ready_for_pickup: { label: 'جاهز للاستلام', icon: <Bell className="w-4 h-4" />, color: 'text-info', bgColor: 'bg-info/10' },
  completed: { label: 'مكتمل', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-success', bgColor: 'bg-success/10' },
  custom_pending_review: { label: 'طلب مخصص - بانتظار المراجعة', icon: <Clock className="w-4 h-4" />, color: 'text-primary', bgColor: 'bg-primary/10' },
  custom_chef_approved: { label: 'طلب مخصص - تمت الموافقة', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-info', bgColor: 'bg-info/10' },
  custom_rejected: { label: 'طلب مخصص - مرفوض', icon: <Clock className="w-4 h-4" />, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  sent_to_chef: { label: 'أُرسل للشيف', icon: <ChefHat className="w-4 h-4" />, color: 'text-primary', bgColor: 'bg-primary/10' },
  chef_priced: { label: 'تم التسعير', icon: <DollarSign className="w-4 h-4" />, color: 'text-info', bgColor: 'bg-info/10' },
  pricing_sent_to_customer: { label: 'بانتظار رد العميل', icon: <Clock className="w-4 h-4" />, color: 'text-warning', bgColor: 'bg-warning/10' },
  customer_accepted: { label: 'قُبل السعر', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-success', bgColor: 'bg-success/10' },
  customer_rejected: { label: 'رُفض السعر', icon: <Clock className="w-4 h-4" />, color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

export default function LiveDashboard() {
  const navigate = useNavigate();
  const { orders, stats, recentEvents, isLoading, isConnected, clearEvents } = useRealtimeOrders();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getEventIcon = (event: RealtimeEvent) => {
    if (event.type === 'INSERT') return <ArrowUp className="w-4 h-4 text-success" />;
    if (event.type === 'DELETE') return <ArrowDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-info" />;
  };

  const getEventLabel = (event: RealtimeEvent) => {
    if (event.type === 'INSERT') return 'طلب جديد';
    if (event.type === 'DELETE') return 'تم حذف الطلب';
    if (event.previousStatus && event.previousStatus !== event.status) {
      return `${STATUS_CONFIG[event.previousStatus]?.label || event.previousStatus} → ${STATUS_CONFIG[event.status]?.label || event.status}`;
    }
    return 'تم تحديث الطلب';
  };

  // Get recent orders (last 10)
  const recentOrders = orders?.slice(0, 10) || [];

  // Get orders needing attention (pending approval)
  const urgentOrders = orders?.filter((o) => o.status === 'pending_approval').slice(0, 5) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              لوحة التحكم المباشرة
            </h1>
            <p className="text-muted-foreground mt-1">متابعة الطلبات في الوقت الفعلي</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              isConnected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">غير متصل</span>
                </>
              )}
            </div>
            {/* Current Time */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <Radio className="w-4 h-4 text-destructive animate-pulse" />
              <span className="font-mono text-lg font-bold">
                {format(currentTime, 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Package className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold">{stats.totalOrders}</p>
                    <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-100 to-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto text-warning mb-2" />
                    <p className="text-3xl font-bold text-warning">{stats.pendingApproval}</p>
                    <p className="text-sm text-warning">بانتظار الموافقة</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-100 to-blue-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ChefHat className="w-8 h-8 mx-auto text-info mb-2" />
                    <p className="text-3xl font-bold text-info">{stats.paid + stats.preparing}</p>
                    <p className="text-sm text-info">قيد التجهيز</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-100 to-purple-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Truck className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold text-primary">{stats.readyToShip + stats.inTransit}</p>
                    <p className="text-sm text-primary">في التوصيل</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-100 to-green-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
                    <p className="text-3xl font-bold text-success">{stats.completed}</p>
                    <p className="text-sm text-success">مكتمل</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-100 to-emerald-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto text-success mb-2" />
                    <p className="text-xl font-bold text-success">{formatCurrency(stats.todayRevenue)}</p>
                    <p className="text-sm text-success">إيرادات اليوم</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Activity Feed */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      النشاط المباشر
                    </CardTitle>
                    {recentEvents.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearEvents}>
                        مسح
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {recentEvents.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>في انتظار الأحداث...</p>
                        <p className="text-sm mt-1">ستظهر هنا أي تغييرات على الطلبات</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentEvents.map((event, index) => (
                          <div
                            key={`${event.id}-${index}`}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => navigate(`/orders/${event.id}`)}
                          >
                            <div className="mt-0.5">{getEventIcon(event)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{event.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{getEventLabel(event)}</p>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(event.timestamp, { locale: ar, addSuffix: true })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Orders Needing Attention */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-warning" />
                    تتطلب انتباهك
                    {urgentOrders.length > 0 && (
                      <Badge variant="destructive" className="ms-2">
                        {urgentOrders.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {urgentOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
                        <p>لا توجد طلبات معلقة</p>
                        <p className="text-sm mt-1">جميع الطلبات تمت معالجتها</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {urgentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="p-4 rounded-lg border border-warning/30 bg-warning/50 hover:bg-warning/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono font-bold">{order.order_number}</span>
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                                {STATUS_CONFIG[order.status as OrderStatus]?.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.customer?.name || 'عميل غير محدد'}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              {formatCurrency(order.total_amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    آخر الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد طلبات</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                      {recentOrders.map((order) => {
                          const statusConfig = STATUS_CONFIG[order.status as OrderStatus];
                          return (
                            <div
                              key={order.id}
                              className="p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm font-medium">{order.order_number}</span>
                                <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', statusConfig?.bgColor, statusConfig?.color)}>
                                  {statusConfig?.icon}
                                  <span>{statusConfig?.label}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{order.customer?.name || '-'}</span>
                                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <DeliveryCountdown
                                  deliveryDate={order.delivery_date}
                                  deliveryTime={order.delivery_time}
                                  status={order.status}
                                  compact
                                />
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(order.created_at), { locale: ar, addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Status Distribution Bar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">توزيع الحالات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = orders?.filter((o) => o.status === status).length || 0;
                    const percentage = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
                    if (percentage === 0) return null;
                    return (
                      <div
                        key={status}
                        className={cn('flex items-center justify-center text-xs font-medium transition-all hover:opacity-80', config.bgColor, config.color)}
                        style={{ width: `${percentage}%` }}
                        title={`${config.label}: ${count}`}
                      >
                        {percentage > 8 && count}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = orders?.filter((o) => o.status === status).length || 0;
                    if (count === 0) return null;
                    return (
                      <div key={status} className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', config.bgColor)} />
                        <span className="text-sm text-muted-foreground">{config.label}</span>
                        <span className="text-sm font-medium">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
