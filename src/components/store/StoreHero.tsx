import { Truck, Star, ArrowLeft } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';

interface StoreHeroProps {
  onShop: () => void;
  onCustomize: () => void;
}

/**
 * Full-bleed hero — an edge-to-edge cake photograph with the copy set over it.
 * Legibility comes from a flat tint plus a vertical scrim (both direction-neutral,
 * so nothing needs to flip under RTL); every positioned overlay uses logical
 * utilities. Motion reuses the shared, reduced-motion-gated hero classes.
 */
export function StoreHero({ onShop, onCustomize }: StoreHeroProps) {
  return (
    <section id="top" className="relative isolate min-h-[590px] overflow-hidden bg-[#2c2226] lg:min-h-[730px]">
      <img
        src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=2000&h=1200&q=85"
        alt="كيكة شوكولاتة فاخرة بصوص الغاناش"
        width={2000}
        height={1200}
        loading="eager"
        decoding="async"
        className="store-hero-img absolute inset-0 size-full object-cover"
      />

      {/* Scrims — flat tint for overall legibility, vertical wash to ground the base */}
      <div aria-hidden className="absolute inset-0 bg-[#2c2226]/55" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#2c2226]/90 via-[#2c2226]/25 to-[#2c2226]/60" />

      {/* Gold seal */}
      <div className="absolute end-6 top-[calc(84px+1.5rem)] z-10 hidden size-20 -rotate-[8deg] place-items-center rounded-full bg-[#ddbd75] text-center text-[#9e3a5c] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.55)] ring-4 ring-white/25 sm:end-10 sm:grid">
        <span className="text-[10px] font-bold leading-tight">صُنع<br />بحُب في<br />جازان</span>
      </div>

      {/* Copy */}
      <div className="relative z-10 mx-auto flex min-h-[590px] max-w-[1500px] flex-col justify-center px-6 pb-20 pt-[calc(4rem+5rem)] sm:px-12 md:pt-[calc(84px+5rem)] lg:min-h-[730px] lg:px-20">
        <div className="store-hero-stagger max-w-2xl">
          <p className="flex items-center gap-2.5 text-xs font-bold tracking-[.14em] text-[#ddbd75]">
            <span className="h-px w-9 bg-[#ddbd75]/60" /> حلويات تُخبز يومياً في جازان
          </p>
          <h1 className="mt-5 text-[clamp(2.9rem,6vw,5.8rem)] font-black leading-[1.08] tracking-[-.01em] text-white">
            كل مناسبة تستحق كيكة مميزة.
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-8 text-white/75 sm:text-base">
            تورتات طازجة بتصاميم أنيقة ونكهات يحبها الجميع. اختر تورتتك، حدد موعد التوصيل، وخلي الاحتفال علينا.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              onClick={onShop}
              className="group/cta flex items-center gap-2 rounded-xl bg-[#ddbd75] px-7 py-4 text-sm font-black text-[#5e2137] shadow-[0_18px_38px_-14px_rgba(0,0,0,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
            >
              تسوق التورتات
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover/cta:-translate-x-1" />
            </button>
            <button
              onClick={onCustomize}
              className="rounded-xl border border-white/45 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
            >
              صمم تورتة خاصة
            </button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-xs font-bold text-white/80">
            <span className="flex items-center gap-2"><Truck size={18} className="text-[#ddbd75]" /> توصيل في نفس اليوم</span>
            <span className="flex items-center gap-1.5"><Star size={16} fill="#ddbd75" strokeWidth={0} /> ٤٫٩ من ١٢٠٠+ تقييم</span>
          </div>
        </div>
      </div>

      {/* Featured pick — kept off the copy side, hidden on the narrowest screens */}
      <div className="absolute bottom-8 end-6 z-10 hidden rounded-xl border border-white/15 bg-[#2c2226]/70 p-4 shadow-[0_22px_50px_-22px_rgba(0,0,0,0.8)] backdrop-blur-md sm:block sm:end-10 lg:bottom-12">
        <p className="text-[10px] font-bold tracking-[.12em] text-[#ddbd75]">اختيار هذا الأسبوع</p>
        <p className="mt-1 text-sm font-extrabold text-white">تورتة الشوكولاتة الفاخرة</p>
        <p className="mt-1 flex items-baseline gap-1 text-xs text-white/65">من ٢٢٠ <RiyalSymbol className="text-[10px]" /></p>
      </div>
    </section>
  );
}
