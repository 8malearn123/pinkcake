import { Order } from '@/types/order';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Eye, Send, MoreHorizontal, User, MapPin, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { RiyalSymbol } from '@/components/ui/riyal';

interface OrderCardListProps {
  orders: Order[];
  onApprove?: (orderId: string) => void;
  onSendPaymentLink?: (orderId: string) => void;
}

/**
 * Orders as a responsive card grid — the same "ticket" language as the live
 * board / kitchen: order no + status ride the top, then customer + amount,
 * branch + pickup, and a footer with the view link and status actions.
 * Replaces the old flat table on the dashboard and orders list.
 */
export function OrderCardList({ orders, onApprove, onSendPaymentLink }: OrderCardListProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order, index) => (
        <div
          key={order.id}
          className="flex flex-col p-4 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200 animate-fade-in"
          style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
        >
          {/* Order no + status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-sm font-bold text-primary">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>

          {/* Customer + amount */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold truncate">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              {order.customerName}
            </span>
            <span className="shrink-0 font-bold tabular-nums">
              {order.totalAmount} <RiyalSymbol className="text-xs font-normal text-muted-foreground" />
            </span>
          </div>

          {/* Branch + pickup */}
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {order.branchName}
            </span>
            {(order.pickupDate || order.pickupTime) && (
              <span className="flex items-center gap-1.5 shrink-0 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {order.pickupDate}{order.pickupTime ? ` · ${order.pickupTime}` : ''}
              </span>
            )}
          </div>

          {/* Footer: view + status actions */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
            <Link
              to={`/orders/${order.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Eye className="w-3.5 h-3.5" />
              عرض التفاصيل
            </Link>

            <div className="flex items-center gap-1.5">
              {order.status === 'pending_approval' && (
                <Button
                  size="sm"
                  onClick={() => onApprove?.(order.id)}
                  className="h-8 gradient-pink text-white hover:opacity-90"
                >
                  اعتماد
                </Button>
              )}
              {order.status === 'awaiting_payment' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSendPaymentLink?.(order.id)}
                  className="h-8 border-primary text-primary hover:bg-primary/10"
                >
                  <Send className="w-3.5 h-3.5 me-1" />
                  رابط الدفع
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="خيارات" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>تعديل الطلب</DropdownMenuItem>
                  <DropdownMenuItem>عرض السجل</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">إلغاء الطلب</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
