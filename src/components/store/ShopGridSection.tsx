import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { CardRail } from '@/components/store/CardRail';
import { GoldDivider } from '@/components/store/StorefrontDecor';
import { SECTION_DEFAULTS, type SectionContent } from '@/lib/homepage/schema';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface ShopGridSectionProps {
  content?: SectionContent['shop'];
  products: StoreProduct[];
  categories: string[];
  category: string;
  onCategoryChange: (category: string) => void;
  /** نصّ البحث الحالي — يُستخدم في رسالة «لا توجد نتائج» فقط. */
  query: string;
  onViewAll: () => void;
  renderCard: (product: StoreProduct) => ReactNode;
}

/**
 * شبكة «تسوق التورتات». كانت مكتوبة داخل `Store.tsx` مباشرة، فاستُخرجت كي
 * تشارك في سجلّ الأقسام مثل بقيّتها.
 *
 * الفاصل الذهبي انتقل إلى داخلها: كان يقف في موضع ثابت أعلى الشبكة، وترتيب
 * الأقسام صار قابلاً للتغيير — ففاصل معلّق في الهواء بين قسمين آخرين لا معنى له.
 */
export function ShopGridSection({
  content = SECTION_DEFAULTS.shop,
  products,
  categories,
  category,
  onCategoryChange,
  query,
  onViewAll,
  renderCard,
}: ShopGridSectionProps) {
  return (
    <>
      <GoldDivider />

      <section id="shop" className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <Reveal className="flex flex-col justify-between gap-5 border-b border-primary/15 pb-6 sm:flex-row sm:items-end">
          <div>
            {content.eyebrow && (
              <p className="text-xs font-bold tracking-[.08em] text-rose">{content.eyebrow}</p>
            )}
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.01em] text-foreground sm:text-4xl">
              {content.title}
            </h2>
          </div>
          {/* `whitespace-pre-line` كي تبقى فواصل الأسطر التي يكتبها المدير */}
          {content.note && (
            <p className="whitespace-pre-line text-xs leading-6 text-muted-foreground">{content.note}</p>
          )}
        </Reveal>

        <div className="flex flex-col justify-between gap-4 border-b border-primary/10 py-5 md:flex-row md:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => onCategoryChange(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === item ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-blush-deep'}`}
              >
                {item}
              </button>
            ))}
          </div>
          {/* Hands off to the full catalogue, where sorting and filtering live */}
          <button
            onClick={onViewAll}
            className="group/more flex shrink-0 items-center gap-2 self-start rounded-full border border-primary/25 px-5 py-2 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-blush md:self-auto"
          >
            {content.ctaLabel}
            <ArrowLeft size={15} className="transition-transform duration-300 group-hover/more:-translate-x-1" />
          </button>
        </div>

        {products.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            لا توجد نتائج لـ «{query}». جرّب كلمة أخرى.
          </p>
        ) : (
          <CardRail className="mt-8 sm:mt-9 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => renderCard(product))}
          </CardRail>
        )}
      </section>
    </>
  );
}
