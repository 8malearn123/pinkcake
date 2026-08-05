import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/delivery';
import type { StoreProduct } from '@/hooks/useCustomerStore';

interface ProductInfoTabsProps {
  product: StoreProduct;
}

/**
 * The "everything you'd ask a shop assistant" block: tabs on desktop, an
 * accordion on phones (where four tab labels would either wrap or truncate).
 *
 * Content is bakery-wide truth plus the product's own description — deliberately
 * not invented per-product specs, since the catalogue has no ingredient or
 * allergen fields. Delivery figures come from `lib/delivery` so this panel can
 * never quote a threshold the cart disagrees with.
 */
export function ProductInfoTabs({ product }: ProductInfoTabsProps) {
  const [active, setActive] = useState(0);

  const specs: [string, string][] = [
    ['الحجم', 'تكفي من ٨ إلى ١٢ شخصاً'],
    ['التحضير', 'تُخبز عند الطلب — جاهزة خلال ٢٤ ساعة'],
    ['التقديم', 'تُقدَّم باردة بعد ١٥ دقيقة خارج الثلاجة'],
    ['التغليف', 'علبة هدايا فاخرة + بطاقة تهنئة مجاناً'],
  ];
  if (product.category) specs.unshift(['التصنيف', product.category]);

  const TABS = [
    {
      label: 'التفاصيل',
      body: (
        <div className="space-y-5">
          <p className="text-[15px] leading-8 text-[#5f4d54]">
            {product.description ||
              'قطعة من مخبزنا في جازان، تُخبز بمكوّنات طازجة تصل مطبخنا كل صباح وتُزيَّن يدوياً قبل خروجها إليك مباشرة.'}
          </p>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {specs.map(([term, value]) => (
              <div key={term} className="flex items-baseline justify-between gap-4 border-b border-[#f3e8ec] pb-2.5">
                <dt className="shrink-0 text-xs font-bold text-[#b0506e]">{term}</dt>
                <dd className="text-end text-[13px] font-bold text-[#2c2226]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
    {
      label: 'المكوّنات والحساسية',
      body: (
        <div className="space-y-4 text-[15px] leading-8 text-[#5f4d54]">
          <p>
            نعتمد على مكوّنات طازجة تصل مخبزنا يومياً: زبدة طبيعية، بيض طازج، وحليب كامل الدسم — بلا دهون مهدرجة ولا
            ألوان صناعية.
          </p>
          <p>
            تحتوي وصفاتنا عادةً على <b className="text-[#2c2226]">القمح والبيض والحليب والسكر</b>، وقد تحتوي على آثار
            مكسرات لأنها تُحضَّر في المطبخ نفسه.
          </p>
          <p className="rounded-2xl bg-[#fbeef2] p-4 text-[14px] leading-7 text-[#8a3251]">
            عندك حساسية؟ نوفّر خياراتٍ خالية من المكسرات عند الطلب — اذكريها في ملاحظات الطلب عند إتمام الشراء ونجهّزها
            لك بعناية.
          </p>
        </div>
      ),
    },
    {
      label: 'الحفظ والتقديم',
      body: (
        <ul className="space-y-3.5 text-[15px] leading-8 text-[#5f4d54]">
          {[
            'احفظيها في الثلاجة فور الاستلام، وتُستهلك خلال ٤٨ ساعة لأفضل طعم.',
            'أخرجيها ١٥ دقيقة قبل التقديم حتى تعود الكريمة لقوامها الحريري.',
            'استخدمي سكيناً دافئة ونظيفة بين كل قطعة لقصّة مرتبة.',
            'لا تُعرَّض للشمس أو الحرارة المباشرة — الكريمة الطبيعية حسّاسة.',
          ].map((tip) => (
            <li key={tip} className="flex gap-3">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#ddbd75]" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: 'التوصيل والاسترجاع',
      body: (
        <div className="space-y-4 text-[15px] leading-8 text-[#5f4d54]">
          <p>
            توصيل مبرّد داخل جازان — صبيا وأبو عريش والمناطق المجاورة. الطلبات الجاهزة تصل في اليوم نفسه إذا طلبتِ قبل
            ٣ عصراً، والتصاميم الخاصة تحتاج من ٢٤ إلى ٤٨ ساعة.
          </p>
          <p>
            رسوم التوصيل{' '}
            <b className="inline-flex items-baseline gap-1 text-[#2c2226]">
              {toArabicDigits(DELIVERY_FEE)} <RiyalSymbol className="text-xs" />
            </b>
            ، ومجاناً لكل طلب يتجاوز{' '}
            <b className="inline-flex items-baseline gap-1 text-[#2c2226]">
              {toArabicDigits(FREE_DELIVERY_THRESHOLD)} <RiyalSymbol className="text-xs" />
            </b>
            . متاح أيضاً الاستلام من الفرع
            بلا رسوم.
          </p>
          <p>
            لأنها منتجات طازجة لا نستقبل إرجاعاً بعد الاستلام، لكن إذا وصلك الطلب غير مطابق أو متضرّر تواصلي معنا خلال
            ساعتين ونعوّضك كاملاً — بلا نقاش.
          </p>
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-3xl border border-[#f3e8ec] bg-[#fffdfa] p-5 shadow-[0_18px_50px_-38px_rgba(158,58,92,0.5)] sm:p-8">
      {/* Desktop: tabs */}
      <div role="tablist" className="hidden border-b border-[#f3e8ec] sm:flex sm:gap-1">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            aria-selected={active === i}
            role="tab"
            className={`-mb-px border-b-2 px-4 pb-3.5 pt-1 text-sm font-black transition-colors ${
              active === i
                ? 'border-[#9e3a5c] text-[#9e3a5c]'
                : 'border-transparent text-[#a08a92] hover:text-[#7d6870]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="hidden pt-6 sm:block">
        {TABS[Math.max(0, active)].body}
      </div>

      {/* Mobile: accordion */}
      <div className="divide-y divide-[#f3e8ec] sm:hidden">
        {TABS.map((tab, i) => (
          <div key={tab.label}>
            <button
              type="button"
              onClick={() => setActive(active === i ? -1 : i)}
              aria-expanded={active === i}
              className="flex w-full items-center justify-between gap-4 py-4 text-start"
            >
              <span className="text-sm font-black text-[#2c2226]">{tab.label}</span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-[#9e3a5c] transition-transform duration-300 ${active === i ? 'rotate-180' : ''}`}
              />
            </button>
            {active === i && <div className="pb-5">{tab.body}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
