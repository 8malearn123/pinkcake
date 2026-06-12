import { useParams, useNavigate } from 'react-router-dom';
import { useMyOrderDetails, useMyOrderRealtime } from '@/hooks/useCustomerStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PickupQRCode } from '@/components/orders/PickupQRCode';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Package,
  CreditCard,
  Receipt,
  Cake,
  CheckCircle2,
  AlertCircle,
  Store,
  LogOut,
} from 'lucide-react';
import { OrderStatus } from '@/types/order';

export default function MyOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: order, isLoading, error } = useMyOrderDetails(id);
  
  // Enable realtime updates
  useMyOrderRealtime(id);

  if (!user) {
    navigate('/customer-auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/my-orders')}>
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 text-center p-6">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">الطلب غير موجود</h2>
          <p className="text-muted-foreground mb-4">
            لم نتمكن من العثور على هذا الطلب
          </p>
          <Button onClick={() => navigate('/my-orders')}>
            العودة لطلباتي
          </Button>
        </Card>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/my-orders')} className="rounded-full" aria-label="رجوع">
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <div className="text-[10px] text-primary tracking-widest uppercase">طلب</div>
              <h1 className="font-display text-xl leading-none mt-0.5 truncate">{order.order_number}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => navigate('/store')} className="rounded-full" aria-label="المتجر">
              <Store className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full" aria-label="خروج">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 lg:px-6 py-8 max-w-3xl space-y-5">
        {/* Status Card */}
        <Card className="rounded-3xl border-border/60 shadow-soft-lift">
          <CardContent className="p-5">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="font-medium">حالة الطلب</span>
              </div>
              <StatusBadge status={order.status as OrderStatus} />
            </div>
            
            {/* Status Timeline */}
            <div className="overflow-x-auto pb-2">
              <OrderStatusTimeline
                currentStatus={order.status as OrderStatus}
                className="min-w-[600px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pickup QR Code - Only shown when ready for pickup */}
        {id && <PickupQRCode orderId={id} orderStatus={order.status} />}

        {/* Payment Status */}
        <Card className="rounded-3xl border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-medium">حالة الدفع</span>
              </div>
              <Badge variant={isPaid ? 'default' : 'secondary'} className="rounded-full">
                {isPaid ? (
                  <><CheckCircle2 className="w-3 h-3 me-1" /> تم الدفع</>
                ) : (
                  <><AlertCircle className="w-3 h-3 me-1" /> بانتظار الدفع</>
                )}
              </Badge>
            </div>
            {!isPaid && (
              <p className="text-sm text-muted-foreground mt-2">سيتم التواصل معك لإتمام عملية الدفع</p>
            )}
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-display text-xl">
              <MapPin className="w-4 h-4 text-primary" />
              معلومات الاستلام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {order.branch_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفرع</span>
                <span className="font-medium">{order.branch_name}</span>
              </div>
            )}
            {order.branch_address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">العنوان</span>
                <span className="font-medium text-end">{order.branch_address}</span>
              </div>
            )}
            {order.delivery_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> التاريخ
                </span>
                <span className="font-medium">{format(new Date(order.delivery_date), 'PPP', { locale: ar })}</span>
              </div>
            )}
            {order.delivery_time && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" /> الوقت
                </span>
                <span className="font-medium">{order.delivery_time}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-display text-xl">
              <Receipt className="w-4 h-4 text-primary" />
              تفاصيل الطلب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <Cake className="w-4 h-4 text-primary mt-1" />
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} × {item.unit_price} ر.س</p>
                      </div>
                    </div>
                    <span className="font-medium">{item.total_price} ر.س</span>
                  </div>
                  {index < (order.items?.length || 0) - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-baseline">
              <span className="font-semibold">المجموع الكلي</span>
              <span className="font-display text-3xl text-primary">
                {order.total_amount} <span className="text-sm text-muted-foreground">ر.س</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Back to Store */}
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => navigate('/store')} className="rounded-full px-6 h-11">
            <Store className="w-4 h-4 me-2" />
            العودة للمتجر
          </Button>
        </div>
      </main>

    </div>
  );
}
