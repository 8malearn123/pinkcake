import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBranches } from '@/hooks/useBranches';
import { useIsAdmin } from '@/hooks/useMyRoles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  Store,
  Search,
  Loader2,
  Package,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Truck,
  HandCoins,
  Building2,
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
  const { data: orders, isLoading: ordersLoading, error } = useQuery({
    queryKey: ['branch-orders', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      
      // For admin, fetch orders for selected branch directly
      if (isAdmin) {
        const { data, error } = await supabase.rpc('get_orders_for_admin');
        if (error) throw error;
        
        // Filter by selected branch and relevant statuses
        return (data || [])
          .filter((o: any) => 
            o.branch_id === selectedBranchId && 
            ['in_transit', 'ready_for_pickup', 'completed'].includes(o.status)
          )
          .map((o: any) => ({
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
            items: null, // Will need to fetch separately if needed
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              طلبات الفرع
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedBranchName ? `إدارة طلبات فرع ${selectedBranchName}` : 'متابعة وإدارة الطلبات الواردة للفرع'}
            </p>
          </div>

          {/* Branch Selector - Only for admins */}
          {isAdmin && branches && branches.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'in_transit' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'in_transit' ? 'all' : 'in_transit')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.inTransit}</p>
                  <p className="text-sm text-muted-foreground">في الطريق</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'ready_for_pickup' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'ready_for_pickup' ? 'all' : 'ready_for_pickup')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <HandCoins className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.readyForPickup}</p>
                  <p className="text-sm text-muted-foreground">جاهز للاستلام</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'completed' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">تم التسليم</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">حدث خطأ في تحميل الطلبات</p>
            </CardContent>
          </Card>
        ) : filteredOrders?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات حالياً</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">قائمة الطلبات ({filteredOrders?.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>موعد الاستلام</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-mono font-medium">{order.order_number}</p>
                          {order.tracking_code && (
                            <p className="text-xs text-muted-foreground">{order.tracking_code}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.customer_name || 'غير محدد'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {new Intl.NumberFormat('ar-SA', {
                            style: 'currency',
                            currency: 'SAR',
                          }).format(order.total_amount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            {order.delivery_date && (
                              <p>
                                {format(new Date(order.delivery_date), 'dd MMM', { locale: ar })}
                              </p>
                            )}
                            {order.delivery_time && (
                              <p className="text-muted-foreground text-xs">{order.delivery_time}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={BRANCH_STATUS_COLORS[order.status] || 'bg-muted'}>
                          {BRANCH_STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status !== 'completed' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon" aria-label="خيارات"
                                disabled={updateStatus.isPending}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border shadow-md">
                              {getNextStatus(order.status) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(order.id, getNextStatus(order.status)!)
                                  }
                                >
                                  <CheckCircle2 className="w-4 h-4 me-2" />
                                  {getNextStatusLabel(order.status)}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
