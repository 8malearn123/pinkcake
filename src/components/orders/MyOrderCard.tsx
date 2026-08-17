import { Link } from 'react-router-dom';
import { Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiyalSymbol } from '@/components/ui/riyal';
import { OrderPhaseRail } from '@/components/orders/OrderPhaseRail';
import { useOrderItemLines } from '@/hooks/useOrderItemLines';
import { useReorder } from '@/hooks/useReorder';
import { getOrderMoment } from '@/lib/orders/customerMoment';
import { toArabicDigits } from '@/lib/arabicNumerals';
import type { CustomerOrder } from '@/hooks/useCustomerStore';

const THUMBS = 3;

/**
 * One row of /my-orders — an answer, not a ledger entry.
 *
 * The row title is the narrative headline («كيكتك في الفرن الآن»), not the order
 * number, and the whole card is a real link: the previous markup was a
 * click-only <div> with no href, so it could not be focused, middle-clicked or
 * opened in a new tab, and its «التفاصيل» button worked purely by bubbling.
 *
 * Active rows show no total — «كم دفعت» is not the question while you are
 * waiting for a cake.
 */
export function MyOrderCard({ order }: { order: CustomerOrder }) {
  const { lines } = useOrderItemLines(order.items);
  const reorder = useReorder();
  const moment = getOrderMoment({
    status: order.status,
    deliveryDate: order.delivery_date,
    deliveryTime: order.delivery_time,
    branchName: order.branch_name,
  });
  const isPast = moment.stage === 'done' || moment.stage === 'closed';
  const shown = lines.slice(0, THUMBS);
  const overflow = lines.length - shown.length;

  return (
    <div className="group glass-card relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-ink-soft-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {shown.length > 0 && (
          <div className="flex shrink-0 gap-2">
            {shown.map((line, index) => (
              <div
                key={line.id ?? `${line.product_name}-${index}`}
                className="size-16 overflow-hidden rounded-xl bg-blush"
              >
                {line.product?.image_url ? (
                  <img
                    src={line.product.image_url}
                    alt={line.product_name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-secondary">
                    <Cake className="size-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {overflow > 0 && (
              <div className="grid size-16 place-items-center rounded-xl bg-blush text-sm font-bold text-rose">
                +{toArabicDigits(overflow)}
              </div>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Link
            to={`/my-orders/${order.id}`}
            className="text-lg font-semibold leading-snug after:absolute after:inset-0 after:content-['']"
          >
            {moment.headline}
          </Link>

          {moment.readiness && (
            <p className="mt-1 text-sm text-muted-foreground">{moment.readiness}</p>
          )}

          {moment.showRail && (
            <OrderPhaseRail
              variant="mini"
              progress={moment.progress}
              labels={moment.railLabels}
              index={moment.railIndex}
              className="mt-4"
            />
          )}

          {/* No StatusBadge — see the note in OrderMomentHero: its label is the
              ops vocabulary, and the headline + rail already say where we are. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              رقم الطلب <bdi dir="ltr">{order.order_number}</bdi>
            </span>
          </div>
        </div>

        {isPast && (
          <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:items-end">
            <span className="flex items-baseline gap-1 text-2xl font-semibold leading-none text-primary">
              {toArabicDigits(order.total_amount)}{' '}
              <RiyalSymbol className="text-sm text-muted-foreground" />
            </span>
            {order.items && order.items.length > 0 && (
              <Button
                variant="outlineBrand"
                size="sm"
                className="rounded-full"
                // preventDefault (not stopPropagation) is what a stretched link needs.
                onClick={(e) => {
                  e.preventDefault();
                  reorder(order.items);
                }}
              >
                اطلبها مرة ثانية
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
