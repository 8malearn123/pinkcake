import { useOrderLogsWithUser } from '@/hooks/useOrderNotes';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OrderActivityLogProps {
  orderId: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'إنشاء الطلب', color: 'bg-info/10 text-info' },
  status_changed: { label: 'تغيير الحالة', color: 'bg-warning/10 text-warning' },
  transferred: { label: 'نقل الطلب', color: 'bg-primary/10 text-primary' },
  note_added: { label: 'إضافة ملاحظة', color: 'bg-success/10 text-success' },
  updated: { label: 'تحديث', color: 'bg-muted text-muted-foreground' },
};

export function OrderActivityLog({ orderId }: OrderActivityLogProps) {
  const { data: logs, isLoading } = useOrderLogsWithUser(orderId);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          سجل النشاط
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <History className="w-6 h-6 text-primary" />
        سجل النشاط
      </h2>
      
      {logs && logs.length > 0 ? (
        <div className="space-y-0">
          {logs.map((log, index) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20" />
                {index < logs.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border my-2" />
                )}
              </div>
              <div className="pb-6 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge className={ACTION_LABELS[log.action]?.color || 'bg-muted'}>
                    {ACTION_LABELS[log.action]?.label || log.action}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                  </div>
                </div>
                
                {log.description && (
                  <p className="text-sm text-foreground mb-2">{log.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{log.user_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {log.user_role}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          لا يوجد سجل نشاط بعد
        </p>
      )}
    </div>
  );
}
