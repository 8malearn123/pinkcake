import { useNavigate, Navigate } from 'react-router-dom';
import { LogOut, ShoppingCart, Store } from 'lucide-react';
import { useMyOrders } from '@/hooks/useCustomerStore';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getOrderMoment } from '@/lib/orders/customerMoment';
import { Button } from '@/components/ui/button';
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
  SkeletonList,
  Title,
} from '@/components/ds';
import { MyOrderCard } from '@/components/orders/MyOrderCard';
import { KeepShoppingBand } from '@/components/orders/KeepShoppingBand';

/**
 * The customer's orders — a list of answers, not a chronological ledger.
 *
 * Split into what is happening now and what is done, because those are two
 * different questions: «وين وصلت كيكتي؟» and «شنو طلبت قبل؟».
 */
export default function MyOrders() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { data: orders, isLoading, error, refetch } = useMyOrders();

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

  if (authLoading) return shell(<LoadingState />);
  if (!user) return <Navigate to="/login" replace />;

  const stageOf = (status: string) =>
    getOrderMoment({ status, deliveryDate: null, deliveryTime: null, branchName: null }).stage;
  const isPast = (status: string) => {
    const stage = stageOf(status);
    return stage === 'done' || stage === 'closed';
  };

  const active = (orders ?? []).filter((o) => !isPast(o.status));
  const past = (orders ?? []).filter((o) => isPast(o.status));

  const header = (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-primary/15 pb-6">
      <div>
        <Eyebrow>حسابي</Eyebrow>
        <Title variant="h2" as="h1" className="mt-2">
          طلباتي
        </Title>
        <Lede className="mt-3 max-w-xl">كل كيكة طلبتها، ووين وصلت.</Lede>
      </div>
      <Button variant="outlineBrand" size="pill" onClick={() => signOut()}>
        <LogOut className="size-4" /> تسجيل الخروج
      </Button>
    </div>
  );

  if (isLoading) {
    return shell(
      <Section variant="list" width="prose">
        {header}
        <SkeletonList rows={3} />
      </Section>,
    );
  }

  // Previously discarded — a failed query rendered the empty state and told a
  // returning customer they had never ordered.
  if (error) {
    return shell(
      <Section variant="list" width="prose">
        {header}
        <ErrorState onRetry={() => refetch()} />
      </Section>,
    );
  }

  if (!orders || orders.length === 0) {
    return shell(
      <>
        <Section variant="list" width="prose">
          {header}
          <EmptyState
            icon={ShoppingCart}
            title="لا توجد طلبات بعد — أول كيكة عندنا تستاهل 🎂"
            description="ابدأ رحلتك الحلوة معنا الآن."
            className="rounded-2xl border border-dashed border-border bg-blush/40 py-16"
            action={
              <Button variant="brand" size="pill" onClick={() => navigate('/shop')}>
                <Store className="size-4" /> تصفّح المنتجات
              </Button>
            }
          />
        </Section>
        <GoldDivider />
        <KeepShoppingBand context={[]} stage="studio" />
      </>,
    );
  }

  return shell(
    <>
      <Section variant="list" width="prose">
        {header}

        {active.length > 0 && (
          <>
            <Eyebrow rule>الآن</Eyebrow>
            <Reveal className="reveal-grid mt-4 space-y-4">
              {active.map((order) => (
                <MyOrderCard key={order.id} order={order} />
              ))}
            </Reveal>
          </>
        )}

        {active.length > 0 && past.length > 0 && <GoldDivider />}

        {past.length > 0 && (
          <>
            <Eyebrow rule>طلبات سابقة</Eyebrow>
            <Reveal className="reveal-grid mt-4 space-y-4">
              {past.map((order) => (
                <MyOrderCard key={order.id} order={order} />
              ))}
            </Reveal>
          </>
        )}
      </Section>

      <GoldDivider />
      <KeepShoppingBand context={[]} stage="studio" />
    </>,
  );
}
