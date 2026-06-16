import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePublicStoreProducts, usePublicStoreBranches } from '@/hooks/usePublicStore';
import { useCreateCustomerOrder, StoreProduct } from '@/hooks/useCustomerStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Reveal } from '@/components/Reveal';
import { ProductReviewDialog } from '@/components/store/ProductReviewDialog';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { HeroCarousel } from '@/components/store/HeroCarousel';
import { PromoStrip } from '@/components/store/PromoStrip';
import { CategoryChips } from '@/components/store/CategoryChips';
import { ProductCardRefined } from '@/components/store/ProductCardRefined';
import { DesignYourCake } from '@/components/store/DesignYourCake';
import { type CakeConfig } from '@/lib/cakeBuilder';
import { ShopByOccasion } from '@/components/store/ShopByOccasion';
import { HowItWorks } from '@/components/store/HowItWorks';
import { Testimonials } from '@/components/store/Testimonials';
import { StoreFooter } from '@/components/store/StoreFooter';
import { BackToTop } from '@/components/store/BackToTop';
import {
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  Trash2,
  Cake,
  User,
  Package,
  LogOut,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  LogIn,
  Search,
  Sparkles,
  ArrowLeft,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Store() {
  const { user, signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: products, isLoading: productsLoading } = usePublicStoreProducts();
  const { data: branches } = usePublicStoreBranches();
  const createOrder = useCreateCustomerOrder();

  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    setCart,
    count: cartCount,
    total: cartTotal,
  } = useStoreCart();
  const wishlist = useStoreWishlist();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<StoreProduct | null>(null);

  const [selectedBranch, setSelectedBranch] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const productsRef = useRef<HTMLDivElement>(null);
  const pendingOrder = location.state?.pendingOrder;
  const openCartOnArrival = location.state?.openCart;

  const productIds = useMemo(() => products?.map((p) => p.id) || [], [products]);
  const { data: ratingsMap } = useProductRatings(productIds);

  const categories = useMemo(() => {
    if (!products) return [];
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return cats as string[];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

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

  // Arriving from the product details page via "view cart" opens the cart sheet.
  useEffect(() => {
    if (openCartOnArrival) {
      setCartOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [openCartOnArrival]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToDesign = () => {
    const el = document.getElementById('design');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  };

  // Quick-add the on-page design as a custom cake line.
  const handleDesignAdd = (total: number, summary: string) => {
    addToCart({
      id: `custom-${Date.now()}`,
      name: 'كيكة مخصّصة حسب التصميم',
      description: summary,
      price: total,
      category: 'تصميم خاص',
      image_url: null,
    });
  };

  // "خصّصيها أكثر" — carry the current design into the full studio.
  const handleCustomizeMore = (cfg: CakeConfig) => navigate('/customize', { state: { initial: cfg } });

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
      setCartOpen(false);
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
    <div className="min-h-screen bg-background">
      <AnnouncementBar />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
          {/* Brand */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0 press group">
            <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center shadow-rose-glow transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
              <Cake className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <div className="font-display text-lg">{settings.storeName}</div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Patisserie</div>
            </div>
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto relative hidden md:block">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحثي عن كيكة أو نكهة..."
              className="ps-10 h-10 rounded-full bg-secondary/60 border-transparent focus-visible:bg-card"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ms-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customize')}
              className="hidden sm:inline-flex gap-1.5 text-primary hover:text-primary hover:bg-primary/10 rounded-full press"
            >
              <Sparkles className="w-4 h-4" />
              صمّمي كيكتك
            </Button>

            {user ? (
              <>
                <Button variant="ghost" size="icon" onClick={() => navigate('/my-profile')} aria-label="حسابي" className="press">
                  <User className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/my-orders')} aria-label="طلباتي" className="press">
                  <Package className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="خروج" className="hidden sm:inline-flex press">
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="gap-2 rounded-full press">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">دخول</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              aria-label="المفضلة"
              onClick={() => navigate('/wishlist')}
              className="relative rounded-full border-border h-10 w-10 press hover:border-primary/50 hover:bg-primary/5"
            >
              <Heart className="w-5 h-5" />
              {wishlist.count > 0 && (
                <span
                  key={wishlist.count}
                  className="badge-pop absolute -top-1 -start-1 min-w-[20px] h-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow"
                >
                  {wishlist.count}
                </span>
              )}
            </Button>

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="عربة التسوق" className="relative rounded-full border-border h-10 w-10 press hover:border-primary/50 hover:bg-primary/5">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span
                      key={cartCount}
                      className="badge-pop absolute -top-1 -start-1 min-w-[20px] h-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow"
                    >
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
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
                          setCartOpen(false);
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
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحثي عن كيكة..."
              className="ps-10 h-10 rounded-full bg-secondary/60 border-transparent"
            />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-10 space-y-8 lg:space-y-12">
        <Reveal>
          <HeroCarousel onShopClick={scrollToProducts} onCustomizeClick={() => navigate('/customize')} />
        </Reveal>

        <Reveal>
          <PromoStrip />
        </Reveal>

        {/* Category & products */}
        <section ref={productsRef} className="space-y-5 scroll-mt-24">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs text-primary tracking-widest uppercase font-medium">مجموعتنا</div>
                <h2 className="font-display text-4xl md:text-5xl mt-1 leading-none">كيكات مختارة بعناية</h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                تشكيلة محدثة من أكثر من {products?.length || 0} منتج فاخر، اختاري ما يناسب لحظتك.
              </p>
            </div>
          </Reveal>

          <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-3xl overflow-hidden border border-border/60 bg-card">
                  <Skeleton className="aspect-[4/5]" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-dashed border-border/60 bg-secondary/30">
              <div className="w-16 h-16 mx-auto rounded-full bg-card flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl">لا توجد نتائج</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery ? `لم نجد منتجات تطابق "${searchQuery}"` : 'لم تتم إضافة منتجات بعد'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {filteredProducts.map((product) => (
                <ProductCardRefined
                  key={product.id}
                  product={product}
                  rating={ratingsMap?.[product.id]}
                  onAddToCart={() => addToCart(product)}
                  isFav={wishlist.has(product.id)}
                  onToggleFav={() => wishlist.toggle(product)}
                  onViewDetails={() => navigate(`/product/${product.id}`)}
                  onOpenReviews={() => {
                    setSelectedProductForReview(product);
                    setReviewDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Design your cake */}
        <Reveal>
          <DesignYourCake onAddCustom={handleDesignAdd} onCustomizeMore={handleCustomizeMore} />
        </Reveal>

        {/* Shop by occasion */}
        <Reveal>
          <ShopByOccasion onShop={scrollToProducts} />
        </Reveal>

        {/* How it works */}
        <Reveal>
          <HowItWorks />
        </Reveal>

        {/* Testimonials */}
        <Reveal>
          <Testimonials />
        </Reveal>

        {/* Final CTA */}
        <Reveal>
          <section className="rounded-[2rem] gradient-cocoa text-white p-8 md:p-14 text-center shadow-soft-lift relative overflow-hidden">
            <div className="absolute inset-0 noise-overlay opacity-30" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                تجربة استثنائية
              </div>
              <h3 className="font-display text-3xl md:text-5xl mt-4 leading-tight">لحظات الفرح تبدأ بقطعة كيك</h3>
              <p className="mt-3 text-white/75 leading-relaxed max-w-lg mx-auto">
                من أعياد الميلاد إلى المناسبات الخاصة، نحضّر لكِ كل طلب بحبٍّ وعناية.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <button onClick={scrollToProducts} className="group press sheen rounded-full ps-8 pe-6 h-[52px] bg-white text-foreground hover:bg-white/90 font-semibold transition-colors flex items-center gap-2">
                  تسوّقي الآن <ArrowLeft className="cta-arrow w-4 h-4" />
                </button>
                <button onClick={scrollToDesign} className="press rounded-full px-8 h-[52px] bg-white/10 border border-white/30 text-white hover:bg-white/20 font-medium transition-colors">
                  صمّمي كيكتكِ
                </button>
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-white/70 text-xs">
                <span className="inline-flex items-center gap-1.5"><Truck className="w-4 h-4 text-primary" /> توصيل مجاني فوق ٢٠٠ ر.س</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> تحضير خلال ٢٤ ساعة</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> دفع آمن ١٠٠٪</span>
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      <StoreFooter storeName={settings.storeName} onNavigate={navigate} onShop={scrollToProducts} />

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

      {selectedProductForReview && (
        <ProductReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          productId={selectedProductForReview.id}
          productName={selectedProductForReview.name}
        />
      )}

      <FloatingContactButton />
      <BackToTop />
    </div>
  );
}
