import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Cookie,
  MapPin, 
  Calendar, 
  Clock,
  Phone,
  Search,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Enums } from '@/integrations/supabase/types';

type OrderStatus = Enums<'order_status'>;

interface TrackedOrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  branch_name: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  total_amount: number;
  items: TrackedOrderItem[] | null;
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const trackingCode = searchParams.get('code') || '';
  const [searchCode, setSearchCode] = useState(trackingCode);
  const [searching, setSearching] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchOrder = async (code: string) => {
    if (!code.trim()) return;
    
    setSearching(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase
        .rpc('get_order_by_tracking_code', { _tracking_code: code.trim() });
      
      if (error) {
        console.error('Error fetching order:', error);
        setOrder(null);
        return;
      }
      
      if (data && data.length > 0) {
        const orderData = data[0];
        // Parse items from JSON
        let parsedItems: TrackedOrderItem[] | null = null;
        if (orderData.items) {
          try {
            parsedItems = (Array.isArray(orderData.items) 
              ? orderData.items 
              : JSON.parse(orderData.items as string)) as TrackedOrderItem[];
          } catch {
            parsedItems = null;
          }
        }
        
        setOrder({
          order_number: orderData.order_number,
          status: orderData.status,
          branch_name: orderData.branch_name,
          delivery_date: orderData.delivery_date,
          delivery_time: orderData.delivery_time,
          total_amount: orderData.total_amount,
          items: parsedItems
        });
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setOrder(null);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (trackingCode) {
      fetchOrder(trackingCode);
    }
  }, [trackingCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(searchCode);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA');
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">حلويات السعادة</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Search Form */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">تتبع طلبك</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="أدخل رقم التتبع..."
              className="text-center"
            />
            <Button type="submit" className="gradient-gold text-white" disabled={searching}>
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </form>
        </div>

        {searching ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">جاري البحث...</p>
          </div>
        ) : order ? (
          <div className="space-y-6 animate-fade-in">
            {/* Order Status - No customer name displayed for privacy */}
            <div className="glass-card rounded-2xl p-6 text-center">
              <StatusBadge status={order.status} className="text-lg px-6 py-2" />
              <h2 className="text-2xl font-bold mt-4">{order.order_number}</h2>
              <p className="text-muted-foreground mt-2">
                يمكنك متابعة حالة طلبك هنا
              </p>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-6 text-center">مراحل الطلب</h3>
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[600px]">
                  <OrderStatusTimeline currentStatus={order.status} />
                </div>
              </div>
            </div>

            {/* Order Details */}
            {order.items && order.items.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">تفاصيل الطلب</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span>{item.product_name}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                      </div>
                      <span className="font-medium">{item.total_price} ر.س</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-primary">{order.total_amount} ر.س</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Info */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">معلومات الاستلام</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الفرع</p>
                    <p className="font-medium">{order.branch_name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">التاريخ</p>
                    <p className="font-medium">{formatDate(order.delivery_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الوقت</p>
                    <p className="font-medium">{formatTime(order.delivery_time)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-muted-foreground mb-3">لديك استفسار؟</p>
              <Button variant="outline" className="border-primary text-primary">
                <Phone className="w-4 h-4 ml-2" />
                اتصل بنا
              </Button>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">لم يتم العثور على الطلب</h3>
            <p className="text-muted-foreground">
              تأكد من رقم التتبع وحاول مرة أخرى
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Cookie className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">تتبع طلبك بسهولة</h3>
            <p className="text-muted-foreground">
              أدخل رقم التتبع المرسل لك لمتابعة حالة طلبك
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
