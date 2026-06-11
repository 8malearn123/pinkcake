import { MainLayout } from '@/components/layout/MainLayout';
import { PickupScanner } from '@/components/branch/PickupScanner';
import { useMyBranch } from '@/hooks/useMyRoles';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, QrCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BranchPickupScanner() {
  const { data: myBranch, isLoading } = useMyBranch();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!myBranch) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto">
          <Card className="border-destructive/30">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold text-destructive">
                لا يمكن الوصول
              </h2>
              <p className="text-muted-foreground">
                لم يتم تعيين فرع لحسابك. يرجى التواصل مع الإدارة.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <QrCode className="w-5 h-5" />
            <span className="font-medium">ماسح الاستلام</span>
          </div>
          <h1 className="text-2xl font-bold">مسح كود الاستلام</h1>
          <p className="text-muted-foreground">
            فرع: <span className="font-medium text-foreground">{myBranch.name}</span>
          </p>
        </div>

        <PickupScanner />
      </div>
    </MainLayout>
  );
}
