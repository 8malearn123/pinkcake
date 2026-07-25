import { Truck, Star, ArrowLeft } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';

interface StoreHeroProps {
  onShop: () => void;
  onCustomize: () => void;
}

// Faithful clone of the Cake & Bloom split hero (physical→logical RTL, no framer).
export function StoreHero({ onShop, onCustomize }: StoreHeroProps) {
  return (
    <section id="top" className="relative overflow-hidden border-b border-[#9e3a5c]/10 bg-gradient-to-b from-[#fdf4f7] to-[#fffdfa]">
      {/* Soft blush glow behind the copy for depth */}
      <div aria-hidden className="pointer-events-none absolute -top-24 start-0 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(221,189,117,0.12),transparent_68%)] blur-2xl" />
      <div className="relative mx-auto grid max-w-[1500px] overflow-hidden lg:grid-cols-[.95fr_1.05fr]">
        <div className="relative min-h-[390px] overflow-hidden bg-[#f2dbe2] lg:order-2 lg:min-h-[535px]">
          <img
            src="https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=1200&h=1000&q=88"
            alt="تورتة احتفال أنيقة"
            width={1200}
            height={1000}
            loading="eager"
            decoding="async"
            className="store-hero-img size-full object-cover"
          />
          {/* Depth scrim — warms the corners and makes the floating cards pop */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#2c2226]/28 via-transparent to-[#9e3a5c]/12" />
          <div className="absolute bottom-6 end-6 rounded-lg border border-white/60 bg-[#fffdfa]/95 p-4 shadow-[0_22px_50px_-22px_rgba(44,34,38,0.55)] backdrop-blur-sm sm:bottom-9 sm:end-9">
            <p className="text-[10px] font-bold tracking-[.12em] text-[#b0506e]">اختيار هذا الأسبوع</p>
            <p className="mt-1 text-sm font-extrabold">تورتة الشوكولاتة الفاخرة</p>
            <p className="mt-1 flex items-baseline gap-1 text-xs text-[#7d6870]">من ٢٢٠ <RiyalSymbol className="text-[10px]" /></p>
          </div>
          <div className="absolute end-6 top-6 grid size-20 -rotate-[8deg] place-items-center rounded-full bg-[#ddbd75] text-center text-[#9e3a5c] shadow-[0_14px_30px_-10px_rgba(158,58,92,0.5)] ring-4 ring-white/40 sm:end-9 sm:top-9">
            <span className="text-[10px] font-bold leading-tight">صُنع<br />بحُب في<br />جازان</span>
          </div>
        </div>
        <div className="store-hero-stagger flex flex-col justify-center px-6 py-16 sm:px-12 lg:order-1 lg:px-20">
          <p className="text-xs font-bold tracking-[.08em] text-[#b0506e]">حلويات تُخبز يومياً في جازان</p>
          <h1 className="mt-4 max-w-xl text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[1.12] tracking-[-.01em] text-[#2c2226]">
            كل مناسبة تستحق كيكة مميزة.
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-8 text-[#6f5b62] sm:text-base">
            تورتات طازجة بتصاميم أنيقة ونكهات يحبها الجميع. اختر تورتتك، حدد موعد التوصيل، وخلي الاحتفال علينا.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onShop} className="group/cta flex items-center gap-2 rounded-xl bg-gradient-to-t from-[#8a3251] to-[#9e3a5c] px-7 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_-12px_rgba(158,58,92,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#9e3a5c] hover:to-[#b0506e] hover:shadow-[0_20px_38px_-12px_rgba(176,80,110,0.9)]">
              تسوق التورتات
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover/cta:-translate-x-1" />
            </button>
            <button onClick={onCustomize} className="rounded-xl border border-[#9e3a5c] px-6 py-3.5 text-sm font-bold text-[#9e3a5c] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_28px_-16px_rgba(158,58,92,0.6)]">
              صمم تورتة خاصة
            </button>
          </div>
          <div className="mt-9 flex flex-wrap gap-5 text-xs font-bold text-[#6f5b62]">
            <span className="flex items-center gap-2"><Truck size={18} className="text-[#b0506e]" /> توصيل في نفس اليوم</span>
            <span className="flex items-center gap-1"><Star size={16} fill="#ddbd75" strokeWidth={0} /> ٤٫٩ من ١٢٠٠+ تقييم</span>
          </div>
        </div>
      </div>
    </section>
  );
}
