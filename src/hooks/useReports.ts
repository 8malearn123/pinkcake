import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Enums } from '@/integrations/supabase/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

type OrderStatus = Enums<'order_status'>;

export type DateRange = {
  from: Date;
  to: Date;
};

export type QuickFilter = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export function getDateRangeFromQuickFilter(filter: QuickFilter): DateRange {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    case 'this_week':
      return { from: startOfWeek(now, { weekStartsOn: 0 }), to: endOfWeek(now, { weekStartsOn: 0 }) };
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    default:
      return { from: startOfMonth(now), to: endOfDay(now) };
  }
}

export interface ReportFilters {
  dateRange: DateRange;
  branchIds: string[];
  statuses: OrderStatus[];
}

export interface OrderReport {
  id: string;
  order_number: string;
  customer_name: string | null;
  branch_name: string | null;
  branch_id: string | null;
  status: string;
  delivery_date: string | null;
  delivery_time: string | null;
  total_amount: number;
  payment_status: string | null;
  created_at: string;
}

export interface ReportStats {
  totalOrders: number;
  pendingApproval: number;
  inPreparation: number;
  completed: number;
  totalRevenue: number;
  revenueByBranch: { branch_id: string; branch_name: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  ordersByDate: { date: string; count: number; revenue: number }[];
}

export function useReportData(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      // Fetch orders with filters
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          delivery_date,
          delivery_time,
          total_amount,
          payment_status,
          created_at,
          branch_id,
          customer_id,
          branches(id, name),
          customers(name)
        `)
        .gte('created_at', filters.dateRange.from.toISOString())
        .lte('created_at', filters.dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      // Apply branch filter
      if (filters.branchIds.length > 0) {
        query = query.in('branch_id', filters.branchIds);
      }

      // Apply status filter
      if (filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      const { data: orders, error } = await query;
      if (error) throw error;

      // Transform data
      const reportOrders: OrderReport[] = (orders || []).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: (o.customers as { name: string } | null)?.name || null,
        branch_name: (o.branches as { id: string; name: string } | null)?.name || null,
        branch_id: o.branch_id,
        status: o.status,
        delivery_date: o.delivery_date,
        delivery_time: o.delivery_time,
        total_amount: o.total_amount,
        payment_status: o.payment_status,
        created_at: o.created_at,
      }));

      // Calculate stats
      const stats: ReportStats = {
        totalOrders: reportOrders.length,
        pendingApproval: reportOrders.filter((o) => o.status === 'pending_approval').length,
        inPreparation: reportOrders.filter((o) => ['paid', 'preparing'].includes(o.status)).length,
        completed: reportOrders.filter((o) => o.status === 'completed').length,
        totalRevenue: reportOrders.reduce((sum, o) => sum + o.total_amount, 0),
        revenueByBranch: [],
        ordersByStatus: [],
        ordersByDate: [],
      };

      // Revenue by branch
      const branchMap = new Map<string, { name: string; revenue: number; orders: number }>();
      reportOrders.forEach((o) => {
        if (o.branch_id && o.branch_name) {
          const existing = branchMap.get(o.branch_id) || { name: o.branch_name, revenue: 0, orders: 0 };
          existing.revenue += o.total_amount;
          existing.orders += 1;
          branchMap.set(o.branch_id, existing);
        }
      });
      stats.revenueByBranch = Array.from(branchMap.entries()).map(([id, data]) => ({
        branch_id: id,
        branch_name: data.name,
        revenue: data.revenue,
        orders: data.orders,
      }));

      // Orders by status
      const statusMap = new Map<string, number>();
      reportOrders.forEach((o) => {
        statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
      });
      stats.ordersByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      // Orders by date
      const dateMap = new Map<string, { count: number; revenue: number }>();
      reportOrders.forEach((o) => {
        const date = o.created_at.split('T')[0];
        const existing = dateMap.get(date) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += o.total_amount;
        dateMap.set(date, existing);
      });
      stats.ordersByDate = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return { orders: reportOrders, stats };
    },
  });
}

export const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'بانتظار الموافقة',
  awaiting_payment: 'بانتظار الدفع',
  paid: 'تم الدفع',
  preparing: 'قيد التحضير',
  ready_to_ship: 'جاهز للشحن',
  in_transit: 'في الطريق',
  ready_for_pickup: 'جاهز للاستلام',
  completed: 'مكتمل',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'غير مدفوع',
  paid: 'مدفوع',
  pending: 'معلق',
};
