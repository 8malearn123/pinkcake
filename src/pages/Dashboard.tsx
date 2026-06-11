import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  ChefHat,
  Plus,
  Loader2,
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1">مرحباً، هذا ملخص اليوم</p>
          </div>
          <Link to="/orders/new">
            <Button className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity">
              <Plus className="w-5 h-5 ml-2" />
              طلب جديد
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="إجمالي الطلبات"
            value={orders?.length || 0}
            icon={<ClipboardList className="w-7 h-7 text-white" />}
          />
          <StatsCard
            title="بانتظار الاعتماد"
            value={pendingOrders}
            icon={<Clock className="w-7 h-7 text-white" />}
          />
          <StatsCard
            title="قيد التجهيز"
            value={preparingOrders}
            icon={<ChefHat className="w-7 h-7 text-white" />}
          />
          <StatsCard
            title="تم التسليم اليوم"
            value={completedToday}
            icon={<CheckCircle2 className="w-7 h-7 text-white" />}
          />
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">آخر الطلبات</h2>
            <Link to="/orders" className="text-primary hover:underline font-medium">
              عرض الكل
            </Link>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : mappedOrders && mappedOrders.length > 0 ? (
            <OrdersTable
              orders={mappedOrders}
              onApprove={handleApprove}
              onSendPaymentLink={handleSendPaymentLink}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد طلبات بعد
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
