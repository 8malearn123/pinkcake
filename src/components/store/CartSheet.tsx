import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePublicStoreBranches } from '@/hooks/usePublicStore';
import { useCreateCustomerOrder, useCustomerProfile } from '@/hooks/useCustomerStore';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart, Plus, Minus, Trash2, Cake, Loader2, Calendar, Clock, MapPin,
  Truck, Store, User, Phone, Gift, Check, Send, ChevronLeft, Sparkles,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

const FREE_DELIVERY_THRESHOLD = 200;
const DELIVERY_FEE = 25;

type Mode = 'delivery' | 'pickup';

/**
 * Global cart sheet + a complete checkout (fulfilment mode, recipient, address
 * or branch, schedule, gift + card message, fee-aware summary, confirmation).
 * Rendered once in the storefront layout so the cart opens in place on any page.
 */
export function CartSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    cart, updateQuantity, removeFromCart, setCart,
    count: cartCount, total: cartTotal, isOpen, setOpen, close,
  } = useStoreCart();

  const { data: branches } = usePublicStoreBranches();
  const { data: profile } = useCustomerProfile();
  const createOrder = useCreateCustomerOrder();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [cardMessage, setCardMessage] = useState('');
  const [giftToOther, setGiftToOther] = useState(false);
  const [giftName, setGiftName] = useState('');
  const [giftPhone, setGiftPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [placed, setPlaced] = useState<{ orderId: string; orderNumber: string } | null>(null);

  const pendingOrder = location.state?.pendingOrder;
  const openCartOnArrival = location.state?.openCart;

  // Prefill recipient from the saved profile.
  useEffect(() => {
    if (!profile || !checkoutOpen) return;
    setName((v) => v || profile.name || '');
    setPhone((v) => v || profile.phone || '');
    setAddress((v) => v || profile.address || '');
  }, [profile, checkoutOpen]);

  // Restore a pending order after the customer logs in, then reopen checkout.
  useEffect(() => {
    if (pendingOrder && user) {
      setCart(pendingOrder.cart || []);
      setMode(pendingOrder.mode || 'delivery');
      setName(pendingOrder.name || '');
      setPhone(pendingOrder.phone || '');
      setAddress(pendingOrder.address || '');
      setBranchId(pendingOrder.branchId || '');
      setDate(pendingOrder.date || '');
      setTime(pendingOrder.time || '');
      if ((pendingOrder.cart?.length ?? 0) > 0) setCheckoutOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [pendingOrder, user, setCart]);

  // Arriving with { openCart: true } (e.g. from the customizer) opens the sheet.
  useEffect(() => {
    if (openCartOnArrival) {
      setOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [openCartOnArrival, setOpen]);

  const deliveryFee = mode === 'pickup' || cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = cartTotal + deliveryFee;
  const toFree = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  const startCheckout = () => { setOpen(false); setPlaced(null); setCheckoutOpen(true); };

  const handleCheckout = async () => {
    if (!user) {
      const data = { cart, mode, name, phone, address, branchId, date, time };
      setCheckoutOpen(false);
      navigate('/login', { state: { from: { pathname: '/store' }, pendingOrder: data } });
      toast({ title: 'مطلوب تسجيل الدخول', description: 'سجّل الدخول أو أنشئ حساباً لإتمام الطلب.' });
      return;
    }
    const miss = (m: string) => toast({ title: 'بيانات ناقصة', description: m, variant: 'destructive' });
    if (!name.trim() || !phone.trim()) return miss('أدخل اسم المستلم ورقم الجوال.');
    if (mode === 'delivery' && !address.trim()) return miss('أدخل عنوان التوصيل.');
    if (mode === 'pickup' && !branchId) return miss('اختر فرع الاستلام.');
    if (!date || !time) return miss('اختر تاريخ ووقت الاستلام.');
    if (isGift && giftToOther && (!giftName.trim() || !giftPhone.trim())) return miss('أدخل اسم وجوال من سيستلم الهدية.');

    const items = cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
    }));
    try {
      const res = await createOrder.mutateAsync({
        fulfillmentMode: mode,
        recipientName: name.trim(),
        recipientPhone: phone.trim(),
        address: mode === 'delivery' ? address.trim() : null,
        branchId: mode === 'pickup' ? branchId : null,
        deliveryDate: date,
        deliveryTime: time,
        isGift,
        cardMessage: isGift ? cardMessage.trim() || null : null,
        giftRecipientName: isGift && giftToOther ? giftName.trim() : null,
        giftRecipientPhone: isGift && giftToOther ? giftPhone.trim() : null,
        notes: notes.trim() || null,
        deliveryFee,
        items,
      });
      setPlaced(res);
      setCart([]);
    } catch {
      /* surfaced via the mutation's onError toast */
    }
  };

  const finishAndClose = () => {
    setCheckoutOpen(false);
    setPlaced(null);
    close();
    setCardMessage(''); setNotes(''); setIsGift(false); setGiftToOther(false); setGiftName(''); setGiftPhone('');
  };

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEEE، d MMMM', { locale: ar }) };
  });
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  ].map((v) => {
    const h = parseInt(v, 10);
    const label = h < 12 ? `${h}:00 صباحاً` : h === 12 ? '12:00 ظهراً' : `${h - 12}:00 ${h < 16 ? 'ظهراً' : h < 18 ? 'عصراً' : 'مساءً'}`;
    return { value: v, label };
  });

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-display text-2xl">
              <ShoppingCart className="w-5 h-5 text-primary" /> سلة المشتريات
            </SheetTitle>
            <SheetDescription>
              {cart.length === 0 ? 'سلتك فارغة حالياً' : `${cartCount} منتج جاهز للطلب`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
                  <ShoppingCart className="w-9 h-9 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-5">ابدأ بإضافة منتجاتك المفضلة</p>
                <Button onClick={() => { setOpen(false); navigate('/shop'); }} className="rounded-full px-6">
                  تصفّح المنتجات
                </Button>
              </div>
            ) : (
              cart.map((item) => (
                <Card key={item.product.id} className="p-3 border-border/60">
                  <div className="flex gap-3">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} loading="lazy" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                        <Cake className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
                      <p className="text-primary font-display text-base mt-0.5">
                        {item.product.price} <RiyalSymbol className="text-xs text-muted-foreground" />
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="icon" variant="outline" aria-label="إنقاص الكمية" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.product.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <Button size="icon" variant="outline" aria-label="زيادة الكمية" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.product.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="إزالة المنتج" className="h-7 w-7 text-destructive ms-auto" onClick={() => removeFromCart(item.product.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                {/* Free-delivery nudge */}
                {toFree > 0 ? (
                  <div className="text-[12px] text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary shrink-0" />
                    أضف <b className="text-foreground">{toFree.toFixed(0)} <RiyalSymbol /></b> للحصول على توصيل مجاني
                  </div>
                ) : (
                  <div className="text-[12px] text-green-700 bg-green-600/10 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" /> حصلت على التوصيل المجاني!
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">المجموع</span>
                  <span className="font-display text-3xl text-primary">
                    {cartTotal.toFixed(2)} <RiyalSymbol className="text-sm text-muted-foreground" />
                  </span>
                </div>
                <Button className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90" onClick={startCheckout}>
                  إتمام الطلب
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-full gap-1.5 border-primary/40 text-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => { setOpen(false); navigate('/shop'); }}
                >
                  <ChevronLeft className="w-4 h-4 cta-arrow" />
                  متابعة التسوّق
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Checkout ── */}
      <Dialog open={checkoutOpen} onOpenChange={(o) => { if (!o && placed) finishAndClose(); else setCheckoutOpen(o); }}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
          {placed ? (
            <div className="text-center px-6 py-10">
              <div className="w-20 h-20 mx-auto rounded-full gradient-pink grid place-items-center text-primary-foreground shadow-rose-glow mb-5">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="font-display text-3xl leading-tight">تم تأكيد طلبك!</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
                {mode === 'delivery' ? 'سنحضّر طلبك ونوصّله في الموعد المحدّد.' : 'سنحضّر طلبك ويكون جاهزاً للاستلام من الفرع.'} سنتواصل معك لتأكيد التفاصيل.
              </p>
              {placed.orderNumber && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5">
                  <span className="text-xs text-muted-foreground">رقم الطلب</span>
                  <span className="font-display text-lg text-primary"><bdi dir="ltr">{placed.orderNumber}</bdi></span>
                </div>
              )}
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => { const id = placed.orderId; finishAndClose(); navigate(`/my-orders/${id}`); }}
                  className="rounded-full h-12 px-7 bg-foreground text-background hover:bg-foreground/90 gap-2"
                >
                  <Send className="w-4 h-4" /> تتبّع الطلب
                </Button>
                <Button variant="outline" onClick={() => { finishAndClose(); navigate('/shop'); }} className="rounded-full h-12 px-7">
                  متابعة التسوّق
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 pt-6 pb-3 border-b border-border/60">
                <h2 className="font-display text-2xl">إتمام الطلب</h2>
                <p className="text-sm text-muted-foreground mt-1">أكمل التفاصيل لتأكيد طلبك.</p>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Fulfilment mode */}
                <Section title="طريقة الاستلام">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Toggle active={mode === 'delivery'} onClick={() => setMode('delivery')} icon={Truck} label="توصيل" sub="إلى عنوانك" />
                    <Toggle active={mode === 'pickup'} onClick={() => setMode('pickup')} icon={Store} label="استلام من الفرع" sub="جاهز للاستلام" />
                  </div>
                </Section>

                {/* Recipient */}
                <Section title="بيانات المستلم">
                  <div className="space-y-3">
                    <Field icon={User} label="الاسم">
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className="h-11 rounded-xl" />
                    </Field>
                    <Field icon={Phone} label="رقم الجوال">
                      <div className="flex items-center rounded-xl border border-input bg-background h-11 focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                        <span className="px-3 text-sm text-muted-foreground border-e border-input shrink-0"><bdi dir="ltr">+966</bdi></span>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="5XXXXXXXX" dir="ltr" className="flex-1 bg-transparent outline-none px-3 text-sm text-start" />
                      </div>
                    </Field>
                  </div>
                </Section>

                {/* Address (delivery) or branch (pickup) */}
                {mode === 'delivery' ? (
                  <Section title="عنوان التوصيل">
                    <Field icon={MapPin} label="العنوان">
                      <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="الحي، الشارع، رقم المبنى، وأي تفاصيل تساعد المندوب" rows={2} className="rounded-xl resize-none" />
                    </Field>
                  </Section>
                ) : (
                  <Section title="فرع الاستلام">
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                      <SelectContent>
                        {branches?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}{b.address ? ` — ${b.address}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Section>
                )}

                {/* Schedule */}
                <Section title={mode === 'delivery' ? 'موعد التوصيل' : 'موعد الاستلام'}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field icon={Calendar} label="التاريخ">
                      <Select value={date} onValueChange={setDate}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر اليوم" /></SelectTrigger>
                        <SelectContent>
                          {availableDates.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field icon={Clock} label="الوقت">
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر الوقت" /></SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </Section>

                {/* Gift */}
                <Section>
                  <button
                    onClick={() => setIsGift((v) => !v)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-2xl border p-3.5 text-start transition-colors',
                      isGift ? 'border-primary bg-primary/[0.05]' : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    <span className={cn('w-10 h-10 rounded-xl grid place-items-center shrink-0', isGift ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary')}>
                      <Gift className="w-5 h-5" />
                    </span>
                    <span className="flex-1">
                      <span className="font-bold text-sm block">هل هذا الطلب هدية؟</span>
                      <span className="text-[11.5px] text-muted-foreground">أضف بطاقة إهداء وأرسله لمن تحب</span>
                    </span>
                    <span className={cn('w-6 h-6 rounded-full border-2 grid place-items-center shrink-0', isGift ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                      {isGift && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {isGift && (
                    <div className="mt-3 space-y-3 rounded-2xl bg-secondary/40 p-3.5">
                      <Field label="رسالة الإهداء (اختياري)">
                        <Textarea value={cardMessage} onChange={(e) => setCardMessage(e.target.value.slice(0, 200))} placeholder="مثال: كل عام وأنت بخير 🎉" rows={2} className="rounded-xl resize-none bg-background" />
                        <div className="text-[10px] text-muted-foreground text-end mt-1">{cardMessage.length}/200</div>
                      </Field>
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <span className={cn('w-5 h-5 rounded-md border-2 grid place-items-center shrink-0', giftToOther ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                          {giftToOther && <Check className="w-3 h-3" />}
                        </span>
                        <input type="checkbox" checked={giftToOther} onChange={(e) => setGiftToOther(e.target.checked)} className="sr-only" />
                        <span className="text-[13px] font-medium">أرسلها مباشرة إلى شخص آخر</span>
                      </label>
                      {giftToOther && (
                        <div className="grid sm:grid-cols-2 gap-3">
                          <Input value={giftName} onChange={(e) => setGiftName(e.target.value)} placeholder="اسم المستلم" className="h-11 rounded-xl bg-background" />
                          <div className="flex items-center rounded-xl border border-input bg-background h-11 overflow-hidden">
                            <span className="px-2.5 text-xs text-muted-foreground border-e border-input shrink-0"><bdi dir="ltr">+966</bdi></span>
                            <input value={giftPhone} onChange={(e) => setGiftPhone(e.target.value)} inputMode="tel" placeholder="جوال المستلم" dir="ltr" className="flex-1 bg-transparent outline-none px-2.5 text-sm text-start" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Section>

                {/* Notes */}
                <Section title="ملاحظات (اختياري)">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي تعليمات إضافية للطلب" rows={2} className="rounded-xl resize-none" />
                </Section>

                {/* Summary */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <div className="text-sm font-bold mb-1">ملخص الطلب</div>
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">{item.product.name} × <bdi dir="ltr">{item.quantity}</bdi></span>
                      <span className="font-medium"><bdi dir="ltr">{(item.product.price * item.quantity).toFixed(2)}</bdi> <RiyalSymbol /></span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[13px] pt-1">
                    <span className="text-muted-foreground">التوصيل</span>
                    <span className="font-medium">{deliveryFee === 0 ? <span className="text-green-700">مجاني</span> : <><bdi dir="ltr">{deliveryFee}</bdi> <RiyalSymbol /></>}</span>
                  </div>
                  <div className="border-t border-border/60 pt-2 mt-1 flex justify-between items-baseline">
                    <span className="font-bold">الإجمالي</span>
                    <span className="font-display text-2xl text-primary"><bdi dir="ltr">{grandTotal.toFixed(2)}</bdi> <RiyalSymbol className="text-xs text-muted-foreground" /></span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/60 px-6 py-4 flex gap-3">
                <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="rounded-full h-12 px-5">إلغاء</Button>
                <Button onClick={handleCheckout} disabled={createOrder.isPending} className="flex-1 rounded-full h-12 bg-foreground text-background hover:bg-foreground/90 gap-2">
                  {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? <Sparkles className="w-4 h-4" /> : null}
                  {user ? <>تأكيد الطلب · <bdi dir="ltr">{grandTotal.toFixed(0)}</bdi> <RiyalSymbol /></> : 'تسجيل الدخول للمتابعة'}
                  {user && <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <div className="text-sm font-bold mb-2.5">{title}</div>}
      {children}
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon?: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />} {label}
      </Label>
      {children}
    </div>
  );
}

function Toggle({ active, onClick, icon: Icon, label, sub }: {
  active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-3.5 text-center transition-all flex flex-col items-center gap-1.5',
        active ? 'border-primary ring-1 ring-primary bg-primary/[0.06]' : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <Icon className={cn('w-6 h-6', active ? 'text-primary' : 'text-muted-foreground')} />
      <span className="font-bold text-[13px] leading-tight">{label}</span>
      <span className="text-[10.5px] text-muted-foreground">{sub}</span>
    </button>
  );
}
