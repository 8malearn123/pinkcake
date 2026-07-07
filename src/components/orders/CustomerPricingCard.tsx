import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, DollarSign, Clock, MapPin, Cake } from 'lucide-react';
import { CustomerPricingRequest, useRespondToPricing } from '@/hooks/useCustomOrderWorkflow';
import { RiyalSymbol } from '@/components/ui/riyal';
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

interface CustomerPricingCardProps {
  order: CustomerPricingRequest;
}

export function CustomerPricingCard({ order }: CustomerPricingCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const respondToPricing = useRespondToPricing();

  const handleAccept = () => {
    respondToPricing.mutate({ orderId: order.id, accepted: true });
  };

  const handleReject = () => {
    respondToPricing.mutate(
      { orderId: order.id, accepted: false, rejectionReason },
      { onSuccess: () => setShowRejectDialog(false) }
    );
  };

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">عرض سعر جديد</CardTitle>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              بانتظار ردك
            </Badge>
          </div>
          <CardDescription>
            طلب رقم: {order.order_number}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">نوع المنتج:</span>
              <p className="font-medium">{order.product_type}</p>
            </div>
            {order.occasion && (
              <div>
                <span className="text-muted-foreground">المناسبة:</span>
                <p className="font-medium">{order.occasion}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{order.branch_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {order.pickup_date && format(new Date(order.pickup_date), 'PPP', { locale: ar })}
              </span>
            </div>
          </div>

          {/* Price Display */}
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">السعر المقترح</p>
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold text-primary">{order.proposed_price}</span>
              <RiyalSymbol className="text-lg text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              وقت التحضير: {order.preparation_time}
            </p>
          </div>

          {order.chef_notes && (
            <div className="bg-muted rounded-lg p-3">
              <span className="text-sm font-medium">ملاحظات من الشيف:</span>
              <p className="mt-1 text-sm text-muted-foreground">{order.chef_notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setShowRejectDialog(true)}
              disabled={respondToPricing.isPending}
            >
              <X className="w-4 h-4 me-1" />
              رفض السعر
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={respondToPricing.isPending}
            >
              {respondToPricing.isPending ? (
                <Loader2 className="w-4 h-4 me-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 me-1" />
              )}
              قبول والدفع
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            عند القبول سيتم توجيهك لصفحة الدفع
          </p>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض عرض السعر</DialogTitle>
            <DialogDescription>
              يرجى توضيح سبب رفضك لعرض السعر لمساعدتنا في تقديم عرض أفضل
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>سبب الرفض (اختياري)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: السعر مرتفع جداً، أريد تصميم أبسط..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={respondToPricing.isPending}
            >
              {respondToPricing.isPending ? (
                <Loader2 className="w-4 h-4 me-1 animate-spin" />
              ) : (
                <X className="w-4 h-4 me-1" />
              )}
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
