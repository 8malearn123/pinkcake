import { Navigate, useSearchParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ds';
import { ProductsTab } from '@/components/products/ProductsTab';

export default function Products() {
  const [searchParams] = useSearchParams();

  /* «الكومبوهات» انتقلت إلى «التسويق»: هي أداة تسعير ترويجي لا إدخال كتالوج،
     ومكانها بجانب الكوبونات والإعلانات. الروابط القديمة تُحوَّل بدل أن تكسر. */
  if (searchParams.get('tab') === 'combos') {
    return <Navigate to="/marketing?tab=combos" replace />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="إدارة المنتجات"
          description="إضافة وتعديل وحذف الحلويات"
          icon={Package}
        />
        <ProductsTab />
      </div>
    </MainLayout>
  );
}
