import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Gift, Heart, Megaphone, Send, Sparkles, TicketPercent } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ds';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CombosTab } from '@/components/combos/CombosTab';
import { OverviewTab } from '@/components/marketing/OverviewTab';
import { CouponsTab } from '@/components/marketing/CouponsTab';
import { OffersTab } from '@/components/marketing/OffersTab';
import { CampaignsTab } from '@/components/marketing/CampaignsTab';
import { LoyaltyTab } from '@/components/marketing/LoyaltyTab';

/**
 * «التسويق» — كل أدوات النمو في مكان واحد.
 *
 * جُمعت هنا لأنها كانت موزّعة بلا منطق: الكوبونات في ملف تجريبي لا يملكها أحد،
 * ونصوص العروض مثبّتة في مكوّنات المتجر، والباقات مدفونة في تبويب داخل
 * «المنتجات»، وبرنامج الولاء في صفحة مستقلّة. القرار الذي يتّخذه المسوّق واحد
 * («ماذا نعرض هذا الأسبوع؟») فينبغي أن تكون أدواته في شاشة واحدة.
 */

type MarketingTab = 'overview' | 'coupons' | 'offers' | 'combos' | 'campaigns' | 'loyalty';

const TAB_VALUES: readonly MarketingTab[] = [
  'overview',
  'coupons',
  'offers',
  'combos',
  'campaigns',
  'loyalty',
];

function isMarketingTab(value: string | null): value is MarketingTab {
  return value !== null && (TAB_VALUES as readonly string[]).includes(value);
}

const TABS: { value: MarketingTab; label: string; icon: typeof Megaphone }[] = [
  { value: 'overview', label: 'نظرة عامة', icon: Sparkles },
  { value: 'coupons', label: 'الكوبونات', icon: TicketPercent },
  { value: 'offers', label: 'العروض والإعلانات', icon: Megaphone },
  { value: 'combos', label: 'الباقات', icon: Gift },
  { value: 'campaigns', label: 'الرسائل التسويقية', icon: Send },
  { value: 'loyalty', label: 'الولاء والإحالة', icon: Heart },
];

const DESCRIPTIONS: Record<MarketingTab, string> = {
  overview: 'أداء الكوبونات والحملات، وتقويم المواسم القادمة.',
  coupons: 'رموز الخصم التي يستخدمها العملاء في السلة.',
  offers: 'نصوص المتجر الترويجية والعروض الدائمة.',
  combos: 'باقات التوفير التي تظهر في الصفحة الرئيسية.',
  campaigns: 'رسائل واتساب والرسائل النصية للعميلات الموافقات.',
  loyalty: '«دائرة المناسبات» والإحالات.',
};

export default function Marketing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<MarketingTab>(() =>
    isMarketingTab(searchParams.get('tab')) ? (searchParams.get('tab') as MarketingTab) : 'overview',
  );

  /* التبويب مرآة لمعامل الاستعلام، فالرابط المباشر (أو زرّ الرجوع) يفتح
     التبويب الصحيح — ومعاملات الاستعلام لا تمسّ location.pathname، فتبقى
     إشارة القائمة الجانبية النشطة على /marketing كما هي. */
  useEffect(() => {
    const requested = searchParams.get('tab');
    if (requested === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, tab]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="التسويق" description={DESCRIPTIONS[tab]} icon={Megaphone} />

        {/* dir="rtl" لازم: Radix Tabs يفترض LTR فيقلب ترتيب الأزرار والمحتوى. */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as MarketingTab)} dir="rtl">
          {/* ستة تبويبات لا تتّسع في شبكة على ٣٦٠px — تمرير أفقي بدل التفافٍ
              يكسر الصفّ إلى سطرين. */}
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            <TabsList className="w-max">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-2 whitespace-nowrap">
                  <t.icon className="size-4" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab onNavigate={setTab} />
          </TabsContent>
          <TabsContent value="coupons" className="mt-6">
            <CouponsTab />
          </TabsContent>
          <TabsContent value="offers" className="mt-6">
            <OffersTab />
          </TabsContent>
          <TabsContent value="combos" className="mt-6">
            <CombosTab />
          </TabsContent>
          <TabsContent value="campaigns" className="mt-6">
            <CampaignsTab />
          </TabsContent>
          <TabsContent value="loyalty" className="mt-6">
            <LoyaltyTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
