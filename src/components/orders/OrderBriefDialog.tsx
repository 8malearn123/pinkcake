import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomOrderForReview } from '@/hooks/useCustomOrders';
import { CakePreview } from '@/components/cake/CakePreview';
import { resolveCakeConfig } from '@/lib/cakeBuilder';
import {
  Users, Cake, PartyPopper, CheckCircle2, User, MapPin, Calendar,
  Sparkles, Image as ImageIcon, StickyNote, ChefHat, Grid2x2, ConciergeBell, MapPinned,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SERVE_LABELS: Record<string, string> = {
  centerpiece_cake: 'كيكة المناسبة', assorted_mini: 'حلا ميني متنوّع', chocolate: 'شوكولاتة ضيافة',
  cupcake: 'كب كيك', maamoul: 'معمول وبيتفور', trays: 'صواني حلا',
};
const STATION_LABELS: Record<string, string> = { ready_corner: 'ركن حلا جاهز', live: 'محطة حية', none: 'بدون' };
const FULFILL_LABELS: Record<string, string> = { delivery: 'توصيل', onsite_setup: 'تجهيز في الموقع' };

type IconType = React.ComponentType<{ className?: string }>;

/* A key fact — icon tile + label + value. */
function Fact({ icon: Icon, label, value }: { icon: IconType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card p-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="font-semibold text-sm truncate leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* A cake-spec tile (flavor / filling / sugar). */
function SpecTile({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-muted/40 p-3 text-center">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  );
}

function SectionHead({ icon: Icon, title }: { icon: IconType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-bold">{title}</h3>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="text-sm font-medium text-end">{value}</span>
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
 * is already settled at checkout, so the chef just reads what to make.
 */
export function OrderBriefDialog({ order, open, onOpenChange }: OrderBriefDialogProps) {
  if (!order) return null;
  const isEvent = order.order_kind === 'event';
  const peopleValue = isEvent ? order.guest_count : order.number_of_people;
  const cakeCfg = !isEvent && order.cake_design ? resolveCakeConfig(order.cake_design) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0 gap-0" dir="rtl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
              {isEvent ? <PartyPopper className="w-6 h-6 text-white" /> : <Cake className="w-6 h-6 text-white" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {isEvent ? 'تفاصيل طلب الضيافة' : 'تفاصيل الطلب المخصص'}
              </DialogTitle>
              <p className="font-mono text-sm text-primary font-bold mt-0.5">{order.order_number}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Paid banner */}
          <div className="flex items-center justify-between rounded-xl bg-success/10 border border-success/20 px-4 py-3">
            <span className="flex items-center gap-2.5 font-semibold text-success">
              <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              مدفوع مسبقاً — جاهز للتجهيز
            </span>
            {order.total_amount != null && (
              <span className="font-bold text-success text-lg">
                {order.total_amount} <span className="text-sm font-medium">ر.س</span>
              </span>
            )}
          </div>

          {/* Key facts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Fact icon={User} label="العميل" value={order.customer_name} />
            <Fact icon={MapPin} label="الفرع" value={order.branch_name} />
            <Fact
              icon={Calendar}
              label="الاستلام"
              value={`${format(new Date(order.pickup_date), 'd MMM', { locale: ar })} · ${order.pickup_time}`}
            />
            {peopleValue != null && (
              <Fact icon={Users} label={isEvent ? 'الضيوف' : 'الأشخاص'} value={`${peopleValue} ${isEvent ? 'ضيف' : 'شخص'}`} />
            )}
          </div>

          {/* Spec card */}
          {isEvent ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5">
              <SectionHead icon={PartyPopper} title="متطلبات الضيافة" />
              <div className="space-y-0.5">
                {order.occasion && <DetailRow icon={Sparkles} label="المناسبة" value={order.occasion} />}
                {order.serve_styles && order.serve_styles.length > 0 && (
                  <DetailRow icon={Cake} label="الأصناف" value={order.serve_styles.map((s) => SERVE_LABELS[s] ?? s).join(' · ')} />
                )}
                {order.station_type && order.station_type !== 'none' && (
                  <DetailRow icon={Grid2x2} label="ركن الضيافة" value={STATION_LABELS[order.station_type] ?? order.station_type} />
                )}
                {order.servers_needed && (
                  <DetailRow icon={ConciergeBell} label="طاقم الخدمة" value={`${order.servers_count ?? '—'} مقدّم × ${order.service_hours ?? '—'} ساعات`} />
                )}
                {order.event_date && (
                  <DetailRow icon={Calendar} label="تاريخ المناسبة" value={format(new Date(order.event_date), 'PPP', { locale: ar })} />
                )}
                {order.fulfillment_mode && (
                  <DetailRow icon={MapPinned} label="طريقة التقديم" value={FULFILL_LABELS[order.fulfillment_mode] ?? order.fulfillment_mode} />
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <SectionHead icon={ChefHat} title="مواصفات الكيكة" />
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{order.product_type}</Badge>
                {order.occasion && <span className="text-sm text-muted-foreground">مناسبة: {order.occasion}</span>}
              </div>
              {(order.flavor || order.filling || order.sugar_level) && (
                <div className="grid grid-cols-3 gap-2">
                  <SpecTile label="النكهة" value={order.flavor} />
                  <SpecTile label="الحشوة" value={order.filling} />
                  <SpecTile label="مستوى السكر" value={order.sugar_level} />
                </div>
              )}
            </div>
          )}

          {/* Design brief (custom cakes) */}
          {(cakeCfg || order.design_description || order.writing_text || order.reference_image_url) && (
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <SectionHead icon={Sparkles} title="التصميم" />

              {cakeCfg && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">الشكل الذي صمّمه العميل</p>
                  <CakePreview config={cakeCfg} />
                </div>
              )}

              {order.writing_text && (
                <div className="rounded-2xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/15 px-5 py-6 text-center">
                  <p className="text-xs text-muted-foreground mb-2">نص الكتابة على الكيكة</p>
                  <p className="font-display text-2xl text-primary leading-snug">"{order.writing_text}"</p>
                </div>
              )}

              {order.design_description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">وصف التصميم</p>
                  <p className="rounded-xl bg-muted/40 p-3.5 text-sm leading-relaxed">{order.design_description}</p>
                </div>
              )}

              {order.reference_image_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> صورة مرجعية</p>
                  <img src={order.reference_image_url} alt="Reference" className="max-h-56 rounded-xl object-contain border border-border/50" />
                </div>
              )}
            </div>
          )}

          {/* Notes — kept prominent (may carry allergy/special instructions) */}
          {order.notes && (
            <div className="rounded-2xl border border-warning/25 bg-warning/5 p-4">
              <div className="flex items-center gap-2 mb-2 text-warning font-semibold text-sm">
                <StickyNote className="w-4 h-4" /> ملاحظات مهمة
              </div>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
