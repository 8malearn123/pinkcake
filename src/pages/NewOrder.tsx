import { MainLayout } from '@/components/layout/MainLayout';
import { NewOrderForm } from '@/components/orders/NewOrderForm';
import { PageHeader } from '@/components/ds';
import { ArrowRight, FilePlus2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NewOrder() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/orders">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ms-2">
            <ArrowRight className="w-4 h-4 me-2" />
            العودة للطلبات
          </Button>
        </Link>

        <PageHeader
          title="إنشاء طلب جديد"
          description="أدخل بيانات الطلب الجديد"
          icon={FilePlus2}
        />

        <NewOrderForm />
      </div>
    </MainLayout>
  );
}
