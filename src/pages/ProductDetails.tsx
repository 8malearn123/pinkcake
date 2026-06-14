import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePublicStoreProducts } from '@/hooks/usePublicStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductReviewDialog } from '@/components/store/ProductReviewDialog';
import { ProductCardRefined } from '@/components/store/ProductCardRefined';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { BackToTop } from '@/components/store/BackToTop';
import { Reveal } from '@/components/Reveal';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  ChevronLeft,
  Cake,
  Heart,
  Star,
  Plus,
  Minus,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Clock,
  ShieldCheck,
  Sparkles,
  Check,
  Leaf,
} from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const { data: products, isLoading } = usePublicStoreProducts();
  const { addToCart, count: cartCount } = useStoreCart();

  const product = useMemo(() => products?.find((p) => p.id === id), [products, id]);
  const { data: ratingsMap } = useProductRatings(product ? [product.id] : []);
  const rating = product ? ratingsMap?.[product.id] : undefined;

  const related = useMemo(
    () =>
      (products || [])
        .filter((p) => p.id !== id && p.category === product?.category)
        .slice(0, 4),
    [products, id, product],
  );

  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const goToCart = () => navigate('/store', { state: { openCart: true } });

  const handleAdd = () => {
    if (!product) return;
    addToCart(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, qty);
    goToCart();
  };

  // Shared minimal header — back, brand, cart.
  const header = (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center gap-3">
        <button
          onClick={() => navigate('/store')}
          aria-label="رجوع للمتجر"
          className="press w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 press group">
          <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center shadow-rose-glow transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
            <Cake className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block text-start leading-tight">
            <div className="font-display text-lg">{settings.storeName}</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Patisserie</div>
          </div>
        </button>

        <button
          onClick={goToCart}
          aria-label="عربة التسوق"
          className="press relative ms-auto rounded-full border border-border bg-card h-10 w-10 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span
              key={cartCount}
              className="badge-pop absolute -top-1 -start-1 min-w-[20px] h-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow"
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        <main className="container mx-auto px-4 lg:px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-[4/5] rounded-3xl" />
            <div className="space-y-4 pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-14 w-full rounded-full mt-6" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Not found ──
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        <main className="container mx-auto px-4 lg:px-6 py-20">
          <div className="max-w-md mx-auto text-center rounded-3xl border border-dashed border-border/60 bg-secondary/30 p-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-card flex items-center justify-center mb-4">
              <Cake className="w-7 h-7 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl">لم نجد هذا المنتج</h1>
            <p className="text-muted-foreground text-sm mt-2">
              ربما تمت إزالته أو أن الرابط غير صحيح.
            </p>
            <button
              onClick={() => navigate('/store')}
              className="press mt-6 inline-flex items-center gap-2 rounded-full h-12 px-7 bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
            >
              <ArrowRight className="w-4 h-4" /> العودة إلى المتجر
            </button>
          </div>
        </main>
      </div>
    );
  }

  const lineTotal = product.price * qty;

  const features = [
    { icon: Leaf, label: 'مكوّنات طازجة مختارة' },
    { icon: Sparkles, label: 'تُحضّر يدوياً عند الطلب' },
    { icon: Cake, label: 'تغليف فاخر يليق بالمناسبة' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {header}

      <main className="container mx-auto px-4 lg:px-6 py-5 lg:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="مسار التنقل">
          <button onClick={() => navigate('/store')} className="hover:text-foreground transition-colors">الرئيسية</button>
          <ChevronLeft className="w-3.5 h-3.5" />
          {product.category && (
            <>
              <span className="hover:text-foreground transition-colors">{product.category}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
          {/* Gallery */}
          <Reveal>
            <div className="md:sticky md:top-24">
              <div
                className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-border/60 shadow-soft-lift"
                style={{ background: 'linear-gradient(135deg, hsl(var(--blush)), hsl(var(--secondary)))' }}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cake className="w-24 h-24 text-primary/30" strokeWidth={1.25} />
                  </div>
                )}

                {product.category && (
                  <span className="absolute top-4 start-4 px-3 py-1 rounded-full bg-background/85 backdrop-blur text-[11px] font-medium tracking-wide">
                    {product.category}
                  </span>
                )}

                <button
                  onClick={() => setFav((f) => !f)}
                  aria-label="أضيفي للمفضلة"
                  aria-pressed={fav}
                  className={cn(
                    'press absolute top-4 end-4 w-10 h-10 rounded-full bg-background/85 backdrop-blur flex items-center justify-center transition-colors',
                    fav && 'text-primary',
                  )}
                >
                  <Heart className={cn('w-5 h-5', fav ? 'fill-primary text-primary' : 'text-foreground/70')} />
                </button>
              </div>
            </div>
          </Reveal>

          {/* Info */}
          <Reveal>
            <div className="md:pt-2">
              {/* Rating */}
              <button
                onClick={() => setReviewsOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm press"
              >
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        rating && i < Math.round(rating.average_rating)
                          ? 'fill-warning text-warning'
                          : 'text-muted-foreground/30',
                      )}
                    />
                  ))}
                </span>
                {rating && rating.review_count > 0 ? (
                  <span className="text-muted-foreground">
                    <b className="text-foreground font-semibold">{rating.average_rating}</b> · {rating.review_count} تقييم
                  </span>
                ) : (
                  <span className="text-muted-foreground">كوني أول من يقيّم</span>
                )}
              </button>

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mt-3 leading-tight">{product.name}</h1>

              {product.description && (
                <p className="text-muted-foreground mt-4 leading-relaxed max-w-prose">{product.description}</p>
              )}

              {/* Price */}
              <div className="mt-6 flex items-end gap-3">
                <div className="font-display text-4xl text-primary leading-none">
                  {product.price} <span className="text-base text-muted-foreground font-sans">ر.س</span>
                </div>
                <span className="mb-1 inline-flex items-center gap-1.5 text-xs text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" /> متوفّرة الآن
                </span>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-2.5">
                {features.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <f.icon className="w-4 h-4" />
                    </span>
                    <span className="text-secondary-foreground">{f.label}</span>
                  </li>
                ))}
              </ul>

              {/* Quantity + actions */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-border bg-card h-[52px] px-1.5">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="إنقاص الكمية"
                    disabled={qty <= 1}
                    className="press w-10 h-10 rounded-full flex items-center justify-center text-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="زيادة الكمية"
                    className="press w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className={cn(
                    'group press sheen flex-1 min-w-[200px] rounded-full h-[52px] px-7 bg-foreground text-background font-semibold shadow-rose-glow hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2',
                    added && 'bg-success hover:bg-success',
                  )}
                >
                  {added ? (
                    <><Check className="w-5 h-5" /> تمت الإضافة</>
                  ) : (
                    <><ShoppingBag className="w-5 h-5" /> أضيفي إلى العربة</>
                  )}
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="press mt-3 w-full rounded-full h-[52px] px-7 border border-border bg-card text-foreground font-semibold hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                اشترِ الآن
                {qty > 1 && <span className="text-muted-foreground font-normal">· {lineTotal} ر.س</span>}
              </button>

              {/* Trust */}
              <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border/60 pt-6">
                {[
                  { icon: Truck, label: 'توصيل مجاني فوق ٢٠٠ ر.س' },
                  { icon: Clock, label: 'تحضير خلال ٢٤ ساعة' },
                  { icon: ShieldCheck, label: 'دفع آمن ١٠٠٪' },
                ].map((t) => (
                  <div key={t.label} className="flex flex-col items-center text-center gap-1.5">
                    <t.icon className="w-5 h-5 text-primary" />
                    <span className="text-[11px] text-muted-foreground leading-tight">{t.label}</span>
                  </div>
                ))}
              </div>

              {/* Custom cross-sell */}
              <button
                onClick={() => navigate('/customize')}
                className="press mt-6 w-full rounded-2xl border border-border/60 bg-secondary/40 p-4 flex items-center gap-3 text-start hover:border-primary/40 transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">تريدين تصميماً خاصاً؟</span>
                  <span className="block text-xs text-muted-foreground">صمّمي كيكتكِ من الصفر بالشكل والنكهة التي تحبّينها.</span>
                </span>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </Reveal>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 lg:mt-24">
            <div className="flex items-end justify-between gap-3 mb-5">
              <h2 className="font-display text-2xl md:text-3xl">قد يعجبكِ أيضاً</h2>
              <button onClick={() => navigate('/store')} className="text-sm text-primary press inline-flex items-center gap-1">
                كل المنتجات <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {related.map((p) => (
                <ProductCardRefined
                  key={p.id}
                  product={p}
                  rating={ratingsMap?.[p.id]}
                  onAddToCart={() => addToCart(p)}
                  onViewDetails={() => {
                    navigate(`/product/${p.id}`);
                    window.scrollTo({ top: 0 });
                    setQty(1);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky mobile add bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/60 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-3">
        <div className="shrink-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">الإجمالي</div>
          <div className="font-display text-2xl text-primary leading-none">
            {lineTotal} <span className="text-xs text-muted-foreground font-sans">ر.س</span>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className={cn(
            'press flex-1 rounded-full h-12 bg-foreground text-background font-semibold flex items-center justify-center gap-2 transition-colors',
            added && 'bg-success',
          )}
        >
          {added ? <><Check className="w-5 h-5" /> تمت الإضافة</> : <><ShoppingBag className="w-5 h-5" /> أضيفي إلى العربة</>}
        </button>
      </div>

      <ProductReviewDialog
        open={reviewsOpen}
        onOpenChange={setReviewsOpen}
        productId={product.id}
        productName={product.name}
      />

      <FloatingContactButton />
      <BackToTop />
    </div>
  );
}
