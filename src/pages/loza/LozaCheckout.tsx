import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Calendar, Clock, Gift, CreditCard, Smartphone, Truck, User, Phone, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import LozaShell from './LozaShell';
import { useLozaCart } from '@/contexts/LozaCartContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const CITIES = ['جازان', 'صبيا', 'أبو عريش', 'صامطة', 'بيش'];
const TIMES = ['10:00 ص', '12:00 م', '2:00 م', '4:00 م', '6:00 م', '8:00 م'];

export default function LozaCheckout() {
  const navigate = useNavigate();
  const loc = useLocation() as { state?: { discount?: number; delivery?: number } };
  const { items, subtotal, placeOrder, defaultCity, setDefaultCity } = useLozaCart();
  const discount = loc.state?.discount || 0;
  const delivery = loc.state?.delivery ?? (subtotal >= 200 ? 0 : 25);
  const total = Math.max(0, subtotal - discount + delivery);

  const [type, setType] = useState<'self' | 'gift'>('self');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(defaultCity);
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState(TIMES[2]);
  const [giftMsg, setGiftMsg] = useState('');
  const [payment, setPayment] = useState<'card' | 'apple-pay' | 'cod' | 'stc-pay'>('card');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && phone.trim().length >= 9 && address.trim() && items.length > 0;

  const submit = async () => {
    if (!canSubmit) {
      toast({ title: 'املأ البيانات المطلوبة', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    setDefaultCity(city);
    await new Promise((r) => setTimeout(r, 800));
    const order = placeOrder({
      delivery,
      recipientName: name,
      recipientPhone: phone,
      address,
      city,
      deliveryDate: date,
      deliveryTime: time,
      deliveryType: type,
      giftMessage: type === 'gift' ? giftMsg : undefined,
      paymentMethod: payment,
    });
    setSubmitting(false);
    navigate(`/loza/orders/${order.id}?placed=1`);
  };

  if (items.length === 0) {
    return (
      <LozaShell>
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-xl font-bold mb-3">السلة فاضية</h1>
          <Button onClick={() => navigate('/loza')} className="rounded-full">العودة للرئيسية</Button>
        </div>
      </LozaShell>
    );
  }

  return (
    <LozaShell>
      <header className="bg-background sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold font-loza-display">إتمام الطلب</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4 pb-40 space-y-4">
        {/* Delivery type */}
        <Section title="نوع الطلب">
          <div className="grid grid-cols-2 gap-2">
            <TypeBtn active={type === 'self'} onClick={() => setType('self')} icon={Truck} label="استلام شخصي / لي" />
            <TypeBtn active={type === 'gift'} onClick={() => setType('gift')} icon={Gift} label="هدية لشخص آخر" />
          </div>
        </Section>

        {/* Recipient */}
        <Section title={type === 'gift' ? 'بيانات المستلم' : 'بياناتك'}>
          <Field icon={User} value={name} onChange={setName} placeholder={type === 'gift' ? 'اسم المستلم' : 'اسمك الكامل'} />
          <Field icon={Phone} value={phone} onChange={setPhone} placeholder="رقم الجوال" type="tel" />
          {type === 'gift' && (
            <textarea
              value={giftMsg}
              onChange={(e) => setGiftMsg(e.target.value)}
              placeholder="رسالة الهدية (اختياري) — مثال: كل عام وأنت بخير 🎉"
              className="w-full rounded-2xl border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={2}
            />
          )}
        </Section>

        {/* Address */}
        <Section title="عنوان التوصيل">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all',
                  c === city ? 'gradient-loza-gold text-[hsl(var(--loza-brown))] border-transparent' : 'bg-card border-border'
                )}
              >
                📍 {c}
              </button>
            ))}
          </div>
          <Field icon={MapPin} value={address} onChange={setAddress} placeholder="الحي، الشارع، رقم المبنى" />
        </Section>

        {/* Schedule */}
        <Section title="موعد التسليم">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="relative">
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* Payment */}
        <Section title="طريقة الدفع">
          <div className="space-y-2">
            <PayBtn icon={CreditCard} label="بطاقة بنكية / مدى" value="card" current={payment} onSelect={setPayment} />
            <PayBtn icon={Smartphone} label="Apple Pay" value="apple-pay" current={payment} onSelect={setPayment} />
            <PayBtn icon={Smartphone} label="STC Pay" value="stc-pay" current={payment} onSelect={setPayment} />
            <PayBtn icon={Truck} label="الدفع عند الاستلام" value="cod" current={payment} onSelect={setPayment} />
          </div>
        </Section>

        {/* Summary */}
        <Section title="ملخص الطلب">
          <Row label="المجموع الفرعي" value={`${subtotal} ر.س`} />
          {discount > 0 && <Row label="الخصم" value={`- ${discount} ر.س`} accent />}
          <Row label="التوصيل" value={delivery === 0 ? 'مجاني 🎉' : `${delivery} ر.س`} />
          <div className="border-t border-border/60 pt-2 mt-1 flex justify-between font-extrabold">
            <span>الإجمالي</span>
            <span className="text-gradient-loza text-lg">{total} ر.س</span>
          </div>
        </Section>
      </main>

      <div className="fixed bottom-16 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-loza-lift">
        <div className="container mx-auto max-w-2xl px-4 py-3">
          <Button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="w-full rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] border-0 font-bold py-6 text-base disabled:opacity-50"
          >
            {submitting ? 'جاري إرسال الطلب...' : `تأكيد الطلب • ${total} ر.س`}
          </Button>
        </div>
      </div>
    </LozaShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-3xl shadow-loza p-4 border border-border/40 space-y-3">
      <h3 className="text-sm font-bold font-loza-display">{title}</h3>
      {children}
    </section>
  );
}

function Field({ icon: Icon, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="relative">
      <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function TypeBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2',
        active ? 'gradient-loza-gold text-[hsl(var(--loza-brown))] border-transparent shadow-loza' : 'bg-card border-border hover:border-primary/40'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function PayBtn({ icon: Icon, label, value, current, onSelect }: any) {
  const active = value === current;
  return (
    <button
      onClick={() => onSelect(value)}
      className={cn(
        'w-full rounded-2xl p-3 border-2 flex items-center gap-3 transition-all',
        active ? 'border-primary bg-primary/5' : 'bg-card border-border'
      )}
    >
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-sm font-bold flex-1 text-right">{label}</span>
      <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', active ? 'border-primary bg-primary' : 'border-border')}>
        {active && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'text-success font-bold' : 'font-medium'}>{value}</span>
    </div>
  );
}
