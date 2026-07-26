import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Instagram, MapPin, Menu, MessageCircle, Phone, ShoppingBag, User, X } from 'lucide-react';
import { usePublicStoreProducts, isSoldOut } from '@/hooks/usePublicStore';
import { StoreProduct } from '@/hooks/useCustomerStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { sortProducts } from '@/lib/shopSort';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { Marquee, GoldDivider } from '@/components/store/StorefrontDecor';
import { StoreHero } from '@/components/store/StoreHero';
import { SeasonalSection } from '@/components/store/SeasonalSection';
import { ShopByOccasion, FAQ } from '@/components/store/StorefrontSections';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import { CombosSection } from '@/components/store/CombosSection';
import { Reviews } from '@/components/store/Reviews';
import { EventsSection } from '@/components/store/EventsSection';
import { BranchesSection } from '@/components/store/BranchesSection';
import { GiftBox } from '@/components/store/GiftBox';
import { StickyCartBar } from '@/components/store/StickyCartBar';
import { StoreSearch } from '@/components/store/StoreSearch';
import { Reveal } from '@/components/Reveal';

export default function Store() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: products } = usePublicStoreProducts();
  const { addToCart, updateQuantity, count: cartCount, open: openCart, cart } = useStoreCart();
  const wishlist = useStoreWishlist();

  const [category, setCategory] = useState('الكل');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  // Header: transparent while it overlays the full-bleed hero, solid once scrolled.
  // Mobile also collapses the search band while scrolling down to reclaim viewport.
  const [scrolled, setScrolled] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Ignore sub-threshold jitter: a settle event at the same offset would
      // otherwise read as "not scrolling up" and collapse the bar immediately.
      if (Math.abs(y - lastY) < 6) return;
      setShowMobileSearch(y < lastY);
      lastY = y;
    };
    onScroll(); // sync when the page loads already scrolled
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const seasonal = useMemo(() => (products ?? []).filter((p) => !!p.season), [products]);
  const qtyOf = (id: string) => cart.find((i) => i.product.id === id)?.quantity ?? 0;
  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

  const NAV = [
    { label: 'كل المنتجات', action: () => scrollToId('shop') },
    { label: 'تشكيلة الصيف 🥭', action: () => scrollToId('seasonal'), season: true },
    { label: 'الكومبوهات', action: () => scrollToId('combos') },
    { label: 'تجهيز المناسبات', action: () => navigate('/events') },
    { label: 'فروعنا', action: () => scrollToId('branches') },
  ];

  return (
    <div className={`storefront-theme min-h-screen bg-[#fffdfa] text-[#2c2226] ${cartCount > 0 ? 'pb-20 md:pb-0' : ''}`}>
      <StickyCartBar />
      <Marquee />

      <header
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          scrolled ? 'border-b border-[#9e3a5c]/10 bg-[#fffdfa]/95 backdrop-blur' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-5 sm:px-8 md:h-[84px] lg:px-12">
          {/* Brand */}
          <button onClick={() => scrollToId('top')} className="shrink-0 text-start leading-none">
            <span className={`block text-xl font-black tracking-[-.06em] transition-colors sm:text-2xl ${scrolled ? 'text-[#9e3a5c]' : 'text-white [text-shadow:0_2px_12px_rgba(0,0,0,.45)]'}`}>{settings.storeName}</span>
            <span className={`mt-1 block text-[9px] font-bold tracking-[.14em] transition-colors ${scrolled ? 'text-[#86736c]' : 'text-white/75'}`}>حلويات جازان الفاخرة</span>
          </button>
          {/* Inline nav */}
          <nav className="ms-6 hidden shrink-0 items-center gap-6 text-sm font-bold lg:flex">
            {NAV.map((n) => (
              <button
                key={n.label}
                onClick={n.action}
                className={`transition-colors ${
                  n.season
                    ? scrolled ? 'text-[#e8942f] hover:text-[#c97a1f]' : 'text-[#ddbd75] hover:text-white'
                    : scrolled ? 'hover:text-[#b0506e]' : 'text-white hover:text-[#ddbd75]'
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
          {/* Center search pill — glassy while the header floats over the hero.
              Scoped to the pill itself ([&>svg] is the leading icon, not the dropdown's).
              On focus the input's own `focus-visible:bg-card` makes it light, so the
              text/icon must flip back to ink or they'd be white-on-white. */}
          <StoreSearch
            products={products ?? []}
            value={query}
            onChange={setQuery}
            onSubmit={() => scrollToId('shop')}
            className={`mx-auto hidden max-w-xl flex-1 md:block ${
              scrolled
                ? ''
                : '[&>svg]:text-white/70 [&_input]:border-white/25 [&_input]:bg-white/15 [&_input]:text-white [&_input]:backdrop-blur-sm [&_input]:placeholder:text-white/65 [&:focus-within>svg]:text-[#857077] [&:focus-within_input]:border-[#9e3a5c]/20 [&:focus-within_input]:text-[#2c2226] [&:focus-within_input]:placeholder:text-[#857077]'
            }`}
          />
          {/* Actions */}
          <div className="ms-auto flex shrink-0 items-center gap-2">
            {/* Account — signed out goes to login/registration, signed in to the
                profile hub (which links orders, wishlist and tracking). */}
            <button
              onClick={() => navigate(user ? '/my-profile' : '/login')}
              aria-label={user ? 'حسابي' : 'تسجيل الدخول أو إنشاء حساب'}
              title={user ? 'حسابي' : 'تسجيل الدخول'}
              className={`hidden size-10 place-items-center rounded-full border transition-colors sm:grid ${
                scrolled ? 'border-[#9e3a5c]/15 text-[#9e3a5c] hover:bg-[#fbeef2]' : 'border-white/40 text-white hover:bg-white/15'
              }`}
            >
              <User size={18} />
            </button>
            <button onClick={openCart} aria-label={`السلة تحتوي ${toArabicDigits(cartCount)} منتجات`} className="relative grid size-10 place-items-center rounded-full bg-[#9e3a5c] text-white transition-colors hover:bg-[#b0506e]">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span key={cartCount} className="badge-pop absolute -top-1 -start-1 grid size-5 place-items-center rounded-full bg-[#ddbd75] text-[10px] font-bold text-[#9e3a5c]">{toArabicDigits(cartCount)}</span>}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className={`p-2 transition-colors lg:hidden ${scrolled ? '' : 'text-white'}`} aria-label="القائمة">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {/* Mobile search row — collapses on scroll-down to reclaim viewport */}
        <div className={`overflow-hidden border-[#9e3a5c]/10 px-5 sm:px-8 md:hidden ${scrolled && showMobileSearch ? 'max-h-24 border-t py-3 opacity-100' : 'max-h-0 border-t-0 py-0 opacity-0'} transition-all duration-300`}>
          <StoreSearch
            products={products ?? []}
            value={query}
            onChange={setQuery}
            onSubmit={() => scrollToId('shop')}
            placeholder="ابحث عن تورتة، نكهة، أو مناسبة…"
          />
        </div>
        {menuOpen && (
          <nav className="absolute inset-x-0 top-full grid gap-4 border-b border-[#9e3a5c]/10 bg-[#fffdfa] px-6 py-5 text-sm font-bold shadow-lg lg:hidden">
            {NAV.map((n) => (
              <button key={n.label} onClick={() => { setMenuOpen(false); n.action(); }} className={`text-start ${n.season ? 'text-[#e8942f]' : ''}`}>
                {n.label}
              </button>
            ))}
            {/* The account button is sm+ only, so keep sign-in reachable on phones */}
            <button
              onClick={() => { setMenuOpen(false); navigate(user ? '/my-profile' : '/login'); }}
              className="flex items-center gap-2 border-t border-[#9e3a5c]/10 pt-4 text-start text-[#9e3a5c]"
            >
              <User size={16} /> {user ? 'حسابي' : 'تسجيل الدخول / إنشاء حساب'}
            </button>
          </nav>
        )}
      </header>

      {/* Pulled up by the header's height so the hero image bleeds behind it */}
      <div className="-mt-16 md:-mt-[84px]">
        <StoreHero onShop={() => scrollToId('shop')} onCustomize={() => navigate('/customize')} />
      </div>

      <SeasonalSection products={seasonal} renderCard={renderCard} />

      <ShopByOccasion />

      <GoldDivider />

      <section id="shop" className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <Reveal className="flex flex-col justify-between gap-5 border-b border-[#9e3a5c]/15 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold tracking-[.08em] text-[#b0506e]">اختر ما يناسب مناسبتك</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.01em] text-[#2c2226] sm:text-4xl">تسوق التورتات</h2>
          </div>
          <p className="text-xs leading-6 text-[#7d6870]">جميع التورتات تكفي من ٨ إلى ١٢ شخصاً<br />مع إمكانية إضافة بطاقة تهنئة</p>
        </Reveal>
        <div className="flex flex-col justify-between gap-4 border-b border-[#9e3a5c]/10 py-5 md:flex-row md:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === item ? 'bg-[#9e3a5c] text-white' : 'bg-[#f6ecef] text-[#8a6570] hover:bg-[#f2dbe2]'}`}
              >
                {item}
              </button>
            ))}
          </div>
          {/* Hands off to the full catalogue, where sorting and filtering live */}
          <button
            onClick={() => navigate('/shop')}
            className="group/more flex shrink-0 items-center gap-2 self-start rounded-full border border-[#9e3a5c]/25 px-5 py-2 text-xs font-bold text-[#9e3a5c] transition-colors hover:border-[#9e3a5c] hover:bg-[#fbeef2] md:self-auto"
          >
            عرض كل المنتجات
            <ArrowLeft size={15} className="transition-transform duration-300 group-hover/more:-translate-x-1" />
          </button>
        </div>

        {listed.length === 0 ? (
          <p className="py-20 text-center text-sm text-[#857077]">لا توجد نتائج لـ «{query}». جرّب كلمة أخرى.</p>
        ) : (
          <Reveal className="reveal-grid mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:mt-9 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {listed.map((product) => renderCard(product))}
          </Reveal>
        )}
      </section>

      <CombosSection
        products={products}
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

      <footer className="mt-2 bg-gradient-to-b from-[#7d2f49] to-[#5f2338] text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-8">
            {/* Brand + social */}
            <div>
              <p className="text-2xl font-black tracking-[-.04em]">{settings.storeName}</p>
              <p className="mt-1 text-[10px] font-bold tracking-[.16em] text-[#ddbd75]">حلويات جازان الفاخرة</p>
              <p className="mt-4 max-w-xs text-sm leading-7 text-white/70">
                تورتات وحلويات طازجة تُخبز يومياً في جازان بأجود المكوّنات — لكل مناسبة كيكتها المميزة.
              </p>
              <div className="mt-5 flex gap-2.5">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="انستغرام" className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#ddbd75] hover:text-[#9e3a5c]">
                  <Instagram size={18} />
                </a>
                <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#ddbd75] hover:text-[#9e3a5c]">
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>

            {/* Shop */}
            <nav aria-label="تسوّق">
              <p className="text-sm font-black text-[#ddbd75]">تسوّق</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/75">
                <li><button onClick={() => scrollToId('shop')} className="transition-colors hover:text-white">كل المنتجات</button></li>
                <li><button onClick={() => scrollToId('seasonal')} className="transition-colors hover:text-white">تشكيلة الصيف 🥭</button></li>
                <li><button onClick={() => scrollToId('combos')} className="transition-colors hover:text-white">الكومبوهات</button></li>
                <li><button onClick={() => navigate('/customize')} className="transition-colors hover:text-white">صمّم تورتة خاصة</button></li>
              </ul>
            </nav>

            {/* Help */}
            <nav aria-label="المساعدة">
              <p className="text-sm font-black text-[#ddbd75]">المساعدة</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/75">
                <li><button onClick={() => scrollToId('faq')} className="transition-colors hover:text-white">الأسئلة الشائعة</button></li>
                <li><button onClick={() => navigate('/events')} className="transition-colors hover:text-white">تجهيز المناسبات</button></li>
                <li><button onClick={() => scrollToId('branches')} className="transition-colors hover:text-white">فروعنا</button></li>
                <li><button onClick={() => navigate('/contact')} className="transition-colors hover:text-white">تواصل معنا</button></li>
              </ul>
            </nav>

            {/* Contact */}
            <div>
              <p className="text-sm font-black text-[#ddbd75]">تواصل معنا</p>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li className="flex items-center gap-2.5">
                  <MapPin size={16} className="shrink-0 text-[#ddbd75]" /> صبيا · أبو عريش، جازان
                </li>
                <li>
                  <a href="tel:+966173600000" dir="ltr" className="flex items-center gap-2.5 transition-colors hover:text-white">
                    <Phone size={16} className="shrink-0 text-[#ddbd75]" /> ٠١٧ ٣٦٠ ٠٠٠٠
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock size={16} className="shrink-0 text-[#ddbd75]" /> يومياً ٩ص – ١٢م
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar — copyright + payment trust */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row">
            <p className="text-xs text-white/60">© ٢٠٢٥ {settings.storeName} · جازان، المملكة العربية السعودية</p>
            <div className="flex flex-wrap items-center gap-2">
              {['مدى', 'فيزا', 'ماستركارد', 'Apple Pay', 'تابي'].map((m) => (
                <span key={m} className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
