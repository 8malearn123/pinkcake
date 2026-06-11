import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Eye, DollarSign, Clock, MapPin } from 'lucide-react';
import { usePricedOrdersForSupport, useSendPricingToCustomer } from '@/hooks/useCustomOrderWorkflow';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PricedOrdersTable() {
  const { data: orders = [], isLoading } = usePricedOrdersForSupport();
  const sendPricing = useSendPricingToCustomer();
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);
  const [confirmSend, setConfirmSend] = useState<string | null>(null);

  const handleSendPricing = (orderId: string) => {
    sendPricing.mutate(orderId, {
      onSuccess: () => setConfirmSend(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">لا توجد طلبات مسعّرة بانتظار الإرسال للعملاء</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-mono">{order.order_number}</CardTitle>
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">
                  تم التسعير
                </Badge>
              </div>
              <CardDescription>{order.product_type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">العميل:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{order.branch_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {order.pickup_date && format(new Date(order.pickup_date), 'PPP', { locale: ar })}
                </span>
              </div>
              
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">السعر المقترح:</span>
                  <span className="text-xl font-bold text-primary">{order.chef_proposed_price} ر.س</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">وقت التحضير:</span>
                  <span>{order.chef_preparation_time}</span>
                </div>
              </div>

              {order.customer_visible_notes && (
                <div className="bg-muted/50 rounded-lg p-2 text-sm">
                  <span className="text-muted-foreground">ملاحظات الشيف:</span>
                  <p className="mt-1">{order.customer_visible_notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye className="w-4 h-4 ml-1" />
                  التفاصيل
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setConfirmSend(order.id)}
                  disabled={sendPricing.isPending}
                >
                  <Send className="w-4 h-4 ml-1" />
                  إرسال للعميل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirm Send Dialog */}
      <Dialog open={!!confirmSend} onOpenChange={() => setConfirmSend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد إرسال السعر</DialogTitle>
            <DialogDescription>
              هل تريد إرسال عرض السعر للعميل؟ سيتمكن العميل من قبول أو رفض السعر.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmSend(null)}>
              إلغاء
            </Button>
            <Button
              onClick={() => confirmSend && handleSendPricing(confirmSend)}
              disabled={sendPricing.isPending}
            >
              {sendPricing.isPending ? (
                <Loader2 className="w-4 h-4 ml-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-1" />
              )}
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب المسعّر</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">رقم الطلب:</span>
                  <p className="font-mono font-bold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">نوع المنتج:</span>
                  <p className="font-medium">{selectedOrder.product_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">العميل:</span>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">الفرع:</span>
                  <p>{selectedOrder.branch_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">تاريخ الاستلام:</span>
                  <p>
                    {selectedOrder.pickup_date && format(new Date(selectedOrder.pickup_date), 'PPP', { locale: ar })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">وقت الاستلام:</span>
                  <p>{selectedOrder.pickup_time}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-medium">السعر المقترح:</span>
                  <span className="text-2xl font-bold text-primary">{selectedOrder.chef_proposed_price} ر.س</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">وقت التحضير:</span>
                  <span>{selectedOrder.chef_preparation_time}</span>
                </div>
              </div>

              {selectedOrder.customer_visible_notes && (
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">ملاحظات للعميل:</span>
                  <p className="mt-1">{selectedOrder.customer_visible_notes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                تم التسعير: {selectedOrder.chef_reviewed_at && format(new Date(selectedOrder.chef_reviewed_at), 'PPpp', { locale: ar })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
