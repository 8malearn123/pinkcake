import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, StatTile, EmptyState, LoadingState, SectionHeading } from '@/components/ds';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  ChefHat,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { OrderStatus } from '@/types/order';

export default function Dashboard() {
  const { data: orders, isLoading } = useOrders();
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
          actions={
            <Link to="/orders/new">
              <Button className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5 ml-2" />
                طلب جديد
              </Button>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatTile label="إجمالي الطلبات" value={orders?.length || 0} icon={ClipboardList} tone="primary" />
          <StatTile label="بانتظار الاعتماد" value={pendingOrders} icon={Clock} tone="warning" />
          <StatTile label="قيد التجهيز" value={preparingOrders} icon={ChefHat} tone="info" />
          <StatTile label="تم التسليم اليوم" value={completedToday} icon={CheckCircle2} tone="success" />
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
          ) : mappedOrders && mappedOrders.length > 0 ? (
            <OrdersTable
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
