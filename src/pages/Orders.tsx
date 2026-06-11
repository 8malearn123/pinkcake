import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABELS, OrderStatus } from '@/types/order';
import { Card, CardContent } from '@/components/ui/card';

export default function Orders() {
  const { data: orders, isLoading, error } = useOrders();
  const updateStatus = useUpdateOrderStatus();
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
    // TODO: Implement payment link sending
    console.log('Send payment link for order:', orderId);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">جميع الطلبات</h1>
            <p className="text-muted-foreground mt-1">إدارة ومتابعة جميع الطلبات</p>
          </div>
          <Link to="/orders/new">
            <Button className="gradient-pink text-white shadow-warm">
              <Plus className="w-5 h-5 ml-2" />
              طلب جديد
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 ml-2" />
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">حدث خطأ في تحميل الطلبات</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </CardContent>
          </Card>
        ) : mappedOrders && mappedOrders.length > 0 ? (
          <OrdersTable
            orders={mappedOrders}
            onApprove={handleApprove}
            onSendPaymentLink={handleSendPaymentLink}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">لا توجد طلبات</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
