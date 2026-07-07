import { MainLayout } from '@/components/layout/MainLayout';
import { CustomOrderForm } from '@/components/orders/CustomOrderForm';
import { PageHeader } from '@/components/ds';
import { Cake } from 'lucide-react';

export default function CustomOrders() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl space-y-8 py-6">
        <PageHeader
          title="طلب مخصص جديد"
          description="إنشاء طلب كيك أو حلويات مخصصة حسب طلب العميل"
          icon={Cake}
        />

        <CustomOrderForm />
      </div>
    </MainLayout>
  );
}
