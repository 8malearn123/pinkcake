import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Cake, ChevronLeft, Heart, ShoppingBag, User } from 'lucide-react';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useProductReviews } from '@/hooks/useProductReviews';
import { useComplementSuggestions } from '@/hooks/useComplementSuggestions';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Marquee } from '@/components/store/StorefrontDecor';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { ProductReviewDialog } from '@/components/store/ProductReviewDialog';
import { ProductGallery } from '@/components/store/pdp/ProductGallery';
import { ProductBuyPanel } from '@/components/store/pdp/ProductBuyPanel';
import { ProductInfoTabs } from '@/components/store/pdp/ProductInfoTabs';
import { ProductReviewsPanel } from '@/components/store/pdp/ProductReviewsPanel';
import { PairsWithRail } from '@/components/store/pdp/PairsWithRail';
import { StickyBuyBar } from '@/components/store/pdp/StickyBuyBar';
import { Reveal } from '@/components/Reveal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { discountPercent, pickRelated, rowGridClass, savingsAmount } from '@/lib/productDetails';
import type { StoreProduct } from '@/hooks/useCustomerStore';

/** The three promises behind every box — the storefront's craft story, product-side. */
const CRAFT = [
  { n: '٠١', title: 'مكوّنات تصل كل صباح', body: 'زبدة وبيض وحليب طازج من موردين نعرفهم بالاسم — لا خلطات جاهزة ولا مواد حافظة.' },
  { n: '٠٢', title: 'تُخبز بعد طلبك', body: 'ما نخبز للرفّ. طلبك يبدأ من العجين في اليوم نفسه، فتصلك وهي في ذروتها.' },
  { n: '٠٣', title: 'تصلك مبرّدة ومغلّفة', body: 'علبة فاخرة وبطاقة تهنئة، ونقل مبرّد داخل جازان يحفظ الكريمة كما خرجت من المطبخ.' },
];

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();

  const { data: products, isLoading } = usePublicStoreProducts();
  const { addToCart, updateQuantity, cart, total: cartTotal, count: cartCount, open: openCart } = useStoreCart();
  const wishlist = useStoreWishlist();
  const qtyOf = useCallback(
    (pid: string) => cart.find((i) => i.product.id === pid)?.quantity ?? 0,
    [cart],
  );

  const product = useMemo(() => products?.find((p) => p.id === id), [products, id]);
  const ratingIds = useMemo(() => (product ? [product.id] : []), [product]);
  const { data: ratingsMap } = useProductRatings(ratingIds);
  const rating = product ? ratingsMap?.[product.id] : undefined;
  const { data: reviews, isLoading: reviewsLoading } = useProductReviews(product?.id);

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [ctaOffscreen, setCtaOffscreen] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  // A new product means a fresh decision: reset the quantity and the confirmation.
  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [id]);

  // The desktop buy bar only takes over once the real CTA has left the viewport.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setCtaOffscreen(!entry.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id]);

  const galleryImages = useMemo(() => {
    if (product?.images && product.images.length > 0) return product.images;
    return product?.image_url ? [product.image_url] : [];
  }, [product]);

  const related = useMemo(
    () => pickRelated(products, id, product?.category, isSoldOut, 4),
    [products, id, product?.category],
  );

  // Add-on suggestions. Only the product itself is excluded up front — on a small
  // catalogue, also excluding everything "you may also like" took would empty the
  // rail entirely. Instead the ones already shown below sink to the back, so the
  // rail prefers fresh picks but never disappears.
  const complementContext = useMemo(() => (product ? [product] : []), [product]);
  const complementExclude = useMemo(() => new Set([id ?? '']), [id]);
  const complementPool = useComplementSuggestions({
    context: complementContext,
    excludeIds: complementExclude,
    ratingsMap,
    limit: 8,
  });
  const complements = useMemo(() => {
    const alreadyShown = new Set(related.map((p) => p.id));
    return [...complementPool]
      .sort((a, b) => Number(alreadyShown.has(a.id)) - Number(alreadyShown.has(b.id)))
      .slice(0, 3);
  }, [complementPool, related]);

  // Document head — a shared product link should preview as the cake, not "Pink Cake".
  useEffect(() => {
    if (!product) return;
    const previousTitle = document.title;
    document.title = `${product.name} · ${settings.storeName}`;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute('content') ?? null;
    if (meta && product.description) meta.setAttribute('content', product.description);
    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== null) meta.setAttribute('content', previousDescription);
    };
  }, [product, settings.storeName]);

  const soldOut = product ? isSoldOut(product) : false;

  const confirmAdd = () => {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const handleAdd = () => {
    if (!product || soldOut) return;
    addToCart(product, qty);
    confirmAdd();
  };

  const handleBuyNow = () => {
    if (!product || soldOut) return;
    addToCart(product, qty);
    openCart();
  };

  const openProduct = (next: StoreProduct) => {
    navigate(`/product/${next.id}`);
    window.scrollTo({ top: 0 });
  };

  const footerJump = (section: string) => {
    if (section === 'shop' || section === 'seasonal') navigate('/shop');
    else if (section === 'faq') navigate('/faq');
    else navigate('/store');
  };

  // ── Shared shell ──────────────────────────────────────────────────────────
  const header = (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-5 sm:px-8 md:h-[76px] lg:px-12">
        <button
          onClick={() => navigate(-1)}
          aria-label="رجوع"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/15 text-primary transition-colors hover:bg-blush"
        >
          <ArrowRight size={18} />
        </button>

        <button onClick={() => navigate('/store')} className="shrink-0 text-start leading-none">
          <span className="block text-xl font-semibold tracking-[-.06em] text-primary sm:text-2xl">
            {settings.storeName}
          </span>
          <span className="mt-1 block text-[9px] font-bold tracking-[.14em] text-muted-foreground">حلويات جازان الفاخرة</span>
        </button>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <button
            onClick={() => navigate('/wishlist')}
            aria-label="المفضلة"
            className="relative grid size-10 place-items-center rounded-full border border-primary/15 text-primary transition-colors hover:bg-blush"
          >
            <Heart size={18} />
            {wishlist.count > 0 && (
              <span className="badge-pop absolute -top-1 -start-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-primary">
                {toArabicDigits(wishlist.count)}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate(user ? '/my-profile' : '/login')}
            aria-label={user ? 'حسابي' : 'تسجيل الدخول أو إنشاء حساب'}
            className="hidden size-10 place-items-center rounded-full border border-primary/15 text-primary transition-colors hover:bg-blush sm:grid"
          >
            <User size={18} />
          </button>
          <button
            onClick={openCart}
            aria-label={`السلة تحتوي ${toArabicDigits(cartCount)} منتجات`}
            className="relative grid size-10 place-items-center rounded-full bg-primary text-white transition-colors hover:bg-rose"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="badge-pop absolute -top-1 -start-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-primary"
              >
                {toArabicDigits(cartCount)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="store-surface min-h-screen bg-background text-foreground">
        {header}
        <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Skeleton className="aspect-[4/5] rounded-[28px]" />
            <div className="space-y-5 pt-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-12 w-4/5" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-14 w-1/2" />
              <Skeleton className="h-[58px] w-full rounded-2xl" />
              <Skeleton className="h-[54px] w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="store-surface min-h-screen bg-background text-foreground">
        {header}
        <main className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-primary/25 bg-background px-6 py-14 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-blush">
              <Cake size={28} className="text-rose" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-[-.02em]">ما لقينا هذي الكيكة</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              يمكن انسحبت من التشكيلة أو الرابط ناقص — تشكيلتنا الكاملة بانتظارك.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-t from-pink-dark to-primary px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.8)] transition-transform active:scale-95"
            >
              تصفّح كل المنتجات <ChevronLeft size={16} />
            </button>
          </div>
        </main>
        <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} onJump={footerJump} />
      </div>
    );
  }

  const discount = discountPercent(product.price, product.compare_at_price);
  const savings = savingsAmount(product.price, product.compare_at_price);
  const stock = product.stock ?? null;
  const lowStock = stock != null && stock > 0 && stock <= 8 ? stock : null;

  return (
    <div className="store-surface min-h-screen bg-background pb-24 text-foreground lg:pb-0">
      <Marquee />
      {header}

      <main className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        {/* Breadcrumb */}
        <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 py-5 text-[11px] font-bold text-muted-foreground">
          <button onClick={() => navigate('/store')} className="transition-colors hover:text-primary">الرئيسية</button>
          <ChevronLeft size={13} className="text-gold" />
          {product.category && (
            <>
              <button
                onClick={() => navigate(`/shop?category=${encodeURIComponent(product.category as string)}`)}
                className="transition-colors hover:text-primary"
              >
                {product.category}
              </button>
              <ChevronLeft size={13} className="text-gold" />
            </>
          )}
          <span className="line-clamp-1 text-foreground">{product.name}</span>
        </nav>

        {/* Hero */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-8 h-[380px] bg-[radial-gradient(65%_60%_at_75%_0%,rgba(249,241,242,0.85),transparent)]"
          />
          <div className="relative grid gap-9 pb-14 lg:grid-cols-2 lg:gap-14 lg:pb-20">
            {/* min-w-0 on both columns: a grid item defaults to min-width:auto, so the
                nowrap (truncating) product names in the add-on rail would otherwise
                widen the track past a phone viewport. */}
            <Reveal className="min-w-0">
              <ProductGallery
                images={galleryImages}
                name={product.name}
                discount={discount}
                season={product.season}
                soldOut={soldOut}
                lowStock={lowStock}
                isFavorite={wishlist.has(product.id)}
                onToggleFavorite={() => wishlist.toggle(product)}
              />
            </Reveal>

            <Reveal className="min-w-0 space-y-6">
              <ProductBuyPanel
                ref={ctaRef}
                product={product}
                rating={rating}
                discount={discount}
                savings={savings}
                soldOut={soldOut}
                qty={qty}
                added={added}
                cartTotal={cartTotal}
                onQtyChange={setQty}
                onAdd={handleAdd}
                onBuyNow={handleBuyNow}
                onSeeReviews={() =>
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                onOccasion={(occasion) => navigate(`/shop?occasion=${encodeURIComponent(occasion)}`)}
                onCustomize={() => navigate('/customize')}
              />

              <PairsWithRail
                items={complements}
                inCart={qtyOf}
                onAdd={(item) => addToCart(item)}
                onView={openProduct}
              />
            </Reveal>
          </div>
        </div>
      </main>

      {/* Craft band — why this cake is worth its price */}
      <section className="relative overflow-hidden border-y border-gold/30 bg-gradient-to-b from-ink-deep via-primary to-ink-deep px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(219,178,185,0.22),transparent)]"
        />
        <div className="relative mx-auto max-w-[1500px]">
          <Reveal className="flex flex-col items-center text-center">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-gold">
              <span className="h-px w-8 bg-gold/50" /> من مطبخنا إليك <span className="h-px w-8 bg-gold/50" />
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.01em] text-white sm:text-4xl">
              ليش تختلف عن أي كيكة ثانية
            </h2>
          </Reveal>
          <Reveal className="reveal-grid mt-11 grid gap-5 md:grid-cols-3">
            {CRAFT.map((item) => (
              <article
                key={item.n}
                className="rounded-2xl bg-white/[0.07] p-7 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/[0.12]"
              >
                <span className="text-2xl font-semibold text-gold">{item.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/70">{item.body}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] space-y-16 px-5 py-14 sm:px-8 lg:space-y-24 lg:px-12 lg:py-20">
        <Reveal>
          <ProductInfoTabs product={product} />
        </Reveal>

        <Reveal>
          <ProductReviewsPanel
            reviews={reviews}
            isLoading={reviewsLoading}
            average={rating?.average_rating ?? 0}
            count={rating?.review_count ?? 0}
            onWrite={() => setReviewsOpen(true)}
          />
        </Reveal>

        {related.length > 0 && (
          <section>
            <div className="flex flex-col justify-between gap-4 border-b border-primary/15 pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold tracking-[.08em] text-rose">من نفس التشكيلة</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.01em] text-foreground sm:text-4xl">قد يعجبك أيضاً</h2>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="group/more flex shrink-0 items-center gap-2 self-start rounded-full border border-primary/25 px-5 py-2.5 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-blush sm:self-auto"
              >
                عرض كل المنتجات
                <ChevronLeft size={15} className="transition-transform duration-300 group-hover/more:-translate-x-1" />
              </button>
            </div>

            <Reveal
              className={`reveal-grid mt-8 grid gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 ${rowGridClass(related.length)}`}
            >
              {related.map((p) => (
                <StoreProductCard
                  key={p.id}
                  product={p}
                  rating={ratingsMap?.[p.id]}
                  inCart={qtyOf(p.id)}
                  isFavorite={wishlist.has(p.id)}
                  onAdd={() => addToCart(p)}
                  onRemoveOne={() => updateQuantity(p.id, -1)}
                  onToggleFavorite={() => wishlist.toggle(p)}
                  onView={() => openProduct(p)}
                />
              ))}
            </Reveal>
          </section>
        )}
      </div>

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} onJump={footerJump} />

      <StickyBuyBar
        product={product}
        rating={rating}
        qty={qty}
        soldOut={soldOut}
        added={added}
        showDesktop={ctaOffscreen}
        onQtyChange={setQty}
        onAdd={handleAdd}
      />

      <ProductReviewDialog
        open={reviewsOpen}
        onOpenChange={setReviewsOpen}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
