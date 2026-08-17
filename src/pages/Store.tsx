import { Fragment, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import { StoreProduct } from '@/hooks/useCustomerStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useCombos } from '@/hooks/useCombos';
import { resolveCombos } from '@/lib/combos';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { sortProducts } from '@/lib/shopSort';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import { StickyCartBar } from '@/components/store/StickyCartBar';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { StoreSearch } from '@/components/store/StoreSearch';
import { sectionRenderers } from '@/components/store/sectionRenderers';
import { useCatalogSession } from '@/hooks/useCatalogSession';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { galleryCakes } from '@/lib/cakeSelect';
import type { CtaTarget } from '@/lib/homepage/types';

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
  // ترتيب الأقسام وإظهارها ومحتواها — كلّها من لوحة إدارة الصفحة الرئيسية.
  const { sections, contentOf, isSectionVisible } = useHomepageContent();

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

  /** وجهة زرّ مُحرَّرة: `#قسم` تمرير داخل الصفحة، و`/مسار` انتقال. */
  const goTo = (target: CtaTarget) => {
    if (target.startsWith('#')) scrollToId(target.slice(1));
    else navigate(target);
  };

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

  /**
   * الشريط المتحرك والترويسة هما زينة أعلى الصفحة، لا قسمان في المتن: الترويسة
   * `sticky top-0`، فموضعها في الشجرة يحدّد سلوكها ولا يجوز أن يتنقّل. المدير
   * يستطيع إخفاء الشريط، وترتيبه بين الأقسام بلا معنى.
   */
  const body = sections.filter((s) => s.key !== 'marquee');

  /**
   * الواجهة تُسحب لأعلى بارتفاع الترويسة كي تنزف الصورة خلفها — وهذا صحيح فقط
   * حين تكون أول ما في المتن. لو أنزلها المدير، تُرسم قسماً عادياً وتصير
   * الترويسة صلبة، وإلا لكانت ترويسة شفّافة فوق قسم أبيض: بيضاء على بيضاء.
   */
  const heroIsFirst = body[0]?.key === 'hero';

  // نفس الخريطة التي ترسمها معاينة لوحة الإدارة — انظر `sectionRenderers.tsx`.
  const renderers = sectionRenderers({
    contentOf,
    listed,
    categories,
    category,
    onCategoryChange: setCategory,
    query,
    seasonal,
    combos,
    designCakes,
    catalogLoading,
    featured,
    storeName: settings.storeName,
    heroIsFirst,
    renderCard,
    onCta: goTo,
    onNavigate: navigate,
    onPickCake: (cakeId) => navigate('/customize', { state: { initial: { cakeId } } }),
    onViewFeatured: () => featured && navigate(`/product/${featured.id}`),
    onAddCombo: (combo) =>
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
      }),
  });

  /**
   * روابط التنقّل تُشتقّ من الأقسام المرئية فعلاً: عنصر يمرّر إلى قسم مُطفأ
   * يبدو معطّلاً، وهو ما كان سيحدث لكل إخفاء من اللوحة.
   *
   * وشرطا «صمّم كيكتك» و«الكومبوهات» يبقيان فوق ذلك — القسمان يُخفيان نفسيهما
   * حين لا توجد بيانات، فمفتاح الإظهار يحذف ولا يُظهر فارغاً.
   */
  const NAV = [
    ...(isSectionVisible('shop') ? [{ label: 'كل المنتجات', action: () => scrollToId('shop') }] : []),
    ...(isSectionVisible('customCake') && showDesignSection
      ? [{ label: 'صمّم كيكتك', action: () => scrollToId('custom') }]
      : []),
    ...(isSectionVisible('seasonal') && seasonal.length > 0
      ? [{ label: 'تشكيلة الصيف 🥭', action: () => scrollToId('seasonal'), season: true }]
      : []),
    ...(isSectionVisible('combos') && combos.length > 0
      ? [{ label: 'الكومبوهات', action: () => scrollToId('combos') }]
      : []),
    { label: 'تجهيز المناسبات', action: () => navigate('/events') },
    ...(isSectionVisible('branches') ? [{ label: 'فروعنا', action: () => scrollToId('branches') }] : []),
  ];

  return (
    <div className={`store-surface min-h-screen bg-background text-foreground ${cartCount > 0 ? 'pb-20 md:pb-0' : ''}`}>
      <StickyCartBar />

      {isSectionVisible('marquee') && renderers.marquee()}

      <StorefrontMasthead
        floating={heroIsFirst}
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

      {body.map(({ key }) => (
        <Fragment key={key}>{renderers[key]()}</Fragment>
      ))}

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} onJump={scrollToId} />
    </div>
  );
}
