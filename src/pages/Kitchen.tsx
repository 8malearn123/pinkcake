import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingState, ErrorState } from '@/components/ds';
import { useKitchenOrders, useUpdateKitchenOrderStatus, useMarkOrderReady, useSendToBranch } from '@/hooks/useKitchenOrders';
import { useCustomOrdersForReview } from '@/hooks/useCustomOrders';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderTransferDialog } from '@/components/orders/OrderTransferDialog';
import { HandoverBarcodeDisplay } from '@/components/orders/HandoverBarcodeDisplay';
import { ChefReviewDialog } from '@/components/orders/ChefReviewDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHandoverBarcode } from '@/hooks/useHandoverBarcodes';
import { OrderStatus } from '@/types/order';
import { 
  ChefHat, 
  Clock, 
  MapPin, 
  CheckCircle2,
  ArrowLeft,
  Package,
  Loader2,
  QrCode,
  AlertTriangle,
  ScanLine,
  Cake,
  Users,
  Image,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function OrderBarcodeStatus({ orderId }: { orderId: string }) {
  const { data: barcode } = useHandoverBarcode(orderId, 'kitchen_handover');
  const hasBarcode = !!barcode;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      {hasBarcode ? (
        <span className="bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
          <QrCode className="w-3 h-3" />
          باركود جاهز
        </span>
      ) : (
        <span className="bg-muted text-muted-foreground px-2 py-1 rounded flex items-center gap-1">
          <QrCode className="w-3 h-3" />
          بدون باركود
        </span>
      )}
    </div>
  );
}

export default function Kitchen() {
  const [transferOrderId, setTransferOrderId] = useState<string | null>(null);
  const [transferBranchId, setTransferBranchId] = useState<string | null>(null);
  const [showBarcodeOrderId, setShowBarcodeOrderId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  
  const { data: kitchenOrders = [], isLoading, error, refetch } = useKitchenOrders();
  const { data: customOrders = [], isLoading: customLoading } = useCustomOrdersForReview();
  const updateStatus = useUpdateKitchenOrderStatus();
  const markReady = useMarkOrderReady();
  const sendToBranch = useSendToBranch();

  const handleStartPreparing = (orderId: string) => {
    updateStatus.mutate({ orderId, status: 'preparing' });
  };

  const handleMarkReady = (orderId: string) => {
    markReady.mutate(orderId);
  };

  const handleSendToBranch = (orderId: string) => {
    sendToBranch.mutate(orderId);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingState label="جاري تحميل الطلبات..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <ErrorState
          title="حدث خطأ في تحميل الطلبات"
          onRetry={() => refetch()}
        />
      </MainLayout>
    );
  }

  const isLoaderActive = updateStatus.isPending || markReady.isPending || sendToBranch.isPending;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-pink flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">المطبخ المركزي</h1>
            <p className="text-muted-foreground">إدارة تجهيز الطلبات</p>
          </div>
        </div>

        <Tabs defaultValue="regular" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="regular" className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              الطلبات العادية
              {kitchenOrders.length > 0 && (
                <Badge variant="secondary" className="ms-1">{kitchenOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Cake className="w-4 h-4" />
              طلبات مخصصة
              {customOrders.length > 0 && (
                <Badge variant="destructive" className="ms-1">{customOrders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regular" className="space-y-6 mt-6">
            {/* Barcode Workflow Notice */}
            <Alert className="border-primary/30 bg-primary/5">
              <ScanLine className="h-4 w-4" />
              <AlertDescription>
                <strong>نظام التسليم بالباركود:</strong> يجب على السائق مسح الباركود من الطلب الجاهز قبل إرساله للفرع.
              </AlertDescription>
            </Alert>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-secondary/50 border-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">بانتظار البدء</p>
                    <p className="text-2xl font-bold">
                      {kitchenOrders.filter(o => o.status === 'paid').length}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-accent/50 border-accent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">قيد التجهيز</p>
                    <p className="text-2xl font-bold">
                      {kitchenOrders.filter(o => o.status === 'preparing').length}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-primary/10 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">جاهز للإرسال</p>
                    <p className="text-2xl font-bold text-primary">
                      {kitchenOrders.filter(o => o.status === 'ready_to_ship').length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kitchenOrders.map((order) => (
                <Card key={order.id} className="p-5 glass-card hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono font-bold text-primary">{order.order_number}</span>
                    <StatusBadge status={order.status as OrderStatus} showIcon={false} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{order.branch_name || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>الاستلام: {formatTime(order.delivery_time)} - {formatDate(order.delivery_date)}</span>
                    </div>
                    {order.status === 'ready_to_ship' && (
                      <OrderBarcodeStatus orderId={order.id} />
                    )}
                  </div>

                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-sm font-medium mb-2">المنتجات:</p>
                    <div className="space-y-1">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.product_name}</span>
                          <span className="font-medium">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded">
                        ملاحظات: {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {order.status === 'paid' && (
                      <Button 
                        onClick={() => handleStartPreparing(order.id)}
                        className="w-full gradient-pink text-white"
                        disabled={isLoaderActive}
                      >
                        {updateStatus.isPending ? (
                          <Loader2 className="w-4 h-4 me-1 animate-spin" />
                        ) : (
                          <ChefHat className="w-4 h-4 me-1" />
                        )}
                        بدء التجهيز
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button 
                        onClick={() => handleMarkReady(order.id)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={isLoaderActive}
                      >
                        {markReady.isPending ? (
                          <Loader2 className="w-4 h-4 me-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 me-1" />
                        )}
                        تم التجهيز (إنشاء باركود)
                      </Button>
                    )}
                    {order.status === 'ready_to_ship' && (
                      <>
                        <Button 
                          onClick={() => setShowBarcodeOrderId(showBarcodeOrderId === order.id ? null : order.id)}
                          variant="outline" 
                          className="w-full"
                        >
                          <QrCode className="w-4 h-4 me-1" />
                          {showBarcodeOrderId === order.id ? 'إخفاء الباركود' : 'عرض الباركود للسائق'}
                        </Button>
                        <Button 
                          onClick={() => handleSendToBranch(order.id)}
                          variant="outline" 
                          className="w-full text-primary border-primary/30"
                          disabled={isLoaderActive}
                        >
                          {sendToBranch.isPending ? (
                            <Loader2 className="w-4 h-4 me-1 animate-spin" />
                          ) : (
                            <ArrowLeft className="w-4 h-4 me-1" />
                          )}
                          إرسال للفرع
                        </Button>
                        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          يجب مسح الباركود من السائق أولاً
                        </p>
                      </>
                    )}
                  </div>
                  
                  {showBarcodeOrderId === order.id && order.status === 'ready_to_ship' && (
                    <div className="mt-4 pt-4 border-t">
                      <HandoverBarcodeDisplay
                        orderId={order.id}
                        barcodeType="kitchen_handover"
                        title="باركود تسليم المطبخ"
                        description="يجب على السائق مسح هذا الباركود لاستلام الطلب"
                        canGenerate={false}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {kitchenOrders.length === 0 && (
              <div className="text-center py-16">
                <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-xl font-medium text-muted-foreground">لا توجد طلبات للتجهيز حالياً</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-6 mt-6">
            <Alert className="border-primary/30 bg-primary/10">
              <Cake className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                <strong>طلبات مخصصة:</strong> هذه الطلبات تتطلب مراجعة وتحديد السعر ووقت التحضير قبل إرسالها للعميل للموافقة.
              </AlertDescription>
            </Alert>

            {customLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : customOrders.length === 0 ? (
              <div className="text-center py-16">
                <Cake className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-xl font-medium text-muted-foreground">لا توجد طلبات مخصصة للمراجعة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customOrders.map((order) => (
                  <Card key={order.id} className="p-5 border-primary/30 bg-gradient-to-br from-pink-50 to-white hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono font-bold text-primary">{order.order_number}</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        بانتظار المراجعة
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Cake className="w-4 h-4 text-primary" />
                        <span className="font-medium">{order.product_type}</span>
                      </div>
                      {order.occasion && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>المناسبة: {order.occasion}</span>
                        </div>
                      )}
                      {order.number_of_people && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{order.number_of_people} شخص</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{order.branch_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(order.pickup_date), 'PPP', { locale: ar })} - {order.pickup_time}
                        </span>
                      </div>
                    </div>

                    {(order.flavor || order.filling) && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {order.flavor && (
                          <Badge variant="secondary" className="text-xs">
                            {order.flavor}
                          </Badge>
                        )}
                        {order.filling && (
                          <Badge variant="secondary" className="text-xs">
                            {order.filling}
                          </Badge>
                        )}
                        {order.sugar_level && (
                          <Badge variant="secondary" className="text-xs">
                            {order.sugar_level}
                          </Badge>
                        )}
                      </div>
                    )}

                    {order.writing_text && (
                      <div className="mb-3 p-2 bg-muted rounded text-sm">
                        <span className="text-muted-foreground">الكتابة: </span>
                        <span className="font-medium">"{order.writing_text}"</span>
                      </div>
                    )}

                    {order.reference_image_url && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Image className="w-4 h-4" />
                        <span>يوجد صورة مرجعية</span>
                      </div>
                    )}

                    <Button 
                      onClick={() => setReviewOrder(order)}
                      className="w-full bg-primary hover:bg-primary text-white"
                    >
                      <Cake className="w-4 h-4 me-1" />
                      مراجعة الطلب
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Transfer Dialog */}
        <OrderTransferDialog
          open={!!transferOrderId}
          onOpenChange={(open) => !open && setTransferOrderId(null)}
          orderId={transferOrderId || ''}
          currentBranchId={transferBranchId}
        />

        {/* Chef Review Dialog */}
        <ChefReviewDialog
          order={reviewOrder}
          open={!!reviewOrder}
          onOpenChange={(open) => !open && setReviewOrder(null)}
        />
      </div>
    </MainLayout>
  );
}
