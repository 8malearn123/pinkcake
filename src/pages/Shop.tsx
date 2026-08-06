import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePublicStoreProducts } from '@/hooks/usePublicStore';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StoreSearch } from '@/components/store/StoreSearch';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { Marquee } from '@/components/store/StorefrontDecor';
import { CategoryChips } from '@/components/store/CategoryChips';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { BackToTop } from '@/components/store/BackToTop';
import { Eyebrow, Title, Lede } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { SORTS, sortProducts } from '@/lib/shopSort';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { Cake, Search, ArrowUpDown, Sparkles, ArrowLeft } from 'lucide-react';

export default function Shop() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? 'all';
  const sort = params.get('sort') ?? 'featured';
  const occasion = params.get('occasion') ?? '';

  const { data: products, isLoading } = usePublicStoreProducts();
  const { addToCart, updateQuantity, cart, count: cartCount, open: openCart } = useStoreCart();
  const wishlist = useStoreWishlist();
  const qtyOf = (id: string) => cart.find((i) => i.product.id === id)?.quantity ?? 0;

  const productIds = useMemo(() => products?.map((p) => p.id) ?? [], [products]);
  const { data: ratingsMap } = useProductRatings(productIds);

  const categories = useMemo(
    () => [...new Set((products ?? []).map((p) => p.category).filter(Boolean))] as string[],
    [products],
  );

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // Only filter by occasion once at least one product carries occasion tags
  // (so a not-yet-tagged real catalogue still shows everything under the banner).
  const occasionTagged = useMemo(
    () => !!occasion && (products ?? []).some((p) => p.occasions?.includes(occasion)),
    [products, occasion],
  );

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = (products ?? []).filter((p) => {
      const matchCat = category === 'all' || p.category === category;
      const matchOcc = !occasionTagged || !!p.occasions?.includes(occasion);
      const matchQ =
        !ql ||
        p.name.toLowerCase().includes(ql) ||
        !!p.description?.toLowerCase().includes(ql) ||
        !!p.category?.toLowerCase().includes(ql);
      return matchCat && matchOcc && matchQ;
    });
    return sortProducts(list, sort, ratingsMap);
  }, [products, q, category, sort, ratingsMap, occasion, occasionTagged]);

  const isNarrowed = !!q || category !== 'all';
  const isFiltered = isNarrowed || !!occasion;

  return (
    <div className="store-surface min-h-screen bg-background text-foreground">
      <Marquee />
      <StorefrontMasthead
        search={() => (
          <StoreSearch
            products={products ?? []}
            value={q}
            onChange={(v) => update({ q: v })}
            onSubmit={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mx-auto hidden max-w-xl flex-1 md:block"
          />
        )}
        mobileSearch={
          <StoreSearch
            products={products ?? []}
            value={q}
            onChange={(v) => update({ q: v })}
            onSubmit={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        }
      />

      <main className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        {/* Title */}
        <div className="mb-8 border-b border-primary/15 pb-6">
          <Eyebrow>{occasion ? 'تسوّق حسب المناسبة' : 'المتجر'}</Eyebrow>
          <Title variant="h2" as="h1" className="mt-2">
            {q ? <>نتائج البحث عن «{q}»</> : occasion || 'كل المنتجات'}
          </Title>
          {occasion && !q && (
            <Lede className="mt-3 max-w-xl">
              اخترنا لك تشكيلتنا المثالية لـ«{occasion}» — صفّ حسب الفئة أو رتّب كما تحبّ.
            </Lede>
          )}
        </div>

        {/* Toolbar — category filter + sort */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <CategoryChips
                categories={categories}
                selected={category}
                onSelect={(c) => update({ category: c === 'all' ? '' : c })}
              />
            </div>
            <Select value={sort} onValueChange={(v) => update({ sort: v === 'featured' ? '' : v })}>
              <SelectTrigger className="w-[185px] h-10 rounded-full shrink-0 gap-1">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="ترتيب" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isLoading && (
            <div className="text-sm text-muted-foreground">
              {toArabicDigits(results.length)} منتج{isNarrowed ? ' مطابق' : ''}
            </div>
          )}
        </div>

        {/* Grid / states */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-background">
                <Skeleton className="aspect-[4/5]" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="mt-3 h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-blush/40 py-20 text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-background">
              <Search className="size-7 text-muted-foreground" />
            </div>
            <Title variant="h3" as="h3">
              لا توجد نتائج
            </Title>
            <p className="mt-1 text-sm text-muted-foreground">
              {q ? `لم نجد منتجات تطابق «${q}»` : 'لا توجد منتجات في هذه الفئة'}
            </p>
            {isFiltered && (
              <Button
                variant="brandFlat"
                size="pill"
                className="mt-5"
                onClick={() => setParams({}, { replace: true })}
              >
                مسح عوامل التصفية
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((p, index) => (
              <StoreProductCard
                key={p.id}
                // First row only — see StoreProductCard's `priority` note.
                priority={index < 4}
                product={p}
                rating={ratingsMap?.[p.id]}
                inCart={qtyOf(p.id)}
                isFavorite={wishlist.has(p.id)}
                onAdd={() => addToCart(p)}
                onRemoveOne={() => updateQuantity(p.id, -1)}
                onToggleFavorite={() => wishlist.toggle(p)}
                onView={() => navigate(`/product/${p.id}`)}
              />
            ))}
          </div>
        )}

        {/* Customize-your-cake CTA */}
        <section className="mt-12 lg:mt-16">
          <div className="gradient-berry-deep relative overflow-hidden rounded-2xl p-8 text-white sm:p-12">
            <div aria-hidden className="pointer-events-none absolute -top-16 -end-10 size-56 rounded-full bg-gold/15 blur-2xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 -start-8 size-52 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:justify-between lg:text-start">
              <div>
                <Eyebrow tone="dark" rule caps>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    تصميم خاص
                  </span>
                </Eyebrow>
                <Title variant="h2" tone="dark" className="mt-3">
                  صمّم كيكتك الخاصة
                </Title>
                <Lede tone="dark" className="mt-2 max-w-md">
                  اختر الشكل والنكهة والحشوة واللون والكتابة — كيكة فريدة تُصنع خصيصاً لمناسبتك.
                </Lede>
              </div>
              <Button
                variant="gold"
                size="cta"
                className="group shrink-0 rounded-full"
                onClick={() => navigate('/customize')}
              >
                <Cake className="size-5" />
                ابدأ التصميم
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} />

      <FloatingContactButton />
      <BackToTop />
    </div>
  );
}
