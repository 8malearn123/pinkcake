import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Package, Truck, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { useMyOrders } from '@/hooks/useCustomerStore';
import { getOrderMoment } from '@/lib/orders/customerMoment';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { cn } from '@/lib/utils';

interface QuickLink {
  icon: LucideIcon;
  title: string;
  /** The line under the title — a live answer when we have one. */
  desc: string;
  to: string;
  /** Rendered as the corner count. Hidden at zero rather than shown as ٠. */
  count?: number;
  /** Draws the berry dot: something is happening right now. */
  live?: boolean;
}

/**
 * The three shortcuts that moved out of the top nav.
 *
 * They used to say the same three static sentences to everyone. Each one now
 * answers with the customer's own state — how many past orders, how many saved
 * items, and (the useful one) what her live order is actually doing — so the
 * row is worth reading instead of being three doors with labels on them.
 */
export function AccountQuickLinks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { count: wishlistCount } = useStoreWishlist();
  const { data: orders = [] } = useMyOrders({ enabled: !!user });

  const moments = orders.map((o) =>
    getOrderMoment({
      status: o.status,
      deliveryDate: o.delivery_date,
      deliveryTime: o.delivery_time,
      branchName: o.branch_name,
    }),
  );
  // Same "still open" line /my-orders draws, so the two screens can't disagree
  // about what counts as live — `studio` included: a design sitting with the
  // chef is exactly what she opens this tile to check on.
  const activeIndex = moments.findIndex((m) => m.stage !== 'done' && m.stage !== 'closed');
  const active = activeIndex >= 0 ? orders[activeIndex] : null;

  const links: QuickLink[] = [
    {
      icon: Package,
      title: 'طلباتي',
      desc: orders.length ? 'كل كيكة طلبتها، ووين وصلت' : 'تتبّع طلباتك السابقة',
      to: '/my-orders',
      count: orders.length,
    },
    {
      icon: Heart,
      title: 'المفضلة',
      desc: wishlistCount ? 'جاهزة للطلب متى شئتِ' : 'منتجاتك المحفوظة',
      to: '/wishlist',
      count: wishlistCount,
    },
    {
      icon: Truck,
      title: 'تتبّع طلب',
      desc: active ? moments[activeIndex].headline : 'حالة طلبك الحالي',
      to: active ? `/my-orders/${active.id}` : '/track',
      live: !!active,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {links.map((l) => (
        <button
          key={l.title}
          onClick={() => navigate(l.to)}
          className="press group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-start transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-ink-soft-lg"
        >
          {/* Gold hairline that lights on hover — the same cue the store's
              browse→buy divider uses, at card scale. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <l.icon className="size-5" />
            </span>

            {l.live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                </span>
                الآن
              </span>
            ) : l.count ? (
              <span className="text-xl font-semibold tabular-nums text-primary/70 transition-colors duration-300 group-hover:text-primary">
                {toArabicDigits(l.count)}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <span className="font-bold">{l.title}</span>
            <ChevronLeft
              className={cn(
                'cta-arrow size-4 text-muted-foreground transition-colors group-hover:text-primary',
              )}
            />
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{l.desc}</div>
        </button>
      ))}
    </div>
  );
}
