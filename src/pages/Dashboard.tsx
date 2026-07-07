import { Fragment } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, EmptyState, LoadingState, ErrorState, SectionHeading } from '@/components/ds';
import { OrderCardList } from '@/components/dashboard/OrderCardList';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types/order';

export default function Dashboard() {
  const { data: orders, isLoading, isError, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const handleApprove = (orderId: string) => {
    updateStatus.mutate({ orderId, status: 'awaiting_payment' });
  };

  const handleSendPaymentLink = (orderId: string) => {
    // TODO: Implement payment link sending
    console.log('Send payment link for order:', orderId);
  };

  const pendingOrders = orders?.filter((o) => o.status === 'pending_approval').length || 0;
  const preparingOrders = orders?.filter((o) => o.status === 'preparing').length || 0;
  const completedToday =
    orders?.filter((o) => {
      if (o.status !== 'completed') return false;
      const today = new Date().toDateString();
      const orderDate = new Date(o.updated_at).toDateString();
      return today === orderDate;
    }).length || 0;

  const totalOrders = orders?.length || 0;

  // The order lifecycle for the command-bar pipeline: awaiting approval → prep → delivered.
  const pipeline = [
    { key: 'pending', label: 'بانتظار الاعتماد', value: pendingOrders, icon: Clock, box: 'bg-warning/10 text-warning', text: 'text-warning' },
    { key: 'preparing', label: 'قيد التجهيز', value: preparingOrders, icon: ChefHat, box: 'bg-info/10 text-info', text: 'text-info' },
    { key: 'completed', label: 'تم التسليم اليوم', value: completedToday, icon: CheckCircle2, box: 'bg-success/10 text-success', text: 'text-success' },
  ];

  // Map database orders to the format expected by OrdersTable
  const mappedOrders = orders?.slice(0, 10).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer?.name || 'غير معروف',
    branchId: order.branch_id || '',
    branchName: order.branch?.name || 'غير محدد',
    items: [],
    totalAmount: order.total_amount,
    status: order.status as OrderStatus,
    pickupDate: order.delivery_date || '',
    pickupTime: order.delivery_time || '',
    paymentStatus: (order.payment_status || 'unpaid') as 'unpaid' | 'paid' | 'failed',
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    createdBy: '',
    trackingCode: order.tracking_code || '',
  }));

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader
          title="لوحة التحكم"
          description="مرحباً، هذا ملخص اليوم"
        />

        {/* Command bar — total (hero) + the order-lifecycle pipeline */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center gap-3 p-5 bg-primary/[0.04] border-b lg:border-b-0 lg:border-e border-border/60 shrink-0">
              <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1.5">إجمالي الطلبات</p>
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

        {/* Recent Orders */}
        <div>
          <SectionHeading
            title="آخر الطلبات"
            action={
              <Link to="/orders" className="text-primary hover:underline font-medium">
                عرض الكل
              </Link>
            }
          />
          {isLoading ? (
            <LoadingState label="جاري تحميل الطلبات..." />
          ) : isError ? (
            <ErrorState title="تعذّر تحميل الطلبات" onRetry={() => refetch()} />
          ) : mappedOrders && mappedOrders.length > 0 ? (
            <OrderCardList
              orders={mappedOrders}
              onApprove={handleApprove}
              onSendPaymentLink={handleSendPaymentLink}
            />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="لا توجد طلبات بعد"
              description="عندما يصل طلب جديد سيظهر هنا مباشرة"
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
