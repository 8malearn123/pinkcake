import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useSettings } from '@/contexts/SettingsContext';
import { ProductCardRefined } from '@/components/store/ProductCardRefined';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { BackToTop } from '@/components/store/BackToTop';
import { Cake, ArrowRight, ShoppingCart, Heart, ShoppingBag, Trash2 } from 'lucide-react';

export default function Wishlist() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { items, count, clear, has, toggle } = useStoreWishlist();
  const { addToCart, count: cartCount, open: openCart } = useStoreCart();

  const ids = useMemo(() => items.map((p) => p.id), [items]);
  const { data: ratingsMap } = useProductRatings(ids);

  const addAll = () => items.forEach((p) => addToCart(p));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('/store')}
            aria-label="رجوع للمتجر"
            className="press w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 press group">
            <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center shadow-rose-glow text-primary-foreground transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
              <Cake className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <div className="font-display text-lg">{settings.storeName}</div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Patisserie</div>
            </div>
          </button>

          <button
            onClick={openCart}
            aria-label="عربة التسوق"
            className="press relative ms-auto rounded-full border border-border bg-card h-10 w-10 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="badge-pop absolute -top-1 -start-1 min-w-[20px] h-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-8 lg:py-10">
        {/* Title + bulk actions */}
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-primary tracking-widest uppercase font-medium">
              <Heart className="w-3.5 h-3.5" /> مفضّلاتك
            </div>
            <h1 className="font-display text-4xl md:text-5xl mt-1 leading-none">المفضلة</h1>
            {count > 0 && <p className="text-sm text-muted-foreground mt-2">{count} منتج محفوظ</p>}
          </div>
          {count > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={addAll}
                className="press inline-flex items-center gap-2 rounded-full h-11 px-5 bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> أضيفي الكل للعربة
              </button>
              <button
                onClick={clear}
                className="press inline-flex items-center gap-2 rounded-full h-11 px-4 border border-border bg-card text-muted-foreground text-sm hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> مسح الكل
              </button>
            </div>
          )}
        </div>

        {/* Empty state / grid */}
        {count === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-border/60 bg-secondary/30">
            <div className="w-20 h-20 mx-auto rounded-full bg-card flex items-center justify-center mb-5 shadow-soft-lift">
              <Heart className="w-9 h-9 text-primary" />
            </div>
            <h3 className="font-display text-3xl mb-2">لا توجد مفضلات بعد</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              اضغطي على القلب في أي منتج لحفظه هنا والعودة إليه لاحقاً.
            </p>
            <button
              onClick={() => navigate('/store')}
              className="press inline-flex items-center gap-2 rounded-full h-12 px-7 bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
            >
              تصفّحي المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {items.map((p) => (
              <ProductCardRefined
                key={p.id}
                product={p}
                rating={ratingsMap?.[p.id]}
                onAddToCart={() => addToCart(p)}
                isFav={has(p.id)}
                onToggleFav={() => toggle(p)}
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
