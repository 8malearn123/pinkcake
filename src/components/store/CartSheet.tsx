import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePublicStoreBranches } from '@/hooks/usePublicStore';
import { useCreateCustomerOrder } from '@/hooks/useCustomerStore';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, Cake, Loader2, Calendar, Clock, MapPin } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Global cart sheet + checkout dialog. Rendered once in the storefront layout so
 * the cart opens in place on any page (store / catalog / product / wishlist) via
 * the shared `useStoreCart().open()` — no navigation needed.
 */
export function CartSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    setCart,
    count: cartCount,
    total: cartTotal,
    isOpen,
    setOpen,
    close,
  } = useStoreCart();

  const { data: branches } = usePublicStoreBranches();
  const createOrder = useCreateCustomerOrder();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const pendingOrder = location.state?.pendingOrder;
  const openCartOnArrival = location.state?.openCart;

  // Restore a pending order after the customer logs in, then open checkout.
  useEffect(() => {
    if (pendingOrder && user) {
      setCart(pendingOrder.cart || []);
      setSelectedBranch(pendingOrder.branchId || '');
      setDeliveryDate(pendingOrder.deliveryDate || '');
      setDeliveryTime(pendingOrder.deliveryTime || '');
      if (pendingOrder.cart?.length > 0) setCheckoutOpen(true);
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

  const handleCheckout = async () => {
    if (!user) {
      const pendingOrderData = { cart, branchId: selectedBranch, deliveryDate, deliveryTime };
      setCheckoutOpen(false);
      navigate('/login', {
        state: { from: { pathname: '/store' }, pendingOrder: pendingOrderData },
      });
      toast({ title: 'مطلوب تسجيل الدخول', description: 'يرجى تسجيل الدخول أو إنشاء حساب لإتمام الطلب' });
      return;
    }
    if (!selectedBranch || !deliveryDate || !deliveryTime) {
      toast({ title: 'بيانات ناقصة', description: 'يرجى تعبئة جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    const items = cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
    }));
    try {
      const orderId = await createOrder.mutateAsync({
        branchId: selectedBranch,
        deliveryDate,
        deliveryTime,
        items,
      });
      setCart([]);
      setCheckoutOpen(false);
      close();
      navigate(`/my-orders/${orderId}`);
    } catch {
      /* handled */
    }
  };

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'EEEE, d MMMM', { locale: ar }) };
  });

  const timeSlots = [
    { value: '09:00', label: '09:00 صباحاً' },
    { value: '10:00', label: '10:00 صباحاً' },
    { value: '11:00', label: '11:00 صباحاً' },
    { value: '12:00', label: '12:00 ظهراً' },
    { value: '13:00', label: '01:00 ظهراً' },
    { value: '14:00', label: '02:00 ظهراً' },
    { value: '15:00', label: '03:00 عصراً' },
    { value: '16:00', label: '04:00 عصراً' },
    { value: '17:00', label: '05:00 عصراً' },
    { value: '18:00', label: '06:00 مساءً' },
    { value: '19:00', label: '07:00 مساءً' },
    { value: '20:00', label: '08:00 مساءً' },
  ];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-display text-2xl">
              <ShoppingCart className="w-5 h-5 text-primary" />
              سلة المشتريات
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
                <p className="text-muted-foreground">ابدأي بإضافة منتجاتك المفضلة</p>
              </div>
            ) : (
              cart.map((item) => (
                <Card key={item.product.id} className="p-3 border-border/60">
                  <div className="flex gap-3">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                        <Cake className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
                      <p className="text-primary font-display text-base mt-0.5">
                        {item.product.price} <span className="text-xs text-muted-foreground">ر.س</span>
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
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">المجموع</span>
                  <span className="font-display text-3xl text-primary">
                    {cartTotal.toFixed(2)} <span className="text-sm text-muted-foreground">ر.س</span>
                  </span>
                </div>
                <Button
                  className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => {
                    setOpen(false);
                    setCheckoutOpen(true);
                  }}
                >
                  إتمام الطلب
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Checkout Dialog ── */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">إتمام الطلب</DialogTitle>
            <DialogDescription>أدخلي تفاصيل الاستلام لإكمال طلبك</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-secondary/60 rounded-2xl p-4 space-y-2">
              <div className="text-sm font-semibold mb-2">ملخص الطلب</div>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product.name} × {item.quantity}</span>
                  <span className="font-medium">{(item.product.price * item.quantity).toFixed(2)} ر.س</span>
                </div>
              ))}
              <div className="border-t border-border/60 pt-2 mt-2 flex justify-between items-baseline">
                <span className="font-semibold">المجموع</span>
                <span className="font-display text-2xl text-primary">
                  {cartTotal.toFixed(2)} <span className="text-xs text-muted-foreground">ر.س</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                الفرع
              </Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger><SelectValue placeholder="اختاري الفرع" /></SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} {branch.address && `- ${branch.address}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  التاريخ
                </Label>
                <Select value={deliveryDate} onValueChange={setDeliveryDate}>
                  <SelectTrigger><SelectValue placeholder="اختاري" /></SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => (
                      <SelectItem key={date.value} value={date.value}>{date.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  الوقت
                </Label>
                <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                  <SelectTrigger><SelectValue placeholder="اختاري" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="rounded-full">
              إلغاء
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={createOrder.isPending}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {createOrder.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {user ? 'تأكيد الطلب' : 'تسجيل الدخول للمتابعة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
