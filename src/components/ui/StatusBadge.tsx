import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  ChefHat, 
  Package, 
  Truck, 
  MapPin, 
  PartyPopper,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
}

const STATUS_ICONS: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  pending_approval: Clock,
  awaiting_payment: CreditCard,
  paid: CheckCircle2,
  preparing: ChefHat,
  ready_to_ship: Package,
  in_transit: Truck,
  ready_for_pickup: MapPin,
  completed: PartyPopper,
  custom_pending_review: AlertCircle,
  custom_chef_approved: CheckCircle2,
  custom_rejected: XCircle,
  sent_to_chef: ChefHat,
  chef_priced: CheckCircle2,
  pricing_sent_to_customer: Clock,
  customer_accepted: CheckCircle2,
  customer_rejected: XCircle,
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const Icon = STATUS_ICONS[status] || Clock;
  
  return (
    <span className={cn('status-badge', ORDER_STATUS_COLORS[status], className)}>
      {showIcon && <Icon className="w-4 h-4" />}
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}
