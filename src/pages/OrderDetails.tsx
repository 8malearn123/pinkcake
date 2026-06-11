import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useOrder } from '@/hooks/useOrders';
import { useUpdateOrderStatus } from '@/hooks/useOrders';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { DeliveryCountdown } from '@/components/orders/DeliveryCountdown';
import { OrderNotesSection } from '@/components/orders/OrderNotesSection';
import { OrderActivityLog } from '@/components/orders/OrderActivityLog';
import { OrderTransferDialog } from '@/components/orders/OrderTransferDialog';
import { RevealCustomerPhoneButton } from '@/components/orders/RevealCustomerPhoneButton';
import { AdminStatusOverride } from '@/components/orders/AdminStatusOverride';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  MessageCircle,
  ArrowLeftRight,
  Shield,
} from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { useIsAdmin, useHasRole } from '@/hooks/useMyRoles';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const { data: order, isLoading, error } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const { hasRole: isAdmin } = useIsAdmin();
  const { hasRole: isKitchen } = useHasRole('kitchen');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">الطلب غير موجود</p>
          <Link to="/orders">
            <Button className="mt-4">العودة للطلبات</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const handleApprove = () => {
    updateStatus.mutate({ orderId: order.id, status: 'awaiting_payment' });
  };

  const handleSendWhatsApp = () => {
    // WhatsApp requires phone from audited reveal - show alert to use reveal button first
    alert('يرجى استخدام زر "عرض رقم الجوال" للوصول إلى رقم العميل أولاً');
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link to="/orders">
            <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للطلبات
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{order.order_number}</h1>
                <StatusBadge status={order.status as OrderStatus} />
              </div>
              <p className="text-muted-foreground mt-1">
                تم الإنشاء: {new Date(order.created_at).toLocaleString('ar-SA')}
              </p>
            </div>
            <div className="flex gap-2">
              {order.status === 'pending_approval' && (
                <Button
                  onClick={handleApprove}
                  className="gradient-gold text-white"
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  اعتماد الطلب
                </Button>
              )}
              {order.status === 'awaiting_payment' && (
                <Button
                  onClick={handleSendWhatsApp}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  إرسال واتساب
                </Button>
              )}
              {/* Transfer button for admin and kitchen */}
              {(isAdmin || isKitchen) && 
               ['preparing', 'ready_to_ship', 'in_transit'].includes(order.status) && (
                <Button
                  variant="outline"
                  onClick={() => setShowTransferDialog(true)}
                >
                  <ArrowLeftRight className="w-4 h-4 ml-2" />
                  نقل الطلب
                </Button>
              )}
              {/* Admin Status Override */}
              {isAdmin && (
                <AdminStatusOverride 
                  orderId={order.id} 
                  currentStatus={order.status as OrderStatus} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Delivery Countdown */}
        {order.delivery_date && order.delivery_time && order.status !== 'completed' && (
          <DeliveryCountdown
            deliveryDate={order.delivery_date}
            deliveryTime={order.delivery_time}
            status={order.status}
          />
        )}

        {/* Status Timeline */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-8">حالة الطلب</h2>
          <OrderStatusTimeline currentStatus={order.status as OrderStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">معلومات العميل</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-medium">{order.customer?.name || 'غير معروف'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الجوال</p>
                  {order.customer_id ? (
                    <RevealCustomerPhoneButton
                      customerId={order.customer_id}
                      orderId={order.id}
                      customerName={order.customer?.name}
                    />
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pickup Info */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">معلومات الاستلام</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الفرع</p>
                  <p className="font-medium">{order.branch?.name || 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التاريخ</p>
                  <p className="font-medium">{order.delivery_date || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الوقت</p>
                  <p className="font-medium">{order.delivery_time || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">تفاصيل الطلب</h2>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              <>
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.unit_price} ر.س × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold">{item.total_price} ر.س</p>
                  </div>
                ))}
                <div className="flex justify-between items-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-lg font-bold">الإجمالي</span>
                  <span className="text-2xl font-bold text-primary">{order.total_amount} ر.س</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد منتجات</p>
            )}
          </div>
        </div>

        {/* Internal Notes Section */}
        {id && <OrderNotesSection orderId={id} />}

        {/* Activity Log */}
        {id && <OrderActivityLog orderId={id} />}

        {/* Transfer Dialog */}
        {id && (
          <OrderTransferDialog
            open={showTransferDialog}
            onOpenChange={setShowTransferDialog}
            orderId={id}
            currentBranchId={order.branch_id}
          />
        )}
      </div>
    </MainLayout>
  );
}
