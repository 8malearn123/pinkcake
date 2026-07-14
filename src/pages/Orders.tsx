import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, EmptyState, LoadingState, ErrorState } from '@/components/ds';
import { OrderCardList } from '@/components/dashboard/OrderCardList';
import { useOrders, useUpdateOrderStatus, useSendPaymentLink } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABELS, OrderStatus } from '@/types/order';

export default function Orders() {
  const { data: orders, isLoading, error, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const sendPaymentLink = useSendPaymentLink();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders?.filter((order) => {
    const customerName = order.customer?.name || '';

    // Search by customer name or order number only (phone removed for security)
    const matchesSearch =
      customerName.includes(searchQuery) ||
      order.order_number.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Map database orders to the format expected by OrdersTable
  const mappedOrders = filteredOrders?.map((order) => ({
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

  const handleApprove = (orderId: string) => {
    updateStatus.mutate({ orderId, status: 'awaiting_payment' });
  };

  const handleSendPaymentLink = (orderId: string) => {
    const order = orders?.find((o) => o.id === orderId);
    sendPaymentLink.mutate({ orderId, trackingCode: order?.tracking_code || '' });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="جميع الطلبات"
          description="إدارة ومتابعة جميع الطلبات"
          icon={ClipboardList}
          actions={
            <Link to="/orders/new">
              <Button className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5 me-2" />
                طلب جديد
              </Button>
            </Link>
          }
        />

        {/* Filters */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder="تصفية الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState label="جاري تحميل الطلبات..." />
        ) : error ? (
          <ErrorState title="تعذّر تحميل الطلبات" description={error.message} onRetry={() => refetch()} />
        ) : mappedOrders && mappedOrders.length > 0 ? (
          <OrderCardList
            orders={mappedOrders}
            onApprove={handleApprove}
            onSendPaymentLink={handleSendPaymentLink}
          />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد طلبات"
            description="لم يُعثر على طلبات مطابقة. جرّب تعديل البحث أو تصفية الحالة."
          />
        )}
      </div>
    </MainLayout>
  );
}
