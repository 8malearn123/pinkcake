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
import { AccountMenu } from '@/components/store/AccountMenu';
import { CategoryChips } from '@/components/store/CategoryChips';
import { ProductCardRefined } from '@/components/store/ProductCardRefined';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { BackToTop } from '@/components/store/BackToTop';
import { Cake, ShoppingCart, Search, ArrowUpDown } from 'lucide-react';

const SORTS = [
  { value: 'featured', label: 'المميّزة' },
  { value: 'price-asc', label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'name', label: 'الاسم (أ–ي)' },
];

export default function Shop() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? 'all';
  const sort = params.get('sort') ?? 'featured';
  const occasion = params.get('occasion') ?? '';

  const { data: products, isLoading } = usePublicStoreProducts();
  const { addToCart, count: cartCount, open: openCart } = useStoreCart();
  const wishlist = useStoreWishlist();

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

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = (products ?? []).filter((p) => {
      const matchCat = category === 'all' || p.category === category;
      const matchQ =
        !ql ||
        p.name.toLowerCase().includes(ql) ||
        !!p.description?.toLowerCase().includes(ql) ||
        !!p.category?.toLowerCase().includes(ql);
      return matchCat && matchQ;
    });
    const rate = (id: string) => ratingsMap?.[id]?.average_rating ?? 0;
    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list = [...list].sort((a, b) => rate(b.id) - rate(a.id));
        break;
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        break;
      default:
        break;
    }
    return list;
  }, [products, q, category, sort, ratingsMap]);

  const isNarrowed = !!q || category !== 'all';
  const isFiltered = isNarrowed || !!occasion;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center gap-3 lg:gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0 press group">
            <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center shadow-rose-glow text-primary-foreground transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
              <Cake className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <div className="font-display text-lg">{settings.storeName}</div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Patisserie</div>
            </div>
          </button>

          <StoreSearch
            products={products ?? []}
            value={q}
            onChange={(v) => update({ q: v })}
            onSubmit={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex-1 max-w-xl mx-auto"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <AccountMenu />
            <button
              onClick={openCart}
              aria-label="عربة التسوق"
              className="press relative rounded-full border border-border bg-card h-10 w-10 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="badge-pop absolute -top-1 -start-1 min-w-[20px] h-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Title */}
        <div className="mb-5">
          <div className="text-xs text-primary tracking-widest uppercase font-medium">
            {occasion ? 'تسوّقي حسب المناسبة' : 'المتجر'}
          </div>
          <h1 className="font-display text-4xl md:text-5xl mt-1 leading-none">
            {q ? <>نتائج البحث عن «{q}»</> : occasion || 'كل المنتجات'}
          </h1>
          {occasion && !q && (
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              اخترنا لكِ تشكيلتنا المثالية لـ«{occasion}» — صفّي حسب الفئة أو رتّبي كما تحبّين.
            </p>
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
              {results.length} منتج{isNarrowed ? ' مطابق' : ''}
            </div>
          )}
        </div>

        {/* Grid / states */}
        {isLoading ? (
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
        ) : results.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-border/60 bg-secondary/30">
            <div className="w-16 h-16 mx-auto rounded-full bg-card flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl">لا توجد نتائج</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {q ? `لم نجد منتجات تطابق «${q}»` : 'لا توجد منتجات في هذه الفئة'}
            </p>
            {isFiltered && (
              <button
                onClick={() => setParams({}, { replace: true })}
                className="press mt-5 inline-flex items-center rounded-full h-11 px-6 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                مسح عوامل التصفية
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {results.map((p) => (
              <ProductCardRefined
                key={p.id}
                product={p}
                rating={ratingsMap?.[p.id]}
                onAddToCart={() => addToCart(p)}
                isFav={wishlist.has(p.id)}
                onToggleFav={() => wishlist.toggle(p)}
                onViewDetails={() => navigate(`/product/${p.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <FloatingContactButton />
      <BackToTop />
    </div>
  );
}
