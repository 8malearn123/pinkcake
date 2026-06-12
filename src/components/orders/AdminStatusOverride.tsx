import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAdminChangeOrderStatus } from '@/hooks/useHandoverBarcodes';
import { Shield, Loader2 } from 'lucide-react';
import { OrderStatus } from '@/types/order';

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending_approval', label: 'بانتظار الموافقة' },
  { value: 'awaiting_payment', label: 'بانتظار الدفع' },
  { value: 'paid', label: 'تم الدفع' },
  { value: 'preparing', label: 'قيد التجهيز' },
  { value: 'ready_to_ship', label: 'جاهز للإرسال' },
  { value: 'in_transit', label: 'في الطريق' },
  { value: 'ready_for_pickup', label: 'جاهز للاستلام' },
  { value: 'completed', label: 'تم الاستلام' },
];

interface AdminStatusOverrideProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function AdminStatusOverride({ orderId, currentStatus }: AdminStatusOverrideProps) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(currentStatus);
  const [reason, setReason] = useState('');
  
  const changeStatus = useAdminChangeOrderStatus();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }
    
    await changeStatus.mutateAsync({
      orderId,
      newStatus,
      reason: reason.trim(),
    });
    
    setOpen(false);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
          <Shield className="w-4 h-4 me-2" />
          تغيير الحالة (مدير)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            تغيير حالة الطلب
          </DialogTitle>
          <DialogDescription>
            كمدير، يمكنك تغيير حالة الطلب مباشرة. يجب إدخال سبب التغيير.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>الحالة الحالية</Label>
            <div className="p-2 bg-muted rounded-lg text-sm">
              {ORDER_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>الحالة الجديدة</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem 
                    key={status.value} 
                    value={status.value}
                    disabled={status.value === currentStatus}
                  >
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>سبب التغيير <span className="text-destructive">*</span></Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب تغيير الحالة..."
              rows={3}
            />
            {!reason.trim() && (
              <p className="text-xs text-destructive">سبب التغيير مطلوب</p>
            )}
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ سيتم تسجيل هذا التغيير كـ "تجاوز إداري" في سجل الطلب
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason.trim() || newStatus === currentStatus || changeStatus.isPending}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {changeStatus.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
            تأكيد التغيير
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
