import { Link } from 'react-router-dom';
import { Receipt, ChevronLeft, Package } from 'lucide-react';
import LozaShell from './LozaShell';
import { useLozaCart, LozaOrder } from '@/contexts/LozaCartContext';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<LozaOrder['status'], { label: string; color: string; emoji: string }> = {
  placed: { label: 'تم الاستلام', color: 'bg-amber-100 text-amber-800', emoji: '📝' },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-800', emoji: '✅' },
  preparing: { label: 'قيد التحضير', color: 'bg-orange-100 text-orange-800', emoji: '👨‍🍳' },
  'on-the-way': { label: 'في الطريق', color: 'bg-purple-100 text-purple-800', emoji: '🚚' },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-800', emoji: '🎉' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800', emoji: '❌' },
};

export default function LozaOrders() {
  const { orders } = useLozaCart();

  return (
    <LozaShell>
      <header className="bg-background sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-loza-gold flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[hsl(var(--loza-brown))]" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-loza-display">طلباتي</h1>
            <p className="text-[11px] text-muted-foreground">{orders.length} طلب</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] flex items-center justify-center text-5xl mb-5">
              📦
            </div>
            <h2 className="text-xl font-bold font-loza-display">لا توجد طلبات بعد</h2>
            <p className="text-muted-foreground text-sm mt-1">ابدأ بطلب أول كيكة لك من لوزا</p>
            <Link to="/loza" className="inline-block mt-5 px-6 py-2.5 rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] font-bold text-sm">
              تسوّق الآن
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const s = STATUS_MAP[o.status];
              return (
                <Link
                  key={o.id}
                  to={`/loza/orders/${o.id}`}
                  className="block bg-card rounded-3xl shadow-loza border border-border/40 p-4 hover:shadow-loza-lift transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-muted-foreground">طلب #{o.number}</div>
                      <h3 className="font-bold mt-0.5">
                        {o.items.length} منتج • {o.vendor}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        📅 {o.deliveryDate} • {o.deliveryTime}
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="font-extrabold text-gradient-loza">{o.total} ر.س</div>
                      <span className={cn('inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold', s.color)}>
                        {s.emoji} {s.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                    <div className="flex -space-x-2 space-x-reverse">
                      {o.items.slice(0, 4).map((it, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--loza-gold-light))] to-[hsl(var(--loza-cream))] border-2 border-card flex items-center justify-center text-base">
                          {it.emoji || '🎂'}
                        </div>
                      ))}
                      {o.items.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold">
                          +{o.items.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                      <Package className="w-3 h-3" /> تتبع
                      <ChevronLeft className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </LozaShell>
  );
}
