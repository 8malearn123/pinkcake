import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eyebrow, Lede, Section, Title } from '@/components/ds';
import { Reveal } from '@/components/Reveal';
import { StoreProductCard } from '@/components/store/StoreProductCard';
import { ProductReviewDialog } from '@/components/store/ProductReviewDialog';
import { useStoreCart } from '@/contexts/StoreCartContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useComplementSuggestions } from '@/hooks/useComplementSuggestions';
import { useProductRatings } from '@/hooks/useProductRatings';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import type { MomentStage } from '@/lib/orders/customerMoment';

/**
 * The tail that keeps the shopping journey alive.
 *
 * A post-purchase page that ends at the total is a dead end; this turns it back
 * into a shop entrance. Real StoreProductCards with working add-to-cart — all
 * three routes sit inside StorefrontLayout (StoreCartProvider +
 * StoreWishlistProvider + a globally mounted CartSheet), so this works for
 * guests on /track too.
 *
 * Exactly ONE dark band per page, and it lives here — the hero stays light.
 */
export function KeepShoppingBand({
  context,
  excludeIds,
  stage,
  reviewProduct,
  className,
}: {
  context: StoreProduct[];
  excludeIds?: string[];
  stage: MomentStage;
  /** Non-null only for a collected order with a matched product (auth-only dialog). */
  reviewProduct?: StoreProduct | null;
  className?: string;
}) {
  const navigate = useNavigate();
  const { addToCart, updateQuantity, cart } = useStoreCart();
  const wishlist = useStoreWishlist();
  const [reviewOpen, setReviewOpen] = useState(false);

  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const suggestions = useComplementSuggestions({ context, excludeIds: exclude, limit: 4 });
  const suggestionIds = useMemo(() => suggestions.map((p) => p.id), [suggestions]);
  const { data: ratingsMap } = useProductRatings(suggestionIds);

  const qtyOf = (id: string) => cart.find((i) => i.product.id === id)?.quantity ?? 0;
  const askForReview = stage === 'done' && !!reviewProduct;

  return (
    <div className={className}>
      {suggestions.length > 0 && (
        <Section variant="list" width="wide" className="pt-0">
          <Eyebrow>تحلو معها</Eyebrow>
          <Title variant="h2" className="mt-2">
            أضف لحظة حلوة ثانية
          </Title>
          <Reveal className="reveal-grid mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {suggestions.map((p) => (
              <StoreProductCard
                key={p.id}
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
          </Reveal>
        </Section>
      )}

      <Section variant="list" width="wide" className="pt-0">
        <div className="gradient-berry-deep relative overflow-hidden rounded-2xl p-8 text-white sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -end-10 size-56 rounded-full bg-gold/15 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -start-8 size-52 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative">
            <Eyebrow tone="dark" rule caps>
              {askForReview ? 'رأيك يهمّنا' : 'استمر معنا'}
            </Eyebrow>
            <Title tone="dark" className="mt-3">
              {askForReview ? 'عجبتكم؟ احكِ لنا' : 'باقي أشياء حلوة تنتظرك'}
            </Title>
            <Lede tone="dark" className="mt-3 max-w-lg">
              {askForReview
                ? 'تقييمك يساعد غيرك يختار، ويساعدنا نطوّر.'
                : 'اختر من الكيكات الجاهزة أو صمّم واحدة على ذوقك.'}
            </Lede>
            <Button
              variant="gold"
              size="cta"
              className="mt-6"
              onClick={() => (askForReview ? setReviewOpen(true) : navigate('/shop'))}
            >
              {askForReview ? 'قيّم تجربتك' : 'تصفّح المتجر'}
            </Button>
          </div>
        </div>
      </Section>

      {reviewProduct && (
        <ProductReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          productId={reviewProduct.id}
          productName={reviewProduct.name}
        />
      )}
    </div>
  );
}
