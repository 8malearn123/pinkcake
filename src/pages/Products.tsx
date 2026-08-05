import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Gift, Package } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ds';
import { ProductsTab } from '@/components/products/ProductsTab';
import { CombosTab } from '@/components/combos/CombosTab';

type ProductsPageTab = 'products' | 'combos';

const TAB_VALUES: readonly ProductsPageTab[] = ['products', 'combos'];

function isPageTab(value: string | null): value is ProductsPageTab {
  return value !== null && (TAB_VALUES as readonly string[]).includes(value);
}

const HEADERS: Record<ProductsPageTab, { title: string; description: string; icon: typeof Package }> = {
  products: {
    title: 'إدارة المنتجات',
    description: 'إضافة وتعديل وحذف الحلويات',
    icon: Package,
  },
  combos: {
    title: 'إدارة الكومبوهات',
    description: 'باقات التوفير التي تظهر في الصفحة الرئيسية',
    icon: Gift,
  },
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<ProductsPageTab>(() =>
    isPageTab(searchParams.get('tab')) ? (searchParams.get('tab') as ProductsPageTab) : 'products',
  );

  /* The tab is mirrored to the query string so a deep link (or a browser back)
     lands on the right one. Search params never touch location.pathname, so the
     sidebar's exact-match active state for /products is unaffected. */
  useEffect(() => {
    const requested = searchParams.get('tab');
    if (requested === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, tab]);

  const header = HEADERS[tab];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title={header.title} description={header.description} icon={header.icon} />

        <Tabs value={tab} onValueChange={(value) => setTab(value as ProductsPageTab)}>
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="size-4" /> المنتجات
            </TabsTrigger>
            <TabsTrigger value="combos" className="gap-2">
              <Gift className="size-4" /> الكومبوهات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="combos" className="mt-6">
            <CombosTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
