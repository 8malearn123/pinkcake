import { CheckCircle2, Clock, ChefHat, Send, User, CreditCard, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types/order';

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'rejected';
}

interface CustomOrderStatusTimelineProps {
  currentStatus: OrderStatus;
}

const getTimelineSteps = (currentStatus: OrderStatus): TimelineStep[] => {
  const steps: TimelineStep[] = [
    { id: 'created', label: 'تم الإنشاء', icon: <Clock className="w-4 h-4" />, status: 'pending' },
    { id: 'sent_to_chef', label: 'أُرسل للشيف', icon: <Send className="w-4 h-4" />, status: 'pending' },
    { id: 'chef_priced', label: 'تم التسعير', icon: <ChefHat className="w-4 h-4" />, status: 'pending' },
    { id: 'pricing_sent', label: 'أُرسل للعميل', icon: <Send className="w-4 h-4" />, status: 'pending' },
    { id: 'customer_response', label: 'رد العميل', icon: <User className="w-4 h-4" />, status: 'pending' },
    { id: 'payment', label: 'الدفع', icon: <CreditCard className="w-4 h-4" />, status: 'pending' },
    { id: 'preparing', label: 'قيد التجهيز', icon: <ChefHat className="w-4 h-4" />, status: 'pending' },
  ];

  // Determine which steps are completed based on current status
  const statusOrder = [
    'custom_pending_review',
    'sent_to_chef',
    'chef_priced',
    'pricing_sent_to_customer',
    'customer_accepted',
    'awaiting_payment',
    'paid',
    'preparing',
    'ready_to_ship',
    'completed',
  ];

  const rejectedStatuses = ['custom_rejected', 'customer_rejected'];
  const isRejected = rejectedStatuses.includes(currentStatus);

  if (isRejected) {
    // Mark all steps up to rejection point
    const rejectionStep = currentStatus === 'custom_rejected' ? 2 : 4;
    return steps.map((step, index) => {
      if (index < rejectionStep) {
        return { ...step, status: 'completed' as const };
      } else if (index === rejectionStep) {
        return { ...step, status: 'rejected' as const, icon: <XCircle className="w-4 h-4" /> };
      }
      return step;
    });
  }

  const currentIndex = statusOrder.indexOf(currentStatus);
  
  // Map status index to step index
  const statusToStepMap: Record<number, number> = {
    0: 0, // custom_pending_review -> created
    1: 1, // sent_to_chef -> sent_to_chef
    2: 2, // chef_priced -> chef_priced
    3: 3, // pricing_sent_to_customer -> pricing_sent
    4: 4, // customer_accepted -> customer_response
    5: 5, // awaiting_payment -> payment (in progress)
    6: 5, // paid -> payment (completed)
    7: 6, // preparing -> preparing
    8: 6, // ready_to_ship
    9: 6, // completed
  };

  const activeStepIndex = statusToStepMap[currentIndex] ?? 0;

  return steps.map((step, index) => {
    if (index < activeStepIndex) {
      return { ...step, status: 'completed' as const };
    } else if (index === activeStepIndex) {
      return { ...step, status: 'current' as const };
    }
    return step;
  });
};

export function CustomOrderStatusTimeline({ currentStatus }: CustomOrderStatusTimelineProps) {
  const steps = getTimelineSteps(currentStatus);

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative flex-1">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'absolute top-4 right-1/2 w-full h-0.5',
                  step.status === 'completed' ? 'bg-primary' : 'bg-muted'
                )}
                style={{ transform: 'translateX(50%)' }}
              />
            )}
            
            {/* Step Circle */}
            <div
              className={cn(
                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                step.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                step.status === 'current' && 'bg-primary/20 border-primary text-primary',
                step.status === 'pending' && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                step.status === 'rejected' && 'bg-destructive border-destructive text-destructive-foreground'
              )}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                step.icon
              )}
            </div>
            
            {/* Step Label */}
            <span
              className={cn(
                'mt-2 text-xs text-center font-medium',
                step.status === 'completed' && 'text-primary',
                step.status === 'current' && 'text-primary',
                step.status === 'pending' && 'text-muted-foreground',
                step.status === 'rejected' && 'text-destructive'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
