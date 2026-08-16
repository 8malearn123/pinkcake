import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Cookie, Store } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyOrders, useTrackedOrder } from '@/hooks/useCustomerStore';
import { useOrderItemLines } from '@/hooks/useOrderItemLines';
import { useReorder } from '@/hooks/useReorder';
import { getOrderMoment, type MomentActionKind } from '@/lib/orders/customerMoment';
import {
  forgetTrackCode,
  readTrackCode,
  rememberTrackCode,
  resolveTrackDestination,
} from '@/lib/orders/trackEntry';
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
  Eyebrow,
  GoldDivider,
  Lede,
  LoadingState,
  Section,
  Title,
} from '@/components/ds';
import { OrderMomentHero } from '@/components/orders/OrderMomentHero';
import { OrderItemsGallery } from '@/components/orders/OrderItemsGallery';
import { OrderInvoicePanel } from '@/components/orders/OrderInvoicePanel';
import { KeepShoppingBand } from '@/components/orders/KeepShoppingBand';
import { TrackCodeForm } from '@/components/orders/TrackCodeForm';

/**
 * Order status without asking the customer for anything.
 *
 * Nobody should have to copy a code out of an SMS. Three ways in, in order:
 *   1. `?code=` from the confirmation message (src/lib/notifications/templates.ts)
 *   2. signed in — we already know their orders, so we go straight there
 *   3. a code that resolved before on this device, replayed automatically
 *
 * Only a signed-out visitor we have never seen is asked anything, and even then
 * the offer is "sign in", with code entry demoted to a last-resort disclosure.
 * The URL stays the source of truth for the code, so a resolved lookup is
 * shareable and survives a refresh.
 */
export default function TrackOrder() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCode = searchParams.get('code') || '';
  const [showForm, setShowForm] = useState(false);

  // Held in state, not read during render: clearing a stale code has to cause a
  // re-render, and localStorage changes do not.
  const [rememberedCode, setRememberedCode] = useState(readTrackCode);

  // Decide nothing until auth settles, or we fire a guest code lookup for a
  // customer we are about to redirect.
  const ready = !authLoading;
  // An explicit code in the URL always wins; otherwise replay the last code that
  // worked on this device — but only for someone we cannot identify.
  const trackingCode = ready ? urlCode || (user ? '' : rememberedCode) : '';

  // Signed in with no code to honour → answer from their own orders.
  const resolveFromAccount = ready && !urlCode && !!user;
  const { data: myOrders, isError: ordersFailed } = useMyOrders({ enabled: resolveFromAccount });
  const destination = resolveFromAccount
    ? resolveTrackDestination({ orders: myOrders, failed: ordersFailed })
    : null;

  const { data: order, isLoading, isError, isFetching, refetch } = useTrackedOrder(trackingCode);
  const { lines, matched, matchedIds } = useOrderItemLines(order?.items);
  const reorder = useReorder();

  // Remember a code only once it has actually resolved, so a typo is never
  // replayed. A remembered code that has stopped resolving is dropped and the
  // visitor falls through to the sign-in offer — showing "not found" for a code
  // they never typed would be baffling.
  useEffect(() => {
    if (!trackingCode) return;
    if (order) {
      // Only for a visitor we cannot identify — a signed-in customer reaches
      // their orders through their account, so there is nothing to leave behind
      // on the device for the next person.
      if (!user) rememberTrackCode(trackingCode);
    } else if (order === null && !isError && !urlCode) {
      forgetTrackCode();
      setRememberedCode('');
    }
  }, [trackingCode, order, isError, urlCode, user]);

  const submitCode = (code: string) => {
    setShowForm(false);
    setSearchParams({ code });
  };

  const moment = order
    ? getOrderMoment({
        status: order.status,
        deliveryDate: order.delivery_date,
        deliveryTime: order.delivery_time,
        branchName: order.branch_name,
      })
    : null;

  const handleAction = (kind: MomentActionKind) => {
    if (kind === 'reorder') reorder(order?.items);
    else if (kind === 'shop') navigate('/shop');
    // A guest has no pricing surface — 'respond' and 'contact' both go to support.
    else navigate('/contact');
  };

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

  /* ── Hold until we know who is asking. ──────────────────────────────────── */
  if (!ready) {
    return shell(
      <Section variant="list" width="prose">
        <LoadingState />
      </Section>,
    );
  }

  /* ── Signed in: their own orders answer the question, so never ask. ─────── */
  if (destination?.kind === 'go') return <Navigate to={destination.to} replace />;

  /* ── Their account is still settling — hold, but only while it really is. ─ */
  if (destination?.kind === 'wait') {
    return shell(
      <Section variant="list" width="prose">
        <LoadingState />
      </Section>,
    );
  }

  /*
   * ── Nothing we can resolve — ask, and always leave a way through. ────────
   *
   * Reached when the visitor is signed out with no remembered code, AND when a
   * signed-in customer's order list is empty or failed to load. That second
   * case is not hypothetical: staff create orders for customers who phoned in,
   * and get_my_orders is scoped by get_my_customer_id(), so those never appear.
   * The code field is that customer's only route to their order — it has to
   * stay reachable here.
   */
  if (!trackingCode) {
    const signedIn = !!user;
    return shell(
      <>
        <Section variant="feature" width="prose">
          <Eyebrow rule="both" caps className="justify-center">
            تتبّع الطلب
          </Eyebrow>
          <Title variant="display" as="h1" className="mt-3 text-center">
            وين وصلت كيكتك؟
          </Title>
          <Lede className="mx-auto mt-4 max-w-md text-center">
            {signedIn
              ? 'ما لقينا طلباً مرتبطاً بحسابك. إذا طلبت عبر الهاتف، اكتب رمز التتبّع الذي وصلك.'
              : 'سجّل الدخول وتلقى طلباتك كلها — وحالتها — بدون ما تكتب أي رمز.'}
          </Lede>

          <div className="mt-8 flex justify-center">
            {signedIn ? (
              <Button variant="brand" size="cta" onClick={() => navigate('/my-orders')}>
                كل طلباتي
              </Button>
            ) : (
              <Button variant="brand" size="cta" onClick={() => navigate('/login')}>
                سجّل الدخول
              </Button>
            )}
          </div>

          {/* The escape hatch. Never remove it — for some customers it is the
              only way in. */}
          <div className="mt-8 text-center">
            {showForm ? (
              <TrackCodeForm
                autoFocus
                // The button above is this page's anchor CTA.
                submitVariant="outlineBrand"
                className="mx-auto max-w-sm text-start"
                onSubmit={submitCode}
              />
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
                عندي رمز تتبّع
              </Button>
            )}
          </div>
        </Section>
        <GoldDivider />
        <KeepShoppingBand context={[]} stage="studio" />
      </>,
    );
  }

  /* ── Looking it up ──────────────────────────────────────────────────────── */
  if (isLoading) {
    return shell(
      <Section variant="list" width="prose">
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

  /* ── The request failed — deliberately NOT the not-found screen ─────────── */
  if (isError) {
    return shell(
      <Section variant="list" width="prose">
        <ErrorState
          title="ما قدرنا نجيب حالة طلبك الآن"
          description="تحقّق من اتصالك ثم جرّب مرة ثانية."
          onRetry={() => refetch()}
          retryLabel="جرّب مرة ثانية"
        />
      </Section>,
    );
  }

  /* ── No such code. A typo is not an error — never destructive red. ──────── */
  if (!order || !moment) {
    return shell(
      <>
        <Section variant="list" width="prose">
          <EmptyState
            icon={Cookie}
            title="ما لقينا طلباً بهذا الرمز"
            description="تأكد من الرمز كما وصلك في الرسالة، أو تواصل معنا ونساعدك."
            className="rounded-2xl border border-dashed border-border bg-blush/40 py-16"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="brandFlat" size="pill" onClick={() => setShowForm(true)}>
                  جرّب رمزاً آخر
                </Button>
                <Button variant="outlineBrand" size="pill" onClick={() => navigate('/contact')}>
                  تواصل معنا
                </Button>
              </div>
            }
          />
          {/* Not «الرمز الذي أدخلته» — most people tapped a link and typed nothing. */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            رمز التتبّع:{' '}
            <bdi dir="ltr" className="font-bold text-foreground">
              {trackingCode}
            </bdi>
          </p>
          {showForm && (
            <TrackCodeForm
              autoFocus
              initialCode={trackingCode}
              pending={isFetching}
              className="mx-auto mt-6 max-w-sm"
              onSubmit={submitCode}
            />
          )}
        </Section>
        <GoldDivider />
        <KeepShoppingBand context={[]} stage="studio" />
      </>,
    );
  }

  /* ── Found it ───────────────────────────────────────────────────────────── */
  return shell(
    <>
      <Section variant="list" width="prose">
        <Reveal>
          <OrderMomentHero
            moment={moment}
            orderNumber={order.order_number}
            onAction={handleAction}
          />
        </Reveal>

        {/* get_my_pickup_code is auth-only, so a guest gets the order number. */}
        {moment.showPickupPass && (
          <Reveal>
            <div className="mt-5 glass-card rounded-2xl p-6 text-center">
              <Eyebrow rule="both" caps className="justify-center">
                رقم طلبك
              </Eyebrow>
              <bdi dir="ltr" className="mt-3 block text-3xl font-black text-primary">
                {order.order_number}
              </bdi>
              <p className="mt-2 text-sm text-muted-foreground">
                اذكر هذا الرقم عند الكاشير، وكيكتك بانتظارك.
              </p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/login')}>
                سجّل الدخول لعرض رمز الاستلام
              </Button>
            </div>
          </Reveal>
        )}

        <Reveal>
          <OrderItemsGallery lines={lines} className="mt-10" />
        </Reveal>

        {/* branch_address is not returned by the tracking RPC — never an empty row. */}
        {order.branch_name && (
          <Reveal>
            <div className="mt-8 glass-card rounded-2xl p-5">
              <Title variant="h3">كيف تستلم</Title>
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Store className="size-4 shrink-0 text-primary" />
                {order.branch_name}
              </p>
            </div>
          </Reveal>
        )}

        <Reveal>
          <OrderInvoicePanel lines={lines} totalAmount={order.total_amount} className="mt-5" />
        </Reveal>

        <Reveal>
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-blush/40 p-6 text-center">
            <Title variant="h3">احفظ طلباتك في مكان واحد</Title>
            <Lede className="mx-auto mt-2 max-w-sm">
              سجّل بنفس رقم جوالك وتلقى طلباتك كلها — وحالتها — هنا.
            </Lede>
            <Button
              variant="outlineBrand"
              size="pill"
              className="mt-4"
              onClick={() => navigate('/login')}
            >
              سجّل الدخول
            </Button>
          </div>
        </Reveal>

        <div className="mt-8 text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowForm((v) => !v)}>
            تتبّع طلباً آخر
          </Button>
          {showForm && (
            <TrackCodeForm
              autoFocus
              pending={isFetching}
              className="mx-auto mt-4 max-w-sm text-start"
              onSubmit={submitCode}
            />
          )}
        </div>
      </Section>

      <GoldDivider />
      <KeepShoppingBand
        context={matched}
        excludeIds={matchedIds}
        stage={moment.stage}
        reviewProduct={null}
      />
    </>,
  );
}
