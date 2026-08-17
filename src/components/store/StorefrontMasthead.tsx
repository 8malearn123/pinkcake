import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreCartOptional } from '@/contexts/StoreCartContext';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { cn } from '@/lib/utils';

export interface MastheadNavItem {
  label: string;
  action: () => void;
  /** Seasonal items render in the amber accent instead of the default ink. */
  season?: boolean;
}

interface StorefrontMastheadProps {
  /**
   * Home only: the bar floats transparently over the full-bleed hero and turns
   * solid on scroll. Everywhere else it is solid from the first paint.
   */
  floating?: boolean;
  nav?: MastheadNavItem[];
  /**
   * Desktop search slot — the home page and /shop pass <StoreSearch />. Receives
   * `overHero` so the field can go glassy over the hero photo without the page
   * having to run a second scroll listener of its own.
   */
  search?: (overHero: boolean) => ReactNode;
  /** Collapsible mobile search band beneath the bar. */
  mobileSearch?: ReactNode;
}

/**
 * The one storefront header. Extracted from the home page (which declared it
 * inline) so every customer-facing screen opens the same way instead of each
 * hand-rolling its own rose-era bar.
 *
 * The cart button is context-optional: on routes outside StorefrontLayout it
 * simply doesn't render, rather than crashing the page.
 */
export function StorefrontMasthead({
  floating = false,
  nav,
  search,
  mobileSearch,
}: StorefrontMastheadProps) {
  const { settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cart = useStoreCartOptional();

  const [menuOpen, setMenuOpen] = useState(false);
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

  const items =
    nav ??
    ([
      { label: 'كل المنتجات', action: () => navigate('/shop') },
      { label: 'صمّم كيكتك', action: () => navigate('/customize') },
      { label: 'تجهيز المناسبات', action: () => navigate('/events') },
      { label: 'تتبّع طلبك', action: () => navigate('/track') },
    ] satisfies MastheadNavItem[]);

  /** Over-hero styling applies only while floating AND still at the top. */
  const overHero = floating && !scrolled;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors duration-300',
        overHero
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-primary/10 bg-background/95 backdrop-blur',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-5 sm:px-8 md:h-[84px] lg:px-12">
        {/* Brand — the real lockup, not type standing in for it. It was set as
            weight-900 at -.06em tracking, which is the exact opposite of the
            thin geometric mark it was imitating. */}
        <button
          onClick={() => navigate('/')}
          className="shrink-0 text-start leading-none"
          aria-label={`${settings.storeName} — الصفحة الرئيسية`}
        >
          <BrandLogo
            variant="ar"
            decorative
            className={cn(
              'h-9 transition-colors sm:h-11',
              overHero
                ? 'text-white [filter:drop-shadow(0_2px_12px_rgb(0_0_0/.45))]'
                : 'text-primary',
            )}
          />
          <span
            className={cn(
              'mt-1.5 block text-[9px] font-medium tracking-[.14em] transition-colors',
              overHero ? 'text-white/75' : 'text-muted-foreground',
            )}
          >
            حلويات جازان الفاخرة
          </span>
        </button>

        {/* Inline nav */}
        <nav className="ms-6 hidden shrink-0 items-center gap-6 text-sm font-bold lg:flex">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={cn(
                'transition-colors',
                item.season
                  ? overHero
                    ? 'text-gold hover:text-white'
                    : 'text-seasonal hover:text-seasonal/80'
                  : overHero
                    ? 'text-white hover:text-gold'
                    : 'hover:text-rose',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {search?.(overHero)}

        {/* Actions */}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {/* Signed out goes to login/registration, signed in to the profile hub
              (which links orders, wishlist and tracking). */}
          <button
            onClick={() => navigate(user ? '/my-profile' : '/login')}
            aria-label={user ? 'حسابي' : 'تسجيل الدخول أو إنشاء حساب'}
            title={user ? 'حسابي' : 'تسجيل الدخول'}
            className={cn(
              'hidden size-10 place-items-center rounded-full border transition-colors sm:grid',
              overHero
                ? 'border-white/40 text-white hover:bg-white/15'
                : 'border-primary/15 text-primary hover:bg-blush',
            )}
          >
            <User size={18} />
          </button>

          {cart && (
            <button
              onClick={cart.open}
              aria-label={`السلة تحتوي ${toArabicDigits(cart.count)} منتجات`}
              className="relative grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-rose"
            >
              <ShoppingBag size={18} />
              {cart.count > 0 && (
                <span
                  key={cart.count}
                  className="badge-pop absolute -top-1 -start-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-primary"
                >
                  {toArabicDigits(cart.count)}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn('p-2 transition-colors lg:hidden', overHero && 'text-white')}
            aria-label="القائمة"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile search row — collapses on scroll-down to reclaim viewport */}
      {mobileSearch && (
        <div
          className={cn(
            'overflow-hidden border-primary/10 px-5 transition-all duration-300 sm:px-8 md:hidden',
            scrolled && showMobileSearch
              ? 'max-h-24 border-t py-3 opacity-100'
              : 'max-h-0 border-t-0 py-0 opacity-0',
          )}
        >
          {mobileSearch}
        </div>
      )}

      {menuOpen && (
        <nav className="absolute inset-x-0 top-full grid gap-4 border-b border-primary/10 bg-background px-6 py-5 text-sm font-bold shadow-lg lg:hidden">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setMenuOpen(false);
                item.action();
              }}
              className={cn('text-start', item.season && 'text-seasonal')}
            >
              {item.label}
            </button>
          ))}
          {/* The account button is sm+ only, so keep sign-in reachable on phones */}
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate(user ? '/my-profile' : '/login');
            }}
            className="flex items-center gap-2 border-t border-primary/10 pt-4 text-start text-primary"
          >
            <User size={16} /> {user ? 'حسابي' : 'تسجيل الدخول / إنشاء حساب'}
          </button>
        </nav>
      )}
    </header>
  );
}
