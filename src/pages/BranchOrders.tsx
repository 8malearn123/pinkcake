import { useState, useEffect, Fragment } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RiyalSymbol } from '@/components/ui/riyal';
import { useBranches } from '@/hooks/useBranches';
import { useIsAdmin } from '@/hooks/useMyRoles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Store,
  Search,
  Package,
  CheckCircle2,
  Truck,
  HandCoins,
  Building2,
  Clock,
  User,
  ChevronLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Enums } from '@/integrations/supabase/types';

type OrderStatus = Enums<'order_status'>;

interface BranchOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
  tracking_code: string | null;
  items: { product_name: string; quantity: number }[] | null;
}

// Row shape returned by get_orders_for_admin (superset — carries branch_id; the
// generated RPC type omits items, but the payload carries them, so keep it optional).
type AdminOrderRow = Omit<BranchOrder, 'items'> & { branch_id: string | null; items?: BranchOrder['items'] };

const BRANCH_STATUS_LABELS: Record<string, string> = {
  in_transit: 'في الطريق',
  ready_for_pickup: 'جاهز للاستلام',
  completed: 'تم التسليم',
};

const BRANCH_STATUS_COLORS: Record<string, string> = {
  in_transit: 'bg-info/10 text-info',
  ready_for_pickup: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

const BRANCH_STATUS_ICONS: Record<string, typeof Truck> = {
  in_transit: Truck,
  ready_for_pickup: HandCoins,
  completed: CheckCircle2,
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);

export default function BranchOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const { user } = useAuth();
  const { hasRole: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const queryClient = useQueryClient();

  // Get user's assigned branch
  const { data: myBranch } = useQuery({
    queryKey: ['my-branch', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_my_branch');
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user,
  });

  // Set default branch when loaded
  useEffect(() => {
    if (!selectedBranchId) {
      if (isAdmin && branches && branches.length > 0) {
        setSelectedBranchId(branches[0].id);
      } else if (myBranch) {
        setSelectedBranchId(myBranch.id);
      }
    }
  }, [isAdmin, branches, myBranch, selectedBranchId]);

  // Fetch orders for selected branch
  const { data: orders, isLoading: ordersLoading, error, refetch } = useQuery({
    queryKey: ['branch-orders', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];

      // For admin, fetch orders for selected branch directly
      if (isAdmin) {
        const { data, error } = await supabase.rpc('get_orders_for_admin');
        if (error) throw error;

        // Filter by selected branch and relevant statuses
        return ((data || []) as AdminOrderRow[])
          .filter((o) =>
            o.branch_id === selectedBranchId &&
            ['in_transit', 'ready_for_pickup', 'completed'].includes(o.status)
          )
          .map((o) => ({
            id: o.id,
            order_number: o.order_number,
            status: o.status,
            customer_name: o.customer_name,
            delivery_date: o.delivery_date,
            delivery_time: o.delivery_time,
            total_amount: o.total_amount,
            notes: o.notes,
            created_at: o.created_at,
            tracking_code: o.tracking_code,
            items: o.items ?? null, // get_orders_for_admin already carries order items
          })) as BranchOrder[];
      } else {
        // For branch users, use the secure function
        const { data, error } = await supabase.rpc('get_orders_for_branch', {
          _user_id: user?.id,
        });
        if (error) throw error;
        return (data || []) as BranchOrder[];
      }
    },
    enabled: !!selectedBranchId && !isAdminLoading,
  });

  // Update order status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-orders'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    inTransit: orders?.filter((o) => o.status === 'in_transit').length || 0,
    readyForPickup: orders?.filter((o) => o.status === 'ready_for_pickup').length || 0,
    completed: orders?.filter((o) => o.status === 'completed').length || 0,
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatus.mutate({ orderId, status: newStatus });
  };

  const getNextStatus = (currentStatus: string): OrderStatus | null => {
    switch (currentStatus) {
      case 'in_transit':
        return 'ready_for_pickup';
      case 'ready_for_pickup':
        return 'completed';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'in_transit':
        return 'تم الاستلام في الفرع';
      case 'ready_for_pickup':
        return 'تم تسليم العميل';
      default:
        return '';
    }
  };

  const isLoading = ordersLoading || branchesLoading || isAdminLoading;

  // Get branch name for header
  const selectedBranchName = branches?.find(b => b.id === selectedBranchId)?.name || myBranch?.name;
  const totalOrders = orders?.length || 0;

  // Clickable command-bar stages — the branch fulfilment flow: in transit → ready → delivered.
  const stages = [
    { status: 'in_transit', label: 'في الطريق', value: stats.inTransit, icon: Truck, box: 'bg-info/10 text-info', text: 'text-info' },
    { status: 'ready_for_pickup', label: 'جاهز للاستلام', value: stats.readyForPickup, icon: HandCoins, box: 'bg-warning/10 text-warning', text: 'text-warning' },
    { status: 'completed', label: 'تم التسليم', value: stats.completed, icon: CheckCircle2, box: 'bg-success/10 text-success', text: 'text-success' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="طلبات الفرع"
          description={selectedBranchName ? `إدارة طلبات فرع ${selectedBranchName}` : 'متابعة وإدارة الطلبات الواردة للفرع'}
          icon={Store}
          actions={
            isAdmin && branches && branches.length > 0 ? (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : undefined
          }
        />

        {/* Command bar — total (clears filter) + clickable status pipeline */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'flex items-center gap-3 p-5 text-start border-b lg:border-b-0 lg:border-e border-border/60 shrink-0 transition-colors',
                statusFilter === 'all' ? 'bg-primary/[0.08]' : 'bg-primary/[0.04] hover:bg-primary/[0.06]'
              )}
            >
              <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1.5">إجمالي الطلبات</p>
              </div>
            </button>

            <div className="flex items-center justify-between gap-1 p-4 flex-1 overflow-x-auto">
              {stages.map((stage, i) => {
                const active = statusFilter === stage.status;
                return (
                  <Fragment key={stage.status}>
                    <button
                      type="button"
                      onClick={() => setStatusFilter(active ? 'all' : stage.status)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 shrink-0 transition-colors',
                        active ? 'bg-muted' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all', stage.box, active && 'ring-2 ring-primary')}>
                        <stage.icon className="w-5 h-5" />
                      </div>
                      <p className={cn('text-xl font-bold leading-none', stage.text)}>{stage.value}</p>
                      <p className="text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">{stage.label}</p>
                    </button>
                    {i < stages.length - 1 && <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث برقم الطلب أو اسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState label="جاري تحميل الطلبات..." />
        ) : error ? (
          <ErrorState title="حدث خطأ في تحميل الطلبات" onRetry={() => refetch()} />
        ) : filteredOrders?.length === 0 ? (
          <EmptyState
            icon={Package}
            title="لا توجد طلبات حالياً"
            description={statusFilter === 'all' ? 'ستظهر هنا الطلبات الواردة لهذا الفرع عند وصولها.' : 'لا توجد طلبات مطابقة لهذه الحالة.'}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders?.map((order) => {
              const StatusIcon = BRANCH_STATUS_ICONS[order.status] || Package;
              const next = getNextStatus(order.status);
              return (
                <div
                  key={order.id}
                  className="flex flex-col p-4 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200"
                >
                  {/* Order no (+ tracking) + status */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-primary">{order.order_number}</p>
                      {order.tracking_code && (
                        <p className="text-xs text-muted-foreground">{order.tracking_code}</p>
                      )}
                    </div>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', BRANCH_STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground')}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {BRANCH_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  {/* Customer + amount */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold truncate">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      {order.customer_name || 'غير محدد'}
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{formatCurrency(order.total_amount)}{' '}<RiyalSymbol /></span>
                  </div>

                  {/* Pickup */}
                  {(order.delivery_date || order.delivery_time) && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="tabular-nums">
                        {order.delivery_date ? format(new Date(order.delivery_date), 'dd MMM', { locale: ar }) : ''}
                        {order.delivery_time ? ` · ${order.delivery_time}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Advance action */}
                  {next ? (
                    <div className="mt-4 border-t border-border/50 pt-3">
                      <Button
                        onClick={() => handleStatusChange(order.id, next)}
                        disabled={updateStatus.isPending}
                        className="w-full gradient-pink text-white shadow-warm hover:opacity-90"
                      >
                        <CheckCircle2 className="w-4 h-4 me-2" />
                        {getNextStatusLabel(order.status)}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-border/50 pt-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تم التسليم للعميل
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
