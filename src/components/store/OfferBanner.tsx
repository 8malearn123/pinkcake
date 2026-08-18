import { Gift, Truck, ArrowLeft } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { useStorefrontPromos } from '@/hooks/useStorefrontPromos';

interface OfferBannerProps {
  onShop: () => void;
}

/**
 * شريط العرض الترويجي — محتواه من «التسويق» ← خانة «بانر العرض».
 *
 * سطر التوصيل المجاني يقرأ العتبة الحيّة لا رقماً مكتوباً: هذا البانر ومقياس
 * السلة وصفحة المنتج كانت ثلاثتها تعلن «فوق ٢٠٠» من ثلاثة مصادر، فتغيير
 * العتبة كان يكذّب اثنين منها.
 *
 * لا عدّاد تنازلي ولا رمز مُختلَق — قيمة حقيقية فقط.
 */
export function OfferBanner({ onShop }: OfferBannerProps) {
  const { slot, offers } = useStorefrontPromos();
  const promo = slot('offer_banner');

  if (!offers.showOfferBanner || !promo) return null;

  return (
    <section className="rounded-[2rem] gradient-cocoa text-white overflow-hidden relative shadow-soft-lift">
      <div className="absolute inset-0 noise-overlay opacity-25 pointer-events-none" />
      <div
        className="absolute -top-16 -end-10 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / .3), transparent 70%)' }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-start sm:px-10">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full gradient-pink text-primary-foreground shadow-rose-glow">
            <Gift className="w-6 h-6" />
          </span>
          <div>
            {promo.eyebrow && (
              <p className="text-xs font-bold tracking-[.08em] text-gold">{promo.eyebrow}</p>
            )}
            <h3 className="font-display mt-1 text-xl sm:text-2xl leading-tight">{promo.title}</h3>
            <div className="mt-1 flex flex-col items-center gap-1 text-xs text-white/70 sm:items-start">
              {promo.subtitle && <p>{promo.subtitle}</p>}
              <p className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-gold" /> توصيل مجاني للطلبات فوق{' '}
                {toArabicDigits(offers.freeDeliveryThreshold)} <RiyalSymbol />
              </p>
            </div>
            {promo.couponCode && (
              <span className="mt-3 inline-block rounded-xl border-2 border-dashed border-gold px-5 py-2 text-base font-semibold tracking-[.2em] text-gold">
                <bdi dir="ltr">{promo.couponCode}</bdi>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onShop}
          className="group press sheen inline-flex items-center gap-2 rounded-full bg-white px-7 h-12 text-sm font-bold text-foreground shadow-lg transition-transform"
        >
          {promo.ctaLabel || 'تسوّقي الآن'}{' '}
          <ArrowLeft className="cta-arrow w-4 h-4 text-primary" />
        </button>
      </div>
    </section>
  );
}
