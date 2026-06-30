import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useChefReviewOrder, CustomOrderForReview } from '@/hooks/useCustomOrders';
import { Loader2, Check, X, Clock, Users, Cake, Image, PartyPopper } from 'lucide-react';
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

const reviewSchema = z.object({
  feasibility: z.enum(['feasible', 'not_feasible', 'needs_modification']),
  preparationTime: z.string().min(1, 'وقت التحضير مطلوب'),
  proposedPrice: z.coerce.number().min(1, 'السعر مطلوب'),
  notes: z.string().optional(),
  customerNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
}).refine((data) => {
  if (data.feasibility === 'not_feasible' && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: 'سبب الرفض مطلوب',
  path: ['rejectionReason'],
}).refine((data) => {
  if (data.feasibility === 'needs_modification' && !data.customerNotes?.trim()) {
    return false;
  }
  return true;
}, {
  message: 'يرجى ذكر التعديلات المطلوبة',
  path: ['customerNotes'],
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ChefReviewDialogProps {
  order: CustomOrderForReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const preparationTimes = [
  '1-2 ساعات',
  '2-4 ساعات',
  '4-6 ساعات',
  'يوم واحد',
  'يومين',
  '3 أيام',
  'أسبوع',
];

export function ChefReviewDialog({ order, open, onOpenChange }: ChefReviewDialogProps) {
  const reviewOrder = useChefReviewOrder();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      feasibility: 'feasible',
      preparationTime: '',
      proposedPrice: 0,
      notes: '',
      customerNotes: '',
      rejectionReason: '',
    },
  });

  const feasibility = form.watch('feasibility');
  const isEvent = order?.order_kind === 'event';

  // Reset the form whenever the dialog closes so stale values never bleed into
  // the next order's review.
  const handleClose = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (!order) return;

    await reviewOrder.mutateAsync({
      orderId: order.id,
      feasibility: data.feasibility,
      preparationTime: data.preparationTime,
      proposedPrice: data.proposedPrice,
      notes: data.notes,
      rejectionReason: data.rejectionReason,
      customerNotes: data.customerNotes,
    });

    form.reset();
    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEvent ? <PartyPopper className="h-5 w-5 text-primary" /> : <Cake className="h-5 w-5" />}
            {isEvent ? 'مراجعة طلب الضيافة' : 'مراجعة الطلب المخصص'} - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        {/* Order Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                تفاصيل الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">العميل:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفرع:</span>
                <span>{order.branch_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الاستلام:</span>
                <span>
                  {format(new Date(order.pickup_date), 'PPP', { locale: ar })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">وقت الاستلام:</span>
                <span>{order.pickup_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الطلب:</span>
                <span>
                  {format(new Date(order.created_at), 'PPP', { locale: ar })}
                </span>
              </div>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  متطلبات المنتج
                </CardTitle>
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

        {/* Design Details */}
        {(order.design_description || order.writing_text || order.reference_image_url) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                تفاصيل التصميم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.writing_text && (
                <div>
                  <Label className="text-xs text-muted-foreground">نص الكتابة:</Label>
                  <p className="mt-1 rounded-md bg-muted p-2 text-lg font-medium">
                    "{order.writing_text}"
                  </p>
                </div>
              )}
              {order.design_description && (
                <div>
                  <Label className="text-xs text-muted-foreground">وصف التصميم:</Label>
                  <p className="mt-1 rounded-md bg-muted p-2">
                    {order.design_description}
                  </p>
                </div>
              )}
              {order.reference_image_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">صورة مرجعية:</Label>
                  <div className="mt-1">
                    <img
                      src={order.reference_image_url}
                      alt="Reference"
                      className="max-h-48 rounded-md object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {order.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ملاحظات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Chef Review Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  تقييم الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="feasibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>إمكانية التنفيذ *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="feasible">
                            <span className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-success" />
                              ممكن التنفيذ
                            </span>
                          </SelectItem>
                          <SelectItem value="needs_modification">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-warning" />
                              يحتاج تعديل
                            </span>
                          </SelectItem>
                          <SelectItem value="not_feasible">
                            <span className="flex items-center gap-2">
                              <X className="h-4 w-4 text-destructive" />
                              غير ممكن
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {feasibility !== 'not_feasible' && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="preparationTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>وقت التحضير المتوقع *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الوقت" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {preparationTimes.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="proposedPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السعر المقترح (ر.س) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                placeholder="0"
                                min={1}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات داخلية (للموظفين فقط)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="ملاحظات داخلية لا تظهر للعميل..."
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {feasibility === 'needs_modification' ? 'التعديلات المطلوبة (تظهر للعميل) *' : 'ملاحظات للعميل'}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={feasibility === 'needs_modification'
                                ? 'اذكر التعديلات التي يحتاجها الطلب ليصبح قابلاً للتنفيذ…'
                                : 'ملاحظات ستظهر للعميل مع عرض السعر…'}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {feasibility === 'not_feasible' && (
                  <FormField
                    control={form.control}
                    name="rejectionReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سبب الرفض *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="اشرح سبب عدم إمكانية تنفيذ الطلب..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={reviewOrder.isPending}
                variant={feasibility === 'not_feasible' ? 'destructive' : 'default'}
              >
                {reviewOrder.isPending ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : feasibility === 'not_feasible' ? (
                  'رفض الطلب'
                ) : (
                  'اعتماد الطلب'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
