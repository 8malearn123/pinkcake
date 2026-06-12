import { Order } from '@/types/order';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Eye, Send, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

interface OrdersTableProps {
  orders: Order[];
  onApprove?: (orderId: string) => void;
  onSendPaymentLink?: (orderId: string) => void;
}

export function OrdersTable({ orders, onApprove, onSendPaymentLink }: OrdersTableProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-start p-4 font-semibold text-foreground">رقم الطلب</th>
              <th className="text-start p-4 font-semibold text-foreground">العميل</th>
              <th className="text-start p-4 font-semibold text-foreground">الفرع</th>
              <th className="text-start p-4 font-semibold text-foreground">المبلغ</th>
              <th className="text-start p-4 font-semibold text-foreground">موعد الاستلام</th>
              <th className="text-start p-4 font-semibold text-foreground">الحالة</th>
              <th className="text-start p-4 font-semibold text-foreground">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="p-4">
                  <span className="font-mono font-medium text-primary">{order.orderNumber}</span>
                </td>
                <td className="p-4">
                  <p className="font-medium text-foreground">{order.customerName}</p>
                </td>
                <td className="p-4 text-foreground">{order.branchName}</td>
                <td className="p-4">
                  <span className="font-bold text-foreground">{order.totalAmount} ر.س</span>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-foreground">{order.pickupDate}</p>
                    <p className="text-sm text-muted-foreground">{order.pickupTime}</p>
                  </div>
                </td>
                <td className="p-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    
                    {order.status === 'pending_approval' && (
                      <Button
                        size="sm"
                        onClick={() => onApprove?.(order.id)}
                        className="gradient-pink text-white hover:opacity-90"
                      >
                        اعتماد
                      </Button>
                    )}
                    
                    {order.status === 'awaiting_payment' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSendPaymentLink?.(order.id)}
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        <Send className="w-4 h-4 me-1" />
                        إرسال رابط الدفع
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem>تعديل الطلب</DropdownMenuItem>
                        <DropdownMenuItem>عرض السجل</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">إلغاء الطلب</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
