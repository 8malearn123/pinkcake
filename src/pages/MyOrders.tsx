import { useNavigate, Navigate } from 'react-router-dom';
import { useMyOrders } from '@/hooks/useCustomerStore';
import { useReorder } from '@/hooks/useReorder';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { StorefrontMasthead } from '@/components/store/StorefrontMasthead';
import { Marquee } from '@/components/store/StorefrontDecor';
import { Eyebrow, Title } from '@/components/ds';
import {
  Cake,
  ShoppingCart,
  Store,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  LogOut,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { RiyalSymbol } from '@/components/ui/riyal';

export default function MyOrders() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useMyOrders();
  const reorder = useReorder();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="store-surface min-h-screen bg-background text-foreground">
      <Marquee />
      <StorefrontMasthead />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-primary/15 pb-6">
          <div>
            <Eyebrow>حسابي</Eyebrow>
            <Title variant="h2" as="h1" className="mt-2">
              طلباتي
            </Title>
          </div>
          <Button variant="outlineBrand" size="pill" onClick={() => signOut()}>
            <LogOut className="size-4" /> تسجيل الخروج
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="mb-2 h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-blush/40 py-20 text-center">
            <div className="shadow-berry-soft mx-auto mb-5 grid size-20 place-items-center rounded-full bg-background">
              <ShoppingCart className="size-9 text-primary" />
            </div>
            <Title variant="h3" as="h3" className="mb-2 text-2xl">
              لا توجد طلبات بعد
            </Title>
            <p className="mb-6 text-sm text-muted-foreground">ابدأ رحلتك الحلوة معنا الآن</p>
            <Button variant="brand" size="pill" onClick={() => navigate('/shop')}>
              <Store className="size-4" />
              تصفّح المنتجات
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-berry-soft-lg"
                onClick={() => navigate(`/my-orders/${order.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground tracking-widest uppercase">رقم الطلب</div>
                      <h3 className="mt-0.5 text-2xl font-black leading-none">{order.order_number}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {format(new Date(order.created_at), 'PPpp', { locale: ar })}
                      </p>
                    </div>
                    <StatusBadge status={order.status as OrderStatus} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-4 pb-4 border-b border-border/60">
                    {order.branch_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{order.branch_name}</span>
                      </div>
                    )}
                    {order.delivery_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{format(new Date(order.delivery_date), 'PPP', { locale: ar })}</span>
                      </div>
                    )}
                    {order.delivery_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{order.delivery_time}</span>
                      </div>
                    )}
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Cake className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">
                        {order.items.slice(0, 2).map((item) => item.product_name).join('، ')}
                        {order.items.length > 2 && ` و ${order.items.length - 2} أخرى`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground tracking-widest uppercase">المجموع</div>
                      <div className="mt-0.5 text-2xl font-black leading-none text-primary">
                        {order.total_amount} <RiyalSymbol className="text-xs text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {order.items && order.items.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full gap-1.5"
                          onClick={(e) => { e.stopPropagation(); reorder(order.items); }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          أعد الطلب
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="rounded-full text-primary hover:text-primary hover:bg-primary/10">
                        التفاصيل
                        <ChevronLeft className="w-4 h-4 ms-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
