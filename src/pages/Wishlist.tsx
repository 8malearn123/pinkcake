import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useSettings } from '@/contexts/SettingsContext';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { Marquee } from '@/components/store/StorefrontDecor';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { BackToTop } from '@/components/store/BackToTop';
import { Eyebrow, Title } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export default function Wishlist() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { items, count, clear, has, toggle } = useStoreWishlist();
  const { addToCart, updateQuantity, cart, count: cartCount, open: openCart } = useStoreCart();
  const qtyOf = (id: string) => cart.find((i) => i.product.id === id)?.quantity ?? 0;

  const ids = useMemo(() => items.map((p) => p.id), [items]);
  const { data: ratingsMap } = useProductRatings(ids);

  const addAll = () => items.forEach((p) => addToCart(p));

  return (
    <div className="store-surface min-h-screen bg-background text-foreground">
      <Marquee />
      <StorefrontMasthead />

      <main className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        {/* Title + bulk actions */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-primary/15 pb-6">
          <div>
            <Eyebrow>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="size-3.5" /> مفضّلاتك
              </span>
            </Eyebrow>
            <Title variant="h2" as="h1" className="mt-2">
              المفضلة
            </Title>
            {count > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {toArabicDigits(count)} منتج محفوظ
              </p>
            )}
          </div>
          {count > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="brandFlat" size="pill" onClick={addAll}>
                <ShoppingBag className="size-4" /> أضِف الكل للعربة
              </Button>
              <Button
                variant="outline"
                size="pill"
                onClick={clear}
                className="text-muted-foreground hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="size-4" /> مسح الكل
              </Button>
            </div>
          )}
        </div>

        {/* Empty state / grid */}
        {count === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-blush/40 py-20 text-center">
            <div className="shadow-berry-soft mx-auto mb-5 grid size-20 place-items-center rounded-full bg-background">
              <Heart className="size-9 text-primary" />
            </div>
            <Title variant="h3" as="h3" className="mb-2 text-2xl">
              لا توجد مفضلات بعد
            </Title>
            <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
              اضغط على القلب في أي منتج لحفظه هنا والعودة إليه لاحقاً.
            </p>
            <Button variant="brand" size="pill" onClick={() => navigate('/shop')}>
              تصفّح المنتجات
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <StoreProductCard
                key={p.id}
                product={p}
                rating={ratingsMap?.[p.id]}
                inCart={qtyOf(p.id)}
                isFavorite={has(p.id)}
                onAdd={() => addToCart(p)}
                onRemoveOne={() => updateQuantity(p.id, -1)}
                onToggleFavorite={() => toggle(p)}
                onView={() => navigate(`/product/${p.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} />

      <FloatingContactButton />
      <BackToTop />
    </div>
  );
}
