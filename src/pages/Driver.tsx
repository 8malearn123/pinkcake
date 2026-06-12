import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDriverOrders } from '@/hooks/useHandoverBarcodes';
import { HandoverBarcodeScanner } from '@/components/orders/HandoverBarcodeScanner';
import { HandoverBarcodeDisplay } from '@/components/orders/HandoverBarcodeDisplay';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  Loader2,
  ScanLine,
  QrCode,
} from 'lucide-react';
import { OrderStatus } from '@/types/order';

export default function Driver() {
  const { data: orders = [], isLoading, error } = useDriverOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('orders');

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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <p className="text-destructive">حدث خطأ في تحميل الطلبات</p>
        </div>
      </MainLayout>
    );
  }

  // Group orders by status
  const pendingKitchenPickup = orders.filter(o => o.status === 'ready_to_ship' && !o.handover_from_kitchen);
  const inTransit = orders.filter(o => o.status === 'in_transit' || (o.status === 'ready_to_ship' && o.handover_from_kitchen));
  const forDelivery = orders.filter(o => o.order_type === 'home_delivery' && o.status === 'ready_for_pickup');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-info flex items-center justify-center">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">لوحة السائق</h1>
            <p className="text-muted-foreground">إدارة التسليمات والتوصيل</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-secondary/50 border-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Package className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">للاستلام من المطبخ</p>
                <p className="text-2xl font-bold">{pendingKitchenPickup.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-accent/50 border-accent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">في الطريق</p>
                <p className="text-2xl font-bold">{inTransit.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">للتوصيل للعميل</p>
                <p className="text-2xl font-bold text-primary">{forDelivery.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="kitchen-scan">مسح من المطبخ</TabsTrigger>
            <TabsTrigger value="delivery-scan">مسح تسليم العميل</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-xl font-medium text-muted-foreground">لا توجد طلبات للتوصيل حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <Card 
                    key={order.id} 
                    className={`p-5 hover:shadow-lg transition-shadow cursor-pointer ${
                      selectedOrderId === order.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedOrderId(order.id === selectedOrderId ? null : order.id)}
                  >
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
                      {order.customer_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>العميل: {order.customer_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>نوع الطلب: {order.order_type === 'home_delivery' ? 'توصيل منزلي' : 'استلام من الفرع'}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {!order.handover_from_kitchen && order.status === 'ready_to_ship' && (
                          <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded">
                            بانتظار الاستلام من المطبخ
                          </span>
                        )}
                        {order.handover_from_kitchen && !order.handover_to_branch && (
                          <span className="text-xs bg-info/10 text-info px-2 py-1 rounded">
                            في الطريق للفرع
                          </span>
                        )}
                        {order.handover_to_branch && order.order_type === 'home_delivery' && (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                            جاهز للتوصيل للعميل
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedOrderId === order.id && order.status === 'in_transit' && (
                      <div className="mt-4 pt-4 border-t">
                        <HandoverBarcodeDisplay
                          orderId={order.id}
                          barcodeType="branch_handover"
                          title="باركود تسليم الفرع"
                          description="اعرض هذا الباركود لمدير الفرع ليقوم بمسحه"
                          canGenerate
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="kitchen-scan">
            <HandoverBarcodeScanner
              title="مسح باركود المطبخ"
              description="امسح الباركود من شاشة المطبخ لتأكيد استلام الطلب"
              expectedBarcodeTypes={['kitchen_handover']}
              onScanSuccess={() => {
                setActiveTab('orders');
              }}
            />
          </TabsContent>

          <TabsContent value="delivery-scan">
            <HandoverBarcodeScanner
              title="مسح باركود العميل"
              description="امسح الباركود من جوال العميل لتأكيد تسليم الطلب"
              expectedBarcodeTypes={['customer_delivery']}
              onScanSuccess={() => {
                setActiveTab('orders');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
