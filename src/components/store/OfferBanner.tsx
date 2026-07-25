import { Gift, Truck, ArrowLeft } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';

interface OfferBannerProps {
  onShop: () => void;
}

/**
 * A calm promotional band stating the two REAL offers (free delivery over 200,
 * 10% off the first order). No countdown or fabricated code — honest value only.
 */
export function OfferBanner({ onShop }: OfferBannerProps) {
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
            <p className="text-xs font-bold tracking-[.08em] text-primary">عروضنا الدائمة</p>
            <h3 className="font-display mt-1 text-xl sm:text-2xl leading-tight">خصم 10٪ على أوّل طلب + توصيلٌ مجاني</h3>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-white/70 sm:justify-start">
              <Truck className="w-3.5 h-3.5 text-primary" /> توصيل مجاني للطلبات فوق 200 <RiyalSymbol />
            </p>
          </div>
        </div>
        <button
          onClick={onShop}
          className="group press sheen inline-flex items-center gap-2 rounded-full bg-white px-7 h-12 text-sm font-bold text-foreground shadow-lg transition-transform"
        >
          تسوّقي الآن <ArrowLeft className="cta-arrow w-4 h-4 text-primary" />
        </button>
      </div>
    </section>
  );
}
