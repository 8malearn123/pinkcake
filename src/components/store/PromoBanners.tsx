import { ArrowLeft, Gift, Palette } from 'lucide-react';
import promoSlice from '@/assets/promo-slice.jpg';
import hero2 from '@/assets/hero-cake-2.jpg';

interface PromoBannersProps {
  onCustomize: () => void;
  onShop: () => void;
}

export function PromoBanners({ onCustomize, onShop }: PromoBannersProps) {
  return (
    <section className="grid md:grid-cols-3 gap-4">
      {/* Big banner */}
      <button
        onClick={onCustomize}
        className="group relative md:col-span-2 overflow-hidden rounded-3xl bg-gradient-to-bl from-primary/90 via-primary to-accent text-primary-foreground p-7 md:p-9 text-start shadow-soft-lift min-h-[200px]"
      >
        <div className="absolute -bottom-8 -end-8 w-56 h-56 rounded-full bg-background/10 blur-2xl" />
        <div className="absolute top-4 end-4 noise-overlay opacity-30 inset-0" />
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/20 backdrop-blur text-xs">
            <Palette className="w-3.5 h-3.5" />
            <span>استوديو التصميم</span>
          </div>
          <h3 className="font-display text-3xl md:text-4xl mt-3 leading-tight">
            صمّم كيكتك خطوة بخطوة
          </h3>
          <p className="mt-2 text-sm md:text-base opacity-90 leading-relaxed">
            اختر الشكل والنكهات والألوان، وشاهد معاينة ثلاثية الأبعاد قبل الطلب.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 font-medium text-sm group-hover:gap-3 transition-all">
            ابدأي التصميم
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>
        <img
          src={promoSlice}
          alt=""
          className="absolute -bottom-6 -start-6 w-44 h-44 md:w-56 md:h-56 object-contain opacity-80 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </button>

      {/* Side banner */}
      <button
        onClick={onShop}
        className="group relative overflow-hidden rounded-3xl bg-card border border-border/60 p-6 text-start shadow-soft-lift min-h-[200px]"
      >
        <img
          src={hero2}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
            <Gift className="w-3.5 h-3.5" />
            <span>عرض الموسم</span>
          </div>
          <h3 className="font-display text-2xl mt-3 leading-tight">
            علبة كاب كيك بـ 12 قطعة
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            مزينة بالكريمة الفاخرة ورقائق الذهب.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
            تسوّق الآن
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>
      </button>
    </section>
  );
}
