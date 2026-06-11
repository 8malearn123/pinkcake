import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryCountdownProps {
  deliveryDate: string | null;
  deliveryTime: string | null;
  status: string;
  compact?: boolean;
}

export function DeliveryCountdown({ deliveryDate, deliveryTime, status, compact = false }: DeliveryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!deliveryDate || !deliveryTime || status === 'completed') {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
      const now = new Date();
      const difference = deliveryDateTime.getTime() - now.getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deliveryDate, deliveryTime, status]);

  if (status === 'completed') {
    return (
      <div className={cn(
        'flex items-center gap-1.5 text-emerald-600',
        compact ? 'text-xs' : 'text-sm'
      )}>
        <CheckCircle2 className={cn(compact ? 'w-3 h-3' : 'w-4 h-4')} />
        <span>تم التسليم</span>
      </div>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const isOverdue = timeLeft.total <= 0;
  const isUrgent = !isOverdue && timeLeft.total < 2 * 60 * 60 * 1000; // Less than 2 hours
  const isWarning = !isOverdue && !isUrgent && timeLeft.total < 6 * 60 * 60 * 1000; // Less than 6 hours

  const getStatusColor = () => {
    if (isOverdue) return 'text-red-600 bg-red-50';
    if (isUrgent) return 'text-orange-600 bg-orange-50';
    if (isWarning) return 'text-amber-600 bg-amber-50';
    return 'text-primary bg-primary/10';
  };

  const formatTimeUnit = (value: number, unit: string) => {
    return `${value} ${unit}`;
  };

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        getStatusColor()
      )}>
        {isOverdue ? (
          <>
            <AlertTriangle className="w-3 h-3" />
            <span>متأخر</span>
          </>
        ) : (
          <>
            <Clock className="w-3 h-3" />
            <span className="font-mono">
              {timeLeft.days > 0 && `${timeLeft.days}ي `}
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg',
      getStatusColor()
    )}>
      {isOverdue ? (
        <>
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">تجاوز موعد التسليم</span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4" />
          <div className="flex items-center gap-1">
            <span className="text-sm">الوقت المتبقي:</span>
            <div className="flex items-center gap-1 font-mono font-bold">
              {timeLeft.days > 0 && (
                <span className="bg-white/50 px-1.5 py-0.5 rounded">
                  {formatTimeUnit(timeLeft.days, 'يوم')}
                </span>
              )}
              <span className="bg-white/50 px-1.5 py-0.5 rounded">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
