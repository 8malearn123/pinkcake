import { useState, useEffect, Fragment } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, SectionCard, EmptyState, LoadingState } from '@/components/ds';
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
  ChevronLeft,
  AlertTriangle,
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

/** Lighter empty state for the compact side rail — keeps the board airy. */
function MiniEmpty({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-7 px-3">
      <Icon className="w-7 h-7 text-muted-foreground/40 mb-2" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}

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
      maximumFractionDigits: 0,
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

  // Needs attention = orders past their delivery time that aren't done yet.
  // (Pay-upfront means there's no "awaiting approval" — the real risk is running late.)
  const nowMs = Date.now();
  const urgentOrders = orders?.filter((o) =>
    !!o.delivery_date && !!o.delivery_time &&
    new Date(`${o.delivery_date}T${o.delivery_time}`).getTime() < nowMs &&
    !['completed', 'ready_for_pickup'].includes(o.status)
  ).slice(0, 5) || [];

  // The order pipeline — pay-upfront: paid → preparing → delivery → done.
  const pipeline = [
    { key: 'new', label: 'بانتظار التجهيز', value: stats.paid, icon: Clock, box: 'bg-warning/10 text-warning', text: 'text-warning' },
    { key: 'prep', label: 'قيد التجهيز', value: stats.preparing, icon: ChefHat, box: 'bg-info/10 text-info', text: 'text-info' },
    { key: 'delivery', label: 'في التوصيل', value: stats.readyToShip + stats.inTransit, icon: Truck, box: 'bg-primary/10 text-primary', text: 'text-primary' },
    { key: 'done', label: 'مكتمل', value: stats.completed, icon: CheckCircle2, box: 'bg-success/10 text-success', text: 'text-success' },
  ];

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          title="لوحة التحكم المباشرة"
          description="متابعة الطلبات في الوقت الفعلي"
          icon={Activity}
          actions={
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                  isConnected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}
              >
                {isConnected ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
                {isConnected ? 'متصل' : 'غير متصل'}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Radio className="w-4 h-4 text-destructive animate-pulse" />
                <span className="font-mono text-lg font-bold">{format(currentTime, 'HH:mm:ss')}</span>
              </div>
            </div>
          }
        />

        {isLoading ? (
          <LoadingState label="جاري تحميل اللوحة المباشرة..." />
        ) : (
          <>
            {/* Ops command bar — revenue + total summary, then the live order pipeline */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="flex flex-col lg:flex-row">
                {/* Summary: today's revenue (hero) + total orders */}
                <div className="flex items-center gap-5 p-5 bg-primary/[0.04] border-b lg:border-b-0 lg:border-e border-border/60 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-none">{formatCurrency(stats.todayRevenue)}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">إيرادات اليوم</p>
                    </div>
                  </div>
                  <div className="w-px self-stretch bg-border/60" />
                  <div>
                    <p className="text-2xl font-bold leading-none">{stats.totalOrders}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">إجمالي الطلبات</p>
                  </div>
                </div>

                {/* Pipeline: where the day's orders currently sit */}
                <div className="flex items-center justify-between gap-1 p-4 flex-1 overflow-x-auto scrollbar-none">
                  {pipeline.map((stage, i) => (
                    <Fragment key={stage.key}>
                      <div className="flex flex-col items-center gap-1.5 px-2 shrink-0">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stage.box)}>
                          <stage.icon className="w-5 h-5" />
                        </div>
                        <p className={cn('text-xl font-bold leading-none', stage.text)}>{stage.value}</p>
                        <p className="text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">{stage.label}</p>
                      </div>
                      {i < pipeline.length - 1 && (
                        <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Panels — what needs action first, then the live feeds */}
            <div className="grid lg:grid-cols-3 gap-4 items-start">
              {/* Recent Orders — the main feed carries the screen */}
              <SectionCard title="آخر الطلبات" icon={Package} className="lg:col-span-2" contentClassName="pt-0">
                <ScrollArea className="h-[440px] pe-2">
                  {recentOrders.length === 0 ? (
                    <EmptyState icon={Package} title="لا توجد طلبات" description="عندما يصل طلب جديد سيظهر هنا مباشرة." />
                  ) : (
                    <div className="space-y-2.5">
                      {recentOrders.map((order) => {
                        const statusConfig = STATUS_CONFIG[order.status as OrderStatus];
                        return (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="w-full text-start p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <span className="font-mono text-sm font-semibold">{order.order_number}</span>
                              <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs whitespace-nowrap', statusConfig?.bgColor, statusConfig?.color)}>
                                {statusConfig?.icon}
                                <span>{statusConfig?.label}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground truncate">{order.customer?.name || '-'}</span>
                              <span className="font-semibold shrink-0 ms-2">{formatCurrency(order.total_amount)}</span>
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
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </SectionCard>

              {/* Side rail — alerts + live activity, height hugs content */}
              <div className="space-y-4">
                <SectionCard
                  title="تتطلب انتباهك"
                  icon={Bell}
                  action={urgentOrders.length > 0 ? <Badge variant="destructive">{urgentOrders.length}</Badge> : undefined}
                  contentClassName="pt-0"
                >
                  {urgentOrders.length === 0 ? (
                    <MiniEmpty icon={CheckCircle2} title="لا طلبات متأخرة" hint="كل الطلبات ضمن وقتها" />
                  ) : (
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pe-1">
                      {urgentOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="w-full text-start p-3 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <span className="font-mono font-bold text-sm">{order.order_number}</span>
                            <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> متأخر</Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground truncate">{order.customer?.name || 'عميل غير محدد'}</span>
                            <span className="text-xs font-medium shrink-0 flex items-center gap-1 text-muted-foreground">
                              {STATUS_CONFIG[order.status as OrderStatus]?.icon}
                              {STATUS_CONFIG[order.status as OrderStatus]?.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  title="النشاط المباشر"
                  icon={Activity}
                  action={recentEvents.length > 0 ? <Button variant="ghost" size="sm" onClick={clearEvents}>مسح</Button> : undefined}
                  contentClassName="pt-0"
                >
                  {recentEvents.length === 0 ? (
                    <MiniEmpty icon={Radio} title="في انتظار الأحداث" hint="تظهر التغييرات لحظة حدوثها" />
                  ) : (
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pe-1">
                      {recentEvents.map((event, index) => (
                        <button
                          key={`${event.id}-${index}`}
                          type="button"
                          onClick={() => navigate(`/orders/${event.id}`)}
                          className="w-full text-start flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
                        >
                          <div className="mt-0.5">{getEventIcon(event)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{event.orderNumber}</p>
                            <p className="text-xs text-muted-foreground truncate">{getEventLabel(event)}</p>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(event.timestamp, { locale: ar, addSuffix: true })}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>

            {/* Status Distribution Bar */}
            <SectionCard title="توزيع الحالات">
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
            </SectionCard>
          </>
        )}
      </div>
    </MainLayout>
  );
}
