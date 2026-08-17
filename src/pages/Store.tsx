import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import { StoreProduct } from '@/hooks/useCustomerStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useCombos } from '@/hooks/useCombos';
import { resolveCombos } from '@/lib/combos';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { sortProducts } from '@/lib/shopSort';
import { Marquee, GoldDivider } from '@/components/store/StorefrontDecor';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { StoreHero } from '@/components/store/StoreHero';
import { CustomCakeSection } from '@/components/store/CustomCakeSection';
import { SeasonalSection } from '@/components/store/SeasonalSection';
import { ShopByOccasion, FAQ } from '@/components/store/StorefrontSections';
import { OfferBanner } from '@/components/store/OfferBanner';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import { CardRail } from '@/components/store/CardRail';
import { CombosSection } from '@/components/store/CombosSection';
import { Reviews } from '@/components/store/Reviews';
import { EventsSection } from '@/components/store/EventsSection';
import { BranchesSection } from '@/components/store/BranchesSection';
import { GiftBox } from '@/components/store/GiftBox';
import { StickyCartBar } from '@/components/store/StickyCartBar';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { StoreSearch } from '@/components/store/StoreSearch';
import { Reveal } from '@/components/Reveal';
import { useCatalogSession } from '@/hooks/useCatalogSession';
import { galleryCakes } from '@/lib/cakeSelect';

export default function Store() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const { data: products } = usePublicStoreProducts();
  const { addToCart, updateQuantity, count: cartCount, cart } = useStoreCart();
  const wishlist = useStoreWishlist();
  // Designable cakes come from the photo catalog, not `products` — the two models
  // are disjoint, and only a CatalogCake id can seed the studio.
  const { status: catalogStatus, catalog, urlFor } = useCatalogSession();
  const { combos: comboDefs, urlFor: comboUrlFor } = useCombos();

  const [category, setCategory] = useState('الكل');
  const [query, setQuery] = useState('');

  const productIds = useMemo(() => products?.map((p) => p.id) ?? [], [products]);
  const { data: ratingsMap } = useProductRatings(productIds);

  const categories = useMemo(
    () => ['الكل', ...new Set((products ?? []).map((p) => p.category).filter(Boolean) as string[])],
    [products],
  );

  const listed = useMemo(() => {
    const q = query.trim();
    const filtered = (products ?? []).filter(
      (p) =>
        (category === 'الكل' || p.category === category) &&
        (q === '' || p.name.includes(q) || (p.description ?? '').includes(q) || (p.category ?? '').includes(q)),
    );
    return sortProducts(filtered, 'featured', ratingsMap);
  }, [products, category, query, ratingsMap]);

  const designCakes = useMemo(() => galleryCakes(catalog, urlFor), [catalog, urlFor]);
  // Mirrors CustomCakeSection's own render condition: it shows placeholders while
  // the catalog hydrates, then hides itself entirely if nothing is designable.
  const catalogLoading = catalogStatus === 'loading';
  const showDesignSection = catalogLoading || designCakes.length > 0;

  const seasonal = useMemo(() => (products ?? []).filter((p) => !!p.season), [products]);
  // Priced against the live catalogue, so hiding a combo in the dashboard or a
  // member selling out removes the card here without a deploy.
  const combos = useMemo(
    () => resolveCombos(comboDefs, products, isSoldOut, comboUrlFor),
    [comboDefs, products, comboUrlFor],
  );
  // Hero's "اختيار هذا الأسبوع": the first in-stock product in featured order, so
  // merchandisers steer it with display_order and the card always opens a real item.
  const featured = useMemo(() => (products ?? []).find((p) => !isSoldOut(p)), [products]);
  const qtyOf = (id: string) => cart.find((i) => i.product.id === id)?.quantity ?? 0;
  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Footer links on other storefront routes hand the target section back here in
  // location state. Wait a frame so the sections have laid out before scrolling
  // (ScrollToTop has just reset us to the top).
  const { state: navState } = useLocation();
  const jumpTarget = (navState as { scrollTo?: string } | null)?.scrollTo;
  useEffect(() => {
    if (!jumpTarget) return;
    const id = requestAnimationFrame(() => scrollToId(jumpTarget));
    return () => cancelAnimationFrame(id);
  }, [jumpTarget]);

  const renderCard = (product: StoreProduct) => (
    <StoreProductCard
      key={product.id}
      product={product}
      rating={ratingsMap?.[product.id]}
      inCart={qtyOf(product.id)}
      isFavorite={wishlist.has(product.id)}
      onAdd={() => addToCart(product)}
      onRemoveOne={() => updateQuantity(product.id, -1)}
      onToggleFavorite={() => wishlist.toggle(product)}
      onView={() => navigate(`/product/${product.id}`)}
    />
  );

  // The combos and design links are dropped when their sections resolve to
  // nothing — both render null in that case, and a nav item that scrolls
  // nowhere reads as broken.
  const NAV = [
    { label: 'كل المنتجات', action: () => scrollToId('shop') },
    ...(showDesignSection ? [{ label: 'صمّم كيكتك', action: () => scrollToId('custom') }] : []),
    { label: 'تشكيلة الصيف 🥭', action: () => scrollToId('seasonal'), season: true },
    ...(combos.length > 0 ? [{ label: 'الكومبوهات', action: () => scrollToId('combos') }] : []),
    { label: 'تجهيز المناسبات', action: () => navigate('/events') },
    { label: 'فروعنا', action: () => scrollToId('branches') },
  ];

  return (
    <div className={`store-surface min-h-screen bg-background text-foreground ${cartCount > 0 ? 'pb-20 md:pb-0' : ''}`}>
      <StickyCartBar />
      <Marquee />

      <StorefrontMasthead
        floating
        nav={NAV}
        /* Center search pill — glassy while the header floats over the hero.
           Scoped to the pill itself ([&>svg] is the leading icon, not the
           dropdown's). On focus the input's own `focus-visible:bg-card` makes it
           light, so the text/icon must flip back to ink or they'd be
           white-on-white. */
        search={(overHero) => (
          <StoreSearch
            products={products ?? []}
            value={query}
            onChange={setQuery}
            onSubmit={() => scrollToId('shop')}
            className={`mx-auto hidden max-w-xl flex-1 md:block ${
              overHero
                ? '[&>svg]:text-white/70 [&_input]:border-white/25 [&_input]:bg-white/15 [&_input]:text-white [&_input]:backdrop-blur-sm [&_input]:placeholder:text-white/65 [&:focus-within>svg]:text-muted-foreground [&:focus-within_input]:border-primary/20 [&:focus-within_input]:text-foreground [&:focus-within_input]:placeholder:text-muted-foreground'
                : ''
            }`}
          />
        )}
        mobileSearch={
          <StoreSearch
            products={products ?? []}
            value={query}
            onChange={setQuery}
            onSubmit={() => scrollToId('shop')}
            placeholder="ابحث عن تورتة، نكهة، أو مناسبة…"
          />
        }
      />

      {/* Pulled up by the header's height so the hero image bleeds behind it */}
      <div className="-mt-16 md:-mt-[84px]">
        <StoreHero
          onShop={() => scrollToId('shop')}
          onCustomize={() => navigate('/customize')}
          featured={featured}
          onViewFeatured={() => featured && navigate(`/product/${featured.id}`)}
        />
      </div>

      <CustomCakeSection
        cakes={designCakes}
        loading={catalogLoading}
        onPick={(cakeId) => navigate('/customize', { state: { initial: { cakeId } } })}
        onViewAll={() => navigate('/custom-cakes')}
      />

      <SeasonalSection products={seasonal} renderCard={renderCard} />

      <ShopByOccasion />

      {/* بانر العرض — يُعرض فقط إن كان مفعّلاً من «التسويق»، ويختفي بلا أثر
          حين لا يكون. كان مكتوباً وغير مركّب في أي صفحة. */}
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <OfferBanner onShop={() => scrollToId('shop')} />
      </div>

      <GoldDivider />

      <section id="shop" className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <Reveal className="flex flex-col justify-between gap-5 border-b border-primary/15 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold tracking-[.08em] text-rose">اختر ما يناسب مناسبتك</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.01em] text-foreground sm:text-4xl">تسوق التورتات</h2>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">جميع التورتات تكفي من ٨ إلى ١٢ شخصاً<br />مع إمكانية إضافة بطاقة تهنئة</p>
        </Reveal>
        <div className="flex flex-col justify-between gap-4 border-b border-primary/10 py-5 md:flex-row md:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === item ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-blush-deep'}`}
              >
                {item}
              </button>
            ))}
          </div>
          {/* Hands off to the full catalogue, where sorting and filtering live */}
          <button
            onClick={() => navigate('/shop')}
            className="group/more flex shrink-0 items-center gap-2 self-start rounded-full border border-primary/25 px-5 py-2 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-blush md:self-auto"
          >
            عرض كل المنتجات
            <ArrowLeft size={15} className="transition-transform duration-300 group-hover/more:-translate-x-1" />
          </button>
        </div>

        {listed.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">لا توجد نتائج لـ «{query}». جرّب كلمة أخرى.</p>
        ) : (
          <CardRail className="mt-8 sm:mt-9 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {listed.map((product) => renderCard(product))}
          </CardRail>
        )}
      </section>

      <CombosSection
        combos={combos}
        onAddCombo={(combo) =>
          // Add the bundle as ONE line at its real discounted price, so the
          // advertised "وفّر" saving is actually charged (not the members' full sum).
          addToCart({
            id: `combo-${combo.id}`,
            name: combo.name,
            description: `باقة موفّرة · ${combo.members.map((m) => m.name).join(' + ')}`,
            price: combo.price,
            category: 'كومبو',
            image_url: combo.heroImage,
            is_available: true,
          })
        }
      />

      <Reviews />

      <EventsSection onStart={() => navigate('/events')} />

      <BranchesSection />

      <FAQ />

      <GiftBox storeName={settings.storeName} />

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} onJump={scrollToId} />
    </div>
  );
}
