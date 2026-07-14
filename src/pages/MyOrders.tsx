import { useNavigate, Navigate } from 'react-router-dom';
import { useMyOrders } from '@/hooks/useCustomerStore';
import { useReorder } from '@/hooks/useReorder';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Cake,
  Package,
  ShoppingCart,
  Store,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  LogOut,
  ArrowRight,
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/store')}
              className="rounded-full"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <div className="text-[10px] text-primary tracking-widest uppercase">حسابي</div>
              <div className="font-display text-xl leading-none mt-0.5">طلباتي</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => navigate('/store')} className="rounded-full" aria-label="المتجر">
              <Store className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full" aria-label="خروج">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-8 max-w-3xl">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-3xl border-border/60">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-36" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-border/60 bg-secondary/30">
            <div className="w-20 h-20 mx-auto rounded-full bg-card flex items-center justify-center mb-5 shadow-soft-lift">
              <ShoppingCart className="w-9 h-9 text-primary" />
            </div>
            <h3 className="font-display text-3xl mb-2">لا توجد طلبات بعد</h3>
            <p className="text-muted-foreground mb-6 text-sm">ابدأ رحلتك الحلوة معنا الآن</p>
            <Button onClick={() => navigate('/store')} className="rounded-full px-6 h-11 bg-foreground text-background hover:bg-foreground/90">
              <Store className="w-4 h-4 me-2" />
              تصفّح المنتجات
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="rounded-3xl border-border/60 hover:border-primary/40 hover:shadow-soft-lift transition-all cursor-pointer overflow-hidden"
                onClick={() => navigate(`/my-orders/${order.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground tracking-widest uppercase">رقم الطلب</div>
                      <h3 className="font-display text-2xl mt-0.5 leading-none">{order.order_number}</h3>
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
                      <div className="font-display text-2xl text-primary leading-none mt-0.5">
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
