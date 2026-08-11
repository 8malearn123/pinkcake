import { MainLayout } from '@/components/layout/MainLayout';
import { NewOrderForm } from '@/components/orders/NewOrderForm';
import { PageHeader } from '@/components/ds';
import { ArrowRight, FilePlus2, PartyPopper, ChevronLeft } from 'lucide-react';
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

        {/* Hospitality packages are a different animal (guest counts, stations,
            servers) — hand them straight to the ضيافة builder instead of
            rebuilding them product by product here. */}
        <Link
          to="/orders/new-event"
          className="press group flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all hover:border-primary/40 hover:shadow-warm"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <PartyPopper className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-foreground">الطلب لمناسبة؟ جهّز ضيافة كاملة</span>
            <span className="block text-sm text-muted-foreground">
              عدد الضيوف والأصناف وركن الضيافة ومقدّمي الخدمة — مع تقدير سعر فوري
            </span>
          </span>
          <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>

        <NewOrderForm />
      </div>
    </MainLayout>
  );
}
