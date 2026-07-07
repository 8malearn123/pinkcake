import { MainLayout } from '@/components/layout/MainLayout';
import { PickupScanner } from '@/components/branch/PickupScanner';
import { useMyBranch } from '@/hooks/useMyRoles';
import { LoadingState, EmptyState } from '@/components/ds';
import { AlertCircle, QrCode } from 'lucide-react';

export default function BranchPickupScanner() {
  const { data: myBranch, isLoading } = useMyBranch();

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingState label="جاري التحميل..." />
      </MainLayout>
    );
  }

  if (!myBranch) {
    return (
      <MainLayout>
        <EmptyState
          icon={AlertCircle}
          title="لا يمكن الوصول"
          description="لم يتم تعيين فرع لحسابك. يرجى التواصل مع الإدارة."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-pink shadow-warm flex items-center justify-center">
            <QrCode className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ماسح الاستلام</h1>
            <p className="text-muted-foreground mt-1">
              فرع: <span className="font-medium text-foreground">{myBranch.name}</span>
            </p>
          </div>
        </div>

        <PickupScanner />
      </div>
    </MainLayout>
  );
}
