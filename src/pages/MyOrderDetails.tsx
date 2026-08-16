import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Cake, MapPin, Store } from 'lucide-react';
import { useMyOrderDetails, useMyOrderRealtime } from '@/hooks/useCustomerStore';
import { useOrderItemLines } from '@/hooks/useOrderItemLines';
import { useReorder } from '@/hooks/useReorder';
import { useMyPricingRequests } from '@/hooks/useCustomOrderWorkflow';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getOrderMoment, type MomentActionKind } from '@/lib/orders/customerMoment';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { StorefrontFooter } from '@/components/store/StorefrontFooter';
import { FloatingContactButton } from '@/components/store/FloatingContactButton';
import { BackToTop } from '@/components/store/BackToTop';
import { Marquee } from '@/components/store/StorefrontDecor';
import { Reveal } from '@/components/Reveal';
import {
  EmptyState,
  ErrorState,
  GoldDivider,
  LoadingState,
  Section,
  Title,
} from '@/components/ds';
import { OrderMomentHero } from '@/components/orders/OrderMomentHero';
import { OrderItemsGallery } from '@/components/orders/OrderItemsGallery';
import { OrderInvoicePanel } from '@/components/orders/OrderInvoicePanel';
import { KeepShoppingBand } from '@/components/orders/KeepShoppingBand';
import { PickupQRCode } from '@/components/orders/PickupQRCode';
import { CustomerPricingCard } from '@/components/orders/CustomerPricingCard';

/**
 * One order, for the customer who placed it.
 *
 * Same hero, same gallery, same tail as /track — the two surfaces read from one
 * narrative module so they can never say different things about one order.
 */
export default function MyOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();
  const { data: order, isLoading, error, refetch } = useMyOrderDetails(id);
  const reorder = useReorder();

  useMyOrderRealtime(id);

  const { lines, matched, matchedIds } = useOrderItemLines(order?.items);
  const isPricing = order?.status === 'pricing_sent_to_customer';
  const { data: pricingRequests } = useMyPricingRequests({ enabled: isPricing });
  const pricingRequest = pricingRequests?.find((r) => r.id === id) ?? null;

  const shell = (children: React.ReactNode) => (
    <div className="store-surface min-h-screen bg-background text-foreground">
      <Marquee />
      <StorefrontMasthead />
      <main>{children}</main>
      <StorefrontFooter storeName={settings.storeName} onNavigate={navigate} />
      <FloatingContactButton />
      <BackToTop />
    </div>
  );

  // Plain ArrowRight, no .cta-arrow — that class is a physical translateX(-5px)
  // and nudges toward the end edge, the wrong way for a back arrow in RTL.
  const backRail = (
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        onClick={() => navigate('/my-orders')}
      >
        <ArrowRight className="size-4" /> كل طلباتي
      </Button>
    </div>
  );

  if (authLoading) return shell(<LoadingState />);
  if (!user) return <Navigate to="/login" replace />;

  if (isLoading) {
    return shell(
      <Section variant="list" width="prose">
        {backRail}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="mt-4 h-9 w-4/5" />
          <Skeleton className="mt-4 h-7 w-1/2" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <Skeleton className="mt-7 h-1.5 w-full rounded-full" />
        </div>
        <Skeleton className="mt-6 aspect-[4/3] w-full rounded-2xl" />
      </Section>,
    );
  }

  if (error) {
    return shell(
      <Section variant="list" width="prose">
        {backRail}
        <ErrorState
          title="ما قدرنا نجيب تفاصيل طلبك الآن"
          description="تحقّق من اتصالك ثم جرّب مرة ثانية."
          onRetry={() => refetch()}
          retryLabel="جرّب مرة ثانية"
        />
      </Section>,
    );
  }

  if (!order) {
    return shell(
      <Section variant="list" width="prose">
        {backRail}
        <EmptyState
          icon={Cake}
          title="ما لقينا هذا الطلب"
          description="ربما الرابط قديم، أو الطلب يخص حساباً آخر."
          className="rounded-2xl border border-dashed border-border bg-blush/40 py-16"
          action={
            <Button variant="brandFlat" size="pill" onClick={() => navigate('/my-orders')}>
              كل طلباتي
            </Button>
          }
        />
      </Section>,
    );
  }

  const moment = getOrderMoment({
    status: order.status,
    deliveryDate: order.delivery_date,
    deliveryTime: order.delivery_time,
    branchName: order.branch_name,
  });

  const handleAction = (kind: MomentActionKind) => {
    if (kind === 'reorder') reorder(order.items);
    else if (kind === 'shop') navigate('/shop');
    else if (kind === 'respond' && pricingRequest) {
      document.getElementById('pricing-offer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else navigate('/contact');
  };

  return shell(
    <>
      <Section variant="list" width="prose">
        {backRail}

        <Reveal>
          <OrderMomentHero
            moment={moment}
            orderNumber={order.order_number}
            updatedAt={order.updated_at}
            onAction={handleAction}
          />
        </Reveal>

        {moment.showPickupPass && id && (
          <Reveal>
            <div className="mt-5">
              <PickupQRCode
                orderId={id}
                orderStatus={order.status}
                orderNumber={order.order_number}
              />
            </div>
          </Reveal>
        )}

        {isPricing && pricingRequest && (
          <Reveal>
            <div id="pricing-offer" className="mt-5">
              <CustomerPricingCard order={pricingRequest} />
            </div>
          </Reveal>
        )}

        <Reveal>
          <OrderItemsGallery lines={lines} className="mt-10" />
        </Reveal>

        {order.branch_name && (
          <Reveal>
            <div className="mt-8 glass-card rounded-2xl p-5">
              <Title variant="h3">كيف تستلم</Title>
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Store className="size-4 shrink-0 text-primary" />
                {order.branch_name}
              </p>
              {/* Absent from the demo order factory — the guard is required. */}
              {order.branch_address && (
                <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  {order.branch_address}
                </p>
              )}
            </div>
          </Reveal>
        )}

        <Reveal>
          <OrderInvoicePanel
            lines={lines}
            totalAmount={order.total_amount}
            paymentStatus={order.payment_status}
            className="mt-5"
          />
        </Reveal>
      </Section>

      <GoldDivider />
      <KeepShoppingBand
        context={matched}
        excludeIds={matchedIds}
        stage={moment.stage}
        reviewProduct={moment.stage === 'done' ? (matched[0] ?? null) : null}
      />
    </>,
  );
}
