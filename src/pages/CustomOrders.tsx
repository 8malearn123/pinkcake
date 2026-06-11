import { MainLayout } from '@/components/layout/MainLayout';
import { CustomOrderForm } from '@/components/orders/CustomOrderForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cake } from 'lucide-react';

export default function CustomOrders() {
  return (
    <MainLayout>
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex items-center gap-3">
          <Cake className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">طلب مخصص جديد</h1>
            <p className="text-muted-foreground">
              إنشاء طلب كيك أو حلويات مخصصة حسب طلب العميل
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>نموذج الطلب المخصص</CardTitle>
            <CardDescription>
              سيتم إرسال الطلب للمطبخ للمراجعة وتحديد السعر ووقت التحضير
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomOrderForm />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
