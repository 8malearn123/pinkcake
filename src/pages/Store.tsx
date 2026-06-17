import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicStoreProducts } from '@/hooks/usePublicStore';
import { StoreProduct } from '@/hooks/useCustomerStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/Reveal';
import { ProductReviewDialog } from '@/components/store/ProductReviewDialog';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { HeroCarousel } from '@/components/store/HeroCarousel';
import { PromoStrip } from '@/components/store/PromoStrip';
import { CategoryChips } from '@/components/store/CategoryChips';
import { StoreSearch } from '@/components/store/StoreSearch';
import { AccountMenu } from '@/components/store/AccountMenu';
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
  Cake,
  Clock,
  Search,
  Sparkles,
  ArrowLeft,
  Truck,
  ShieldCheck,
  PartyPopper,
} from 'lucide-react';

export default function Store() {
  const { settings } = useSettings();
  const navigate = useNavigate();

  const { data: products, isLoading: productsLoading } = usePublicStoreProducts();

  const { addToCart, count: cartCount, open: openCart } = useStoreCart();
  const wishlist = useStoreWishlist();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<StoreProduct | null>(null);

  const productsRef = useRef<HTMLDivElement>(null);

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

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToShop = (q?: string) =>
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');

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
            <div className="text-start leading-tight">
              <div className="font-display text-base sm:text-lg">{settings.storeName}</div>
              <div className="hidden sm:block text-[10px] text-muted-foreground tracking-widest uppercase">Patisserie</div>
            </div>
          </button>

          {/* Search */}
          <StoreSearch
            products={products || []}
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={() => goToShop(searchQuery)}
            className="flex-1 max-w-md mx-auto hidden md:block"
          />

          {/* Actions */}
          <div className="flex items-center gap-1.5 ms-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/events')}
              className="hidden lg:inline-flex gap-1.5 text-foreground/80 hover:text-primary hover:bg-primary/10 rounded-full press"
            >
              <PartyPopper className="w-4 h-4 text-primary" />
              جهّزي مناسبتك
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customize')}
              className="hidden sm:inline-flex gap-1.5 text-primary hover:text-primary hover:bg-primary/10 rounded-full press"
            >
              <Sparkles className="w-4 h-4" />
              صمّمي كيكتك
            </Button>

            <AccountMenu />

            <Button
              variant="outline"
              size="icon"
              aria-label="عربة التسوق"
              onClick={openCart}
              className="relative rounded-full border-border h-10 w-10 press hover:border-primary/50 hover:bg-primary/5"
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
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <StoreSearch
            products={products || []}
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={() => goToShop(searchQuery)}
            placeholder="ابحثي عن كيكة..."
          />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-10 space-y-8 lg:space-y-12">
        <Reveal>
          <HeroCarousel onShopClick={() => goToShop()} onCustomizeClick={() => navigate('/customize')} />
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
                <h2 className="font-display text-3xl md:text-5xl mt-1 leading-none">كيكات مختارة بعناية</h2>
              </div>
              <div className="flex items-center gap-4">
                <p className="hidden sm:block text-sm text-muted-foreground max-w-[16rem]">
                  تشكيلة محدثة من أكثر من {products?.length || 0} منتج فاخر.
                </p>
                <button onClick={() => goToShop()} className="group shrink-0 text-sm text-primary font-medium inline-flex items-center gap-1.5 press">
                  تسوّقي الكل <ArrowLeft className="cta-arrow w-4 h-4" />
                </button>
              </div>
            </div>
          </Reveal>

          <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
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
          <ShopByOccasion
            onShop={() => goToShop()}
            onOccasion={(occ) => navigate(`/shop?occasion=${encodeURIComponent(occ)}`)}
          />
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
              <h3 className="font-display text-2xl sm:text-3xl md:text-5xl mt-4 leading-tight">لحظات الفرح تبدأ بقطعة كيك</h3>
              <p className="mt-3 text-white/75 leading-relaxed max-w-lg mx-auto">
                من أعياد الميلاد إلى المناسبات الخاصة، نحضّر لكِ كل طلب بحبٍّ وعناية.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => goToShop()} className="group press sheen rounded-full ps-8 pe-6 h-[52px] bg-white text-foreground hover:bg-white/90 font-semibold transition-colors flex items-center gap-2">
                  تسوّقي الآن <ArrowLeft className="cta-arrow w-4 h-4" />
                </button>
                <button onClick={() => navigate('/events')} className="press rounded-full ps-7 pe-8 h-[52px] bg-white/10 border border-white/30 text-white hover:bg-white/20 font-medium transition-colors inline-flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-primary" /> جهّزي مناسبتك
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
