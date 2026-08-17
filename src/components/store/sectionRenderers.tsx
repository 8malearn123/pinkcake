import type { ReactNode } from 'react';
import { Marquee } from '@/components/store/StorefrontDecor';
import { StoreHero } from '@/components/store/StoreHero';
import { CustomCakeSection } from '@/components/store/CustomCakeSection';
import { SeasonalSection } from '@/components/store/SeasonalSection';
import { ShopByOccasion, FAQ } from '@/components/store/StorefrontSections';
import { ShopGridSection } from '@/components/store/ShopGridSection';
import { CombosSection } from '@/components/store/CombosSection';
import { Reviews } from '@/components/store/Reviews';
import { EventsSection } from '@/components/store/EventsSection';
import { BranchesSection } from '@/components/store/BranchesSection';
import { GiftBox } from '@/components/store/GiftBox';
import { OfferBanner } from '@/components/store/OfferBanner';
import type { SectionContent } from '@/lib/homepage/schema';
import type { CtaTarget, SectionKey } from '@/lib/homepage/types';
import type { ResolvedCombo } from '@/lib/combos';
import type { GalleryCake } from '@/lib/cakeSelect';
import type { StoreProduct } from '@/hooks/useCustomerStore';

/**
 * كل ما يحتاجه رسم قسم واحد من خارج محتواه المُحرَّر.
 *
 * الحقول مجمّعة في كائن واحد لأن الأقسام تختلف فيما تحتاجه اختلافاً حقيقياً
 * (المنتجات، الباقات، الكيكات، دوال التنقّل)، ولا خريطة `key → component`
 * بسيطة تكفي.
 */
export interface SectionRenderContext {
  contentOf: <K extends SectionKey>(key: K) => SectionContent[K];
  /** المنتجات بعد التصفية والترتيب — ما تعرضه شبكة «تسوق التورتات». */
  listed: StoreProduct[];
  categories: string[];
  category: string;
  onCategoryChange: (category: string) => void;
  query: string;
  seasonal: StoreProduct[];
  combos: ResolvedCombo[];
  designCakes: GalleryCake[];
  catalogLoading: boolean;
  featured?: StoreProduct;
  storeName: string;
  /** الواجهة أول ما في المتن، فتُسحب لأعلى خلف الترويسة. */
  heroIsFirst: boolean;
  renderCard: (product: StoreProduct) => ReactNode;
  onCta: (target: CtaTarget) => void;
  onNavigate: (path: string) => void;
  onPickCake: (cakeId: string) => void;
  onViewFeatured: () => void;
  onAddCombo: (combo: ResolvedCombo) => void;
}

/**
 * مفتاح القسم → ما يُرسم، بمصدر واحد.
 *
 * يشترك فيه المتجر ومعاينة لوحة الإدارة عمداً: المعاينة تَعِد بأن ما يراه
 * المدير هو ما يراه الزبون، ونسختان من هذه الخريطة كانتا ستجعلان ذلك الوعد
 * كذباً في أول قسم يتغيّر في إحداهما دون الأخرى.
 *
 * والنوع `Record<SectionKey, …>` يفرض الشمول: قسم جديد في السجلّ لا يُترجم
 * إلى خطأ عند الرسم بل إلى خطأ في الترجمة.
 */
export function sectionRenderers(ctx: SectionRenderContext): Record<SectionKey, () => ReactNode> {
  return {
    // الأقسام الترويجية تقرأ نصّها من «التسويق» بنفسها عبر `useStorefrontPromos`،
    // فلا محتوى يُمرَّر إليها من هنا — انظر `managedBy` في السجلّ.
    marquee: () => <Marquee />,

    hero: () => (
      <div className={ctx.heroIsFirst ? '-mt-16 md:-mt-[84px]' : ''}>
        <StoreHero
          content={ctx.contentOf('hero')}
          onCta={ctx.onCta}
          featured={ctx.featured}
          onViewFeatured={ctx.onViewFeatured}
        />
      </div>
    ),

    customCake: () => (
      <CustomCakeSection
        content={ctx.contentOf('customCake')}
        cakes={ctx.designCakes}
        loading={ctx.catalogLoading}
        onPick={ctx.onPickCake}
        onCta={ctx.onCta}
      />
    ),

    seasonal: () => <SeasonalSection products={ctx.seasonal} renderCard={ctx.renderCard} />,

    offerBanner: () => (
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <OfferBanner onShop={() => ctx.onCta('#shop')} />
      </div>
    ),

    occasions: () => <ShopByOccasion content={ctx.contentOf('occasions')} onCta={ctx.onCta} />,

    shop: () => (
      <ShopGridSection
        content={ctx.contentOf('shop')}
        products={ctx.listed}
        categories={ctx.categories}
        category={ctx.category}
        onCategoryChange={ctx.onCategoryChange}
        query={ctx.query}
        onViewAll={() => ctx.onNavigate('/shop')}
        renderCard={ctx.renderCard}
      />
    ),

    combos: () => (
      <CombosSection
        content={ctx.contentOf('combos')}
        combos={ctx.combos}
        onAddCombo={ctx.onAddCombo}
      />
    ),

    reviews: () => <Reviews content={ctx.contentOf('reviews')} />,

    events: () => (
      <EventsSection content={ctx.contentOf('events')} onStart={() => ctx.onNavigate('/events')} />
    ),

    branches: () => <BranchesSection content={ctx.contentOf('branches')} />,

    faq: () => <FAQ content={ctx.contentOf('faq')} />,

    giftBox: () => <GiftBox storeName={ctx.storeName} />,
  };
}
