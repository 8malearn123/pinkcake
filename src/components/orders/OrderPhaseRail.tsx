import { cn } from '@/lib/utils';

/**
 * Three phases, one thin bar.
 *
 * The six-node stepper it replaces was forced to `min-w-[600px]` inside an
 * `overflow-x-auto`, so on a 375px phone under half of it was visible and the
 * customer's own node could sit off-screen behind an unsignposted sideways
 * swipe. Two of its six nodes («جاهز للإرسال»، «في الطريق للفرع») named our own
 * kitchen→branch hand-off.
 *
 * This is FreeDeliveryMeter's recipe, so progress reads as the same affordance
 * the customer already met in the cart. `width` is direction-neutral, so there
 * is nothing here to get wrong in RTL.
 */
export function OrderPhaseRail({
  progress,
  labels,
  index,
  variant = 'full',
  className,
}: {
  progress: number;
  labels: readonly [string, string, string];
  index: 0 | 1 | 2;
  variant?: 'full' | 'mini';
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className={className}>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={index + 1}
        aria-valuetext={labels[index]}
      >
        <div
          className="gradient-pink h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {variant === 'full' && (
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] font-bold">
          {labels.map((label, i) => (
            <span
              key={label}
              className={cn(
                i === index ? 'text-primary' : 'text-muted-foreground',
                i > index && 'opacity-50',
              )}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
