import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, MapPin, Phone, Calendar, Clock, Gift, Sparkles, Copy, MessageCircle, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import LozaShell from './LozaShell';
import { useLozaCart, LozaOrder } from '@/contexts/LozaCartContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const STAGES: { key: LozaOrder['status']; label: string; emoji: string }[] = [
  { key: 'placed', label: 'تم استلام الطلب', emoji: '📝' },
  { key: 'confirmed', label: 'تأكيد المتجر', emoji: '✅' },
  { key: 'preparing', label: 'قيد التحضير', emoji: '👨‍🍳' },
  { key: 'on-the-way', label: 'في الطريق إليك', emoji: '🚚' },
  { key: 'delivered', label: 'تم التسليم', emoji: '🎉' },
];

export default function LozaOrderDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getOrder } = useLozaCart();
  const order = id ? getOrder(id) : undefined;
  const [showSuccess, setShowSuccess] = useState(params.get('placed') === '1');

  // Simulated progression
  const [stageIdx, setStageIdx] = useState(() => STAGES.findIndex((s) => s.key === order?.status));
  useEffect(() => {
    if (!order) return;
    if (stageIdx >= STAGES.length - 1) return;
    const t = setTimeout(() => setStageIdx((i) => Math.min(STAGES.length - 1, i + 1)), 4000);
    return () => clearTimeout(t);
  }, [stageIdx, order]);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 2400);
    return () => clearTimeout(t);
  }, [showSuccess]);

  if (!order) {
    return (
      <LozaShell>
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-xl font-bold mb-3">لم نجد هذا الطلب</h1>
          <Link to="/loza/orders" className="text-primary font-medium">طلباتي ←</Link>
        </div>
      </LozaShell>
    );
  }

  const copyNumber = () => {
    navigator.clipboard.writeText(order.number);
    toast({ title: 'تم نسخ رقم الطلب 📋' });
  };

  return (
    <LozaShell>
      {/* Success splash */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center animate-in fade-in">
          <div className="text-center px-6">
            <div className="w-28 h-28 mx-auto rounded-full gradient-loza-gold flex items-center justify-center shadow-loza-lift animate-bounce">
              <Check className="w-14 h-14 text-[hsl(var(--loza-brown))]" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold font-loza-display mt-5">تم استلام طلبك! 🎉</h2>
            <p className="text-muted-foreground mt-2">رقم الطلب: <b className="text-foreground">{order.number}</b></p>
          </div>
        </div>
      )}

      <header className="bg-background sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/loza/orders')} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold font-loza-display">تفاصيل الطلب</h1>
            <button onClick={copyNumber} className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-primary">
              #{order.number} <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4 space-y-4 pb-24">
        {/* Tracking */}
        <section className="bg-card rounded-3xl shadow-loza-lift border border-border/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold font-loza-display">حالة الطلب</h2>
            <span className="text-[11px] gradient-loza-gold text-[hsl(var(--loza-brown))] px-3 py-1 rounded-full font-bold">
              {STAGES[stageIdx]?.emoji} {STAGES[stageIdx]?.label}
            </span>
          </div>
          <div className="relative">
            <div className="absolute start-4 top-3 bottom-3 w-0.5 bg-border" />
            <div
              className="absolute start-4 top-3 w-0.5 gradient-loza-gold transition-all duration-700"
              style={{ height: `${(stageIdx / (STAGES.length - 1)) * 100}%` }}
            />
            <ul className="space-y-4">
              {STAGES.map((s, i) => {
                const done = i <= stageIdx;
                const current = i === stageIdx;
                return (
                  <li key={s.key} className="relative flex items-center gap-3 ps-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10 transition-all',
                        done
                          ? 'gradient-loza-gold text-[hsl(var(--loza-brown))] shadow-loza'
                          : 'bg-muted text-muted-foreground',
                        current && 'ring-4 ring-primary/20 animate-pulse'
                      )}
                    >
                      {done ? <Check className="w-4 h-4" strokeWidth={3} /> : s.emoji}
                    </div>
                    <div className="flex-1">
                      <div className={cn('text-sm font-bold', done ? 'text-foreground' : 'text-muted-foreground')}>
                        {s.label}
                      </div>
                      {current && (
                        <div className="text-[11px] text-primary mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> الآن
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Driver card */}
          {stageIdx >= 3 && stageIdx < 4 && (
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-[hsl(var(--loza-gold-light))]/40 to-transparent border border-[hsl(var(--loza-gold))]/30 p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-loza-gold flex items-center justify-center text-xl">🧑‍✈️</div>
              <div className="flex-1">
                <div className="font-bold text-sm">الكابتن أحمد</div>
                <div className="text-[11px] text-muted-foreground">يصل خلال ~ 25 دقيقة</div>
              </div>
              <a href="tel:0500000000" className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </a>
              <button className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Items */}
        <section className="bg-card rounded-3xl shadow-loza border border-border/40 p-4">
          <h3 className="text-sm font-bold font-loza-display mb-3">المنتجات ({order.items.length})</h3>
          <div className="space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 p-2 rounded-2xl bg-muted/30">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center text-2xl shrink-0">
                  {it.isCustom ? '✨' : it.emoji || '🎂'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm line-clamp-1">{it.name}</div>
                  <div className="text-[11px] text-muted-foreground">× {it.quantity}</div>
                </div>
                <div className="font-bold text-sm">{it.unitPrice * it.quantity} ر.س</div>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery */}
        <section className="bg-card rounded-3xl shadow-loza border border-border/40 p-4 space-y-3">
          <h3 className="text-sm font-bold font-loza-display">معلومات التوصيل</h3>
          <Info icon={order.deliveryType === 'gift' ? Gift : Truck} label={order.deliveryType === 'gift' ? 'هدية لـ' : 'المستلم'} value={order.recipientName} />
          <Info icon={Phone} label="الجوال" value={order.recipientPhone} />
          <Info icon={MapPin} label="العنوان" value={`${order.city} • ${order.address}`} />
          <Info icon={Calendar} label="التاريخ" value={order.deliveryDate} />
          <Info icon={Clock} label="الوقت" value={order.deliveryTime} />
          {order.giftMessage && (
            <div className="rounded-2xl bg-[hsl(var(--loza-gold-light))]/30 border border-[hsl(var(--loza-gold))]/30 p-3">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1"><Gift className="w-3 h-3" /> رسالة الهدية</div>
              <p className="text-sm italic">"{order.giftMessage}"</p>
            </div>
          )}
        </section>

        {/* Summary */}
        <section className="bg-card rounded-3xl shadow-loza border border-border/40 p-4 space-y-2 text-sm">
          <h3 className="text-sm font-bold font-loza-display mb-2">ملخص الفاتورة</h3>
          <Row label="المجموع الفرعي" value={`${order.subtotal} ر.س`} />
          <Row label="التوصيل" value={order.delivery === 0 ? 'مجاني' : `${order.delivery} ر.س`} />
          <div className="border-t border-border/60 pt-2 mt-1 flex justify-between font-extrabold text-base">
            <span>الإجمالي</span>
            <span className="text-gradient-loza">{order.total} ر.س</span>
          </div>
          <div className="text-[11px] text-muted-foreground pt-1">
            طريقة الدفع: <b>{paymentLabel(order.paymentMethod)}</b>
          </div>
        </section>

        <Button
          onClick={() => navigate('/loza')}
          variant="outline"
          className="w-full rounded-full border-2"
        >
          العودة للرئيسية
        </Button>
      </main>
    </LozaShell>
  );
}

function paymentLabel(p: LozaOrder['paymentMethod']) {
  return { card: 'بطاقة بنكية', 'apple-pay': 'Apple Pay', 'stc-pay': 'STC Pay', cod: 'الدفع عند الاستلام' }[p];
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
