import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cake, Camera, ChevronLeft, Clock, ShoppingBag, Sparkles, User, Wand2 } from 'lucide-react';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCatalogSession } from '@/hooks/useCatalogSession';
import { Skeleton } from '@/components/ui/skeleton';
import { Marquee } from '@/components/store/StorefrontDecor';
import { CustomCakeCard } from '@/components/store/CustomCakeCard';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { galleryCakes } from '@/lib/cakeSelect';
import { toArabicDigits } from '@/lib/arabicNumerals';

const PROMISES = [
  { icon: Camera, text: 'كل خيار مصوّر في مطبخنا' },
  { icon: Sparkles, text: 'تعديلات مجانية قبل التأكيد' },
  { icon: Clock, text: 'جاهزة خلال ٢٤ ساعة' },
];

/**
 * Every cake a customer can actually design, in one place — the "view all" behind
 * the home page's studio section. Picking one opens /customize already seeded with
 * it, so the studio's own gallery is never the entry point from here.
 */
export default function CustomCakes() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { count: cartCount, open: openCart } = useStoreCart();
  const { status, catalog, urlFor } = useCatalogSession();

  const cakes = useMemo(() => galleryCakes(catalog, urlFor), [catalog, urlFor]);
  const loading = status === 'loading';

  const openStudio = (cakeId: string) =>
    navigate('/customize', { state: { initial: { cakeId } } });

  const footerJump = (section: string) => {
    if (section === 'shop' || section === 'seasonal') navigate('/shop');
    else if (section === 'faq') navigate('/faq');
    else navigate('/store');
  };

  return (
    <div className="store-surface min-h-screen bg-background text-foreground">
      <Marquee />

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
            <span className="mt-1 block text-[9px] font-bold tracking-[.14em] text-muted-foreground">
              حلويات جازان الفاخرة
            </span>
          </button>

          <div className="ms-auto flex shrink-0 items-center gap-2">
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

      {/* Hero band */}
      <section className="bg-gradient-to-b from-ink-deep to-primary px-5 py-14 text-white sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1500px]">
          <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-gold">
            <span className="h-px w-10 bg-gold/60" /> استوديو التصميم
          </p>
          <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.05] tracking-[-.01em] sm:text-[3.25rem]">
            كيكات تُصمّم كما تحب
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-8 text-white/75">
            اختر أي كيكة من التشكيلة، ثم خصّص شكلها ونكهتها ولونها خطوة بخطوة. كل خيار تراه هو صورة
            كيكة خبزناها فعلاً — تشوف كيكتك قبل ما تطلبها.
          </p>

          <ul className="mt-7 flex flex-wrap gap-2.5">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/85 backdrop-blur"
              >
                <Icon size={14} className="text-gold" /> {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/5] rounded-2xl" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : cakes.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-primary/25 bg-background px-6 py-14 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-blush">
              <Cake size={28} className="text-rose" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-.02em]">لا توجد تصاميم جاهزة بعد</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              نصوّر تشكيلة التصميم الآن — إلى أن تجهز، تشكيلتنا الكاملة بانتظارك.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-t from-pink-dark to-primary px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.8)] transition-transform active:scale-95"
            >
              تصفّح كل المنتجات <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-3 border-b border-primary/15 pb-6 sm:flex-row sm:items-end">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Wand2 size={18} className="text-rose" />
                {toArabicDigits(cakes.length)} تصميم جاهز للتخصيص
              </h2>
              <p className="text-xs leading-6 text-muted-foreground">
                السعر يبدأ من القاعدة — الإضافات تظهر لك أولاً بأول داخل الاستوديو
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {cakes.map(({ cake, previewUrl }) => (
                <CustomCakeCard
                  key={cake.id}
                  cake={cake}
                  previewUrl={previewUrl}
                  onPick={() => openStudio(cake.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} onJump={footerJump} />
    </div>
  );
}
