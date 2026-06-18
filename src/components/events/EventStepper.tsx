import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Props {
  steps: { key: string; label: string }[];
  current: number;
  onStepClick?: (i: number) => void;
}

export function EventStepper({ steps, current, onStepClick }: Props) {
  return (
    <div className="flex items-center mb-2 md:mb-8">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={s.key}>
            {i > 0 && (
              <div className={cn('flex-1 h-0.5 mx-1.5 rounded transition-colors', i <= current ? 'bg-primary' : 'bg-border')} />
            )}
            <div className="relative flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => done && onStepClick?.(i)}
                disabled={!done}
                aria-label={s.label}
                className={cn(
                  'w-9 h-9 rounded-full grid place-items-center text-sm font-bold transition-all border-2',
                  active && 'border-primary text-primary bg-primary/10 scale-110',
                  done && 'border-primary bg-primary text-primary-foreground cursor-pointer',
                  !active && !done && 'border-border text-muted-foreground bg-card',
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <bdi dir="ltr">{i + 1}</bdi>}
              </button>
              <span
                className={cn(
                  'hidden md:block absolute top-11 text-[10.5px] whitespace-nowrap',
                  active ? 'text-primary font-bold' : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
