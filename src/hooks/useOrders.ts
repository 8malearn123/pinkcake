import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Order = Tables<'orders'>;
type OrderInsert = TablesInsert<'orders'>;
type OrderUpdate = TablesUpdate<'orders'>;
type OrderItem = Tables<'order_items'>;
type OrderItemInsert = TablesInsert<'order_items'>;
type OrderStatus = Enums<'order_status'>;

export interface OrderWithDetails extends Order {
  customer?: { id: string; name: string } | null;
  branch?: { id: string; name: string; address?: string | null } | null;
  items?: OrderItem[];
}

export interface SecureOrderDetails {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  delivery_date: string | null;
  delivery_time: string | null;
  notes: string | null;
  payment_status: string | null;
  payment_link: string | null;
  tracking_code: string | null;
  created_at: string;
  updated_at: string;
  branch_id: string | null;
  branch_name: string | null;
  branch_address: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItem[] | null;
}

export interface CreateOrderData {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  branchId: string;
  deliveryDate: string;
  deliveryTime: string;
  notes?: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
}

// Use secure function for fetching orders - only admin/call_center get full details
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // Use the secure function that filters based on role
      const { data, error } = await supabase.rpc('get_orders_for_admin');

      if (error) throw error;
      
      // Transform to match OrderWithDetails format
      return (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        delivery_date: order.delivery_date,
        delivery_time: order.delivery_time,
        notes: order.notes,
        payment_status: order.payment_status,
        payment_link: order.payment_link,
        tracking_code: order.tracking_code,
        created_at: order.created_at,
        updated_at: order.updated_at,
        branch_id: order.branch_id,
        customer_id: order.customer_id,
        customer: order.customer_name ? {
          id: order.customer_id,
          name: order.customer_name,
        } : null,
        branch: order.branch_name ? {
          id: order.branch_id,
          name: order.branch_name,
          address: order.branch_address,
        } : null,
        created_by: null,
      })) as OrderWithDetails[];
    },
  });
}

// Use secure function for fetching single order - data filtered based on role
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // Use the secure function that filters based on role
      const { data, error } = await supabase.rpc('get_order_details_secure', {
        _order_id: orderId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const order = data[0];
        // Parse items from jsonb
        const items = order.items ? (order.items as any[]).map((item: any) => ({
          id: item.id,
          order_id: orderId,
          product_id: null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
          created_at: '',
        })) : [];

        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total_amount: order.total_amount,
          delivery_date: order.delivery_date,
          delivery_time: order.delivery_time,
          notes: order.notes,
          payment_status: order.payment_status,
          payment_link: order.payment_link,
          tracking_code: order.tracking_code,
          created_at: order.created_at,
          updated_at: order.updated_at,
          branch_id: order.branch_id,
          customer_id: order.customer_id,
        customer: order.customer_name ? {
          id: order.customer_id,
          name: order.customer_name,
        } : null,
        branch: order.branch_name ? {
          id: order.branch_id,
          name: order.branch_name,
          address: order.branch_address,
        } : null,
        items,
        created_by: null,
      } as OrderWithDetails;
      }

      return null;
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      // Use secure RPC to upsert customer (Admin/Call Center only)
      const { data: customerId, error: customerError } = await supabase.rpc(
        'upsert_customer_by_phone',
        {
          _name: orderData.customerName,
          _phone: orderData.customerPhone,
          _address: orderData.customerAddress || null,
        }
      );

      if (customerError) throw customerError;
      if (!customerId) throw new Error('فشل إنشاء العميل');

      // Calculate total amount
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // Generate order number
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          branch_id: orderData.branchId,
          delivery_date: orderData.deliveryDate,
          delivery_time: orderData.deliveryTime,
          notes: orderData.notes,
          total_amount: totalAmount,
          created_by: user?.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems: OrderItemInsert[] = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'تم إنشاء الطلب',
        description: 'تم إنشاء الطلب بنجاح',
      });
    },
    onError: (error) => {
      console.error('Create order error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الطلب: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: OrderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', data.id] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الطلب بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الطلب: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Generate a tracking-based payment link for an order and copy it to the
 * clipboard. Frontend-only: the link points at the customer tracking page
 * (`/track?code=…`) and the `payment_link` column is set so the record
 * carries it. HANDOFF: replace with a real gateway URL (Moyasar/Tap/HyperPay)
 * once the payment backend exists.
 */
export function useSendPaymentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, trackingCode }: { orderId: string; trackingCode: string }) => {
      const link = `${window.location.origin}/track?code=${encodeURIComponent(trackingCode)}`;
      const { error } = await supabase
        .from('orders')
        .update({ payment_link: link })
        .eq('id', orderId);
      if (error) throw error;
      return link;
    },
    onSuccess: async (link) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      let copied = false;
      try {
        await navigator.clipboard?.writeText(link);
        copied = true;
      } catch {
        /* clipboard blocked (perms/insecure context) — link is still shown below */
      }
      toast({
        title: copied ? 'تم إنشاء رابط الدفع ونسخه' : 'تم إنشاء رابط الدفع',
        description: link,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'تعذّر إنشاء رابط الدفع: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', data.id] });
      toast({
        title: 'تم تحديث الحالة',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة الطلب: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الطلب بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الطلب: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useOrderLogs(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order-logs', orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('order_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}
