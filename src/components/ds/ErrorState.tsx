import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * حالة الخطأ الموحّدة — تُعرض عند فشل التحميل، مع زر إعادة المحاولة (refetch).
 */
export function ErrorState({
  title = 'حدث خطأ أثناء التحميل',
  description = 'تعذّر جلب البيانات. تحقّق من اتصالك ثم أعد المحاولة.',
  onRetry,
  retryLabel = 'إعادة المحاولة',
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RotateCcw className="w-4 h-4 me-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
