import { MainLayout } from '@/components/layout/MainLayout';
import { NewOrderForm } from '@/components/orders/NewOrderForm';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NewOrder() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/orders">
            <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4 me-2" />
              العودة للطلبات
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">إنشاء طلب جديد</h1>
          <p className="text-muted-foreground mt-1">أدخل بيانات الطلب الجديد</p>
        </div>

        <NewOrderForm />
      </div>
    </MainLayout>
  );
}
