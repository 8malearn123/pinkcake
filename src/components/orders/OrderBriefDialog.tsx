import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomOrderForReview } from '@/hooks/useCustomOrders';
import { Users, Cake, PartyPopper, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SERVE_LABELS: Record<string, string> = {
  centerpiece_cake: 'كيكة المناسبة', assorted_mini: 'حلا ميني متنوّع', chocolate: 'شوكولاتة ضيافة',
  cupcake: 'كب كيك', maamoul: 'معمول وبيتفور', trays: 'صواني حلا',
};
const STATION_LABELS: Record<string, string> = { ready_corner: 'ركن حلا جاهز', live: 'محطة حية', none: 'بدون' };
const FULFILL_LABELS: Record<string, string> = { delivery: 'توصيل', onsite_setup: 'تجهيز في الموقع' };

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-end">{value}</span>
    </div>
  );
}

interface OrderBriefDialogProps {
  order: CustomOrderForReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Read-only brief for a paid custom/occasion order. Pay-upfront model: the price
 * is already settled at checkout, so the chef just reads what to make. No pricing
 * or feasibility form — prep actions live on the order card.
 */
export function OrderBriefDialog({ order, open, onOpenChange }: OrderBriefDialogProps) {
  if (!order) return null;
  const isEvent = order.order_kind === 'event';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEvent ? <PartyPopper className="h-5 w-5 text-primary" /> : <Cake className="h-5 w-5 text-primary" />}
            {isEvent ? 'تفاصيل طلب الضيافة' : 'تفاصيل الطلب المخصص'} - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        {/* Paid confirmation — no pricing needed, just prepare */}
        <div className="flex items-center justify-between rounded-lg bg-success/10 text-success px-4 py-2.5 text-sm">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> مدفوع مسبقاً — جاهز للتجهيز
          </span>
          {order.total_amount != null && <span className="font-bold">{order.total_amount} ر.س</span>}
        </div>

        {/* Order details + requirements */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">تفاصيل الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <DetailRow label="العميل" value={order.customer_name} />
              <DetailRow label="الفرع" value={order.branch_name} />
              <DetailRow label="تاريخ الاستلام" value={format(new Date(order.pickup_date), 'PPP', { locale: ar })} />
              <DetailRow label="وقت الاستلام" value={order.pickup_time} />
              <DetailRow label="تاريخ الطلب" value={format(new Date(order.created_at), 'PPP', { locale: ar })} />
            </CardContent>
          </Card>

          {isEvent ? (
            <Card className="border-primary/30 bg-primary/[0.03]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-1.5">
                  <PartyPopper className="h-4 w-4" /> متطلبات الضيافة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.occasion && <DetailRow label="المناسبة" value={order.occasion} />}
                {order.guest_count != null && (
                  <DetailRow label="عدد الضيوف" value={<span className="flex items-center gap-1"><Users className="h-3 w-3" />{order.guest_count} ضيف</span>} />
                )}
                {order.serve_styles && order.serve_styles.length > 0 && (
                  <DetailRow label="الأصناف" value={order.serve_styles.map((s) => SERVE_LABELS[s] ?? s).join(' · ')} />
                )}
                {order.station_type && order.station_type !== 'none' && (
                  <DetailRow label="ركن الضيافة" value={STATION_LABELS[order.station_type] ?? order.station_type} />
                )}
                {order.servers_needed && (
                  <DetailRow label="طاقم الخدمة" value={`${order.servers_count ?? '—'} مقدّم × ${order.service_hours ?? '—'} ساعات`} />
                )}
                {order.event_date && (
                  <DetailRow label="تاريخ المناسبة" value={format(new Date(order.event_date), 'PPP', { locale: ar })} />
                )}
                {order.fulfillment_mode && (
                  <DetailRow label="طريقة التقديم" value={FULFILL_LABELS[order.fulfillment_mode] ?? order.fulfillment_mode} />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">متطلبات المنتج</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <DetailRow label="نوع المنتج" value={<Badge variant="secondary">{order.product_type}</Badge>} />
                {order.occasion && <DetailRow label="المناسبة" value={order.occasion} />}
                {order.number_of_people && (
                  <DetailRow label="عدد الأشخاص" value={<span className="flex items-center gap-1"><Users className="h-3 w-3" />{order.number_of_people}</span>} />
                )}
                {order.flavor && <DetailRow label="النكهة" value={order.flavor} />}
                {order.filling && <DetailRow label="الحشوة" value={order.filling} />}
                {order.sugar_level && <DetailRow label="السكر" value={order.sugar_level} />}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Design brief */}
        {(order.design_description || order.writing_text || order.reference_image_url) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">تفاصيل التصميم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.writing_text && (
                <div>
                  <Label className="text-xs text-muted-foreground">نص الكتابة:</Label>
                  <p className="mt-1 rounded-md bg-muted p-2 text-lg font-medium">"{order.writing_text}"</p>
                </div>
              )}
              {order.design_description && (
                <div>
                  <Label className="text-xs text-muted-foreground">وصف التصميم:</Label>
                  <p className="mt-1 rounded-md bg-muted p-2">{order.design_description}</p>
                </div>
              )}
              {order.reference_image_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">صورة مرجعية:</Label>
                  <div className="mt-1">
                    <img src={order.reference_image_url} alt="Reference" className="max-h-48 rounded-md object-contain" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {order.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ملاحظات إضافية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
