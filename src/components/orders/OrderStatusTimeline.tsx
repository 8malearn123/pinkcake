import { OrderStatus, ORDER_STATUS_LABELS } from '@/types/order';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

const statusOrder: OrderStatus[] = [
  'pending_approval',
  'awaiting_payment',
  'paid',
  'preparing',
  'ready_to_ship',
  'in_transit',
  'ready_for_pickup',
  'completed',
];

export function OrderStatusTimeline({ currentStatus, className }: OrderStatusTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-between">
        {statusOrder.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={status} className="flex flex-col items-center flex-1">
              {/* Connector Line */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute h-1 top-5 -translate-y-1/2',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                  style={{
                    right: `calc(${((index - 1) / (statusOrder.length - 1)) * 100}% + 20px)`,
                    width: `calc(${100 / (statusOrder.length - 1)}% - 40px)`,
                  }}
                />
              )}
              
              {/* Status Circle */}
              <div
                className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/30 animate-pulse-slow',
                  isPending && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Circle className={cn('w-3 h-3', isCurrent && 'fill-current')} />
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  'mt-3 text-xs font-medium text-center max-w-[80px] leading-tight',
                  isCompleted && 'text-primary',
                  isCurrent && 'text-primary font-bold',
                  isPending && 'text-muted-foreground'
                )}
              >
                {ORDER_STATUS_LABELS[status]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
