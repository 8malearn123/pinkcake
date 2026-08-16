import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Eyebrow, GoldRule, Lede, Title } from '@/components/ds';
import { OrderPhaseRail } from '@/components/orders/OrderPhaseRail';
import type { MomentActionKind, OrderMoment } from '@/lib/orders/customerMoment';
import { cn } from '@/lib/utils';

/**
 * The answer, above the fold.
 *
 * Rendered identically by /track (guest) and /my-orders/:id (member), so the
 * two surfaces cannot say different things about the same order. Reads as
 * prose — headline, promise, what-happens-next — with the order number,
 * status chip and timestamps demoted to a quiet meta row underneath.
 *
 * Stays on the light cream surface: the page's one dark band is the tail.
 */
export function OrderMomentHero({
  moment,
  orderNumber,
  updatedAt,
  onAction,
  className,
}: {
  moment: OrderMoment;
  orderNumber: string;
  updatedAt?: string | null;
  onAction?: (kind: MomentActionKind) => void;
  className?: string;
}) {
  const action = moment.action;

  return (
    <section className={cn('glass-card rounded-3xl p-6 sm:p-8', className)}>
      <Eyebrow>طلبك</Eyebrow>
      <Title variant="h2" as="h1" className="mt-2 text-balance">
        {moment.headline}
      </Title>

      {moment.readiness && (
        <p className="mt-4 text-xl font-black leading-snug text-primary sm:text-2xl">
          {moment.readiness}
        </p>
      )}

      <Lede className="mt-3">{moment.next}</Lede>

      {moment.showRail && (
        <OrderPhaseRail
          progress={moment.progress}
          labels={moment.railLabels}
          index={moment.railIndex}
          className="mt-7"
        />
      )}

      <GoldRule className="my-6" />

      {/*
        No <StatusBadge> here, deliberately.

        DESIGN_SYSTEM §2 routes status colour through StatusBadge — but that
        badge prints ORDER_STATUS_LABELS, which is the OPERATIONS vocabulary
        («جاهز للإرسال»، «في الطريق للفرع»): the names of our own kitchen→branch
        hand-offs. Correct on a staff console, meaningless to the customer whose
        cake it is. The headline, promise line and rail above already say where
        the order is, in their language, so the chip would be a fourth status
        signal carrying the worst words. The rule still governs staff surfaces.
      */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          رقم الطلب{' '}
          <bdi dir="ltr" className="font-bold text-foreground">
            {orderNumber}
          </bdi>
        </span>
      </div>

      {/* Conditional: updated_at is absent from the demo order factory. */}
      {updatedAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          آخر تحديث {formatDistanceToNow(new Date(updatedAt), { locale: ar, addSuffix: true })}
        </p>
      )}

      {action && (
        <Button
          variant="brand"
          size="cta"
          className="mt-6 w-full sm:w-auto"
          onClick={() => onAction?.(action.kind)}
        >
          {action.label}
        </Button>
      )}
    </section>
  );
}
