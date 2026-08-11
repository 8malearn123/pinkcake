import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatSARText } from '@/lib/currency';
import type { Json } from '@/integrations/supabase/types';
import type { AnyCakeDesign, CartCakeDesign } from '@/lib/cakeStudio';

export interface CustomOrderFormData {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  branchId: string;
  pickupDate: string;
  pickupTime: string;
  productType: string;
  occasion?: string;
  numberOfPeople?: number;
  flavor?: string;
  filling?: string;
  sugarLevel?: string;
  designDescription?: string;
  writingText?: string;
  referenceImageUrl?: string;
  referenceOrderId?: string;
  notes?: string;
  /** Built in the staff cake studio — same payload the storefront produces. */
  cakeDesign?: CartCakeDesign;
}

export interface CustomOrderForReview {
  id: string;
  order_number: string;
  customer_name: string;
  branch_name: string;
  pickup_date: string;
  pickup_time: string;
  product_type: string;
  occasion: string | null;
  number_of_people: number | null;
  flavor: string | null;
  filling: string | null;
  sugar_level: string | null;
  design_description: string | null;
  writing_text: string | null;
  reference_image_url: string | null;
  notes: string | null;
  created_at: string;
  status: string;
  // The live cake design the customer built (option IDs) — rendered for the chef.
  cake_design?: AnyCakeDesign | null;
  // Pay-upfront: custom/occasion orders reach the kitchen already paid, so they
  // carry the amount the customer paid (shown for confirmation, not for pricing).
  total_amount?: number | null;
  payment_status?: string | null;
  // Event/ضيافة orders (order_kind='event') carry hospitality metadata so the
  // chef can prepare the full package, not just a single cake.
  order_kind?: string | null;
  guest_count?: number | null;
  serve_styles?: string[] | null;
  station_type?: string | null;
  servers_needed?: boolean | null;
  servers_count?: number | null;
  service_hours?: number | null;
  event_date?: string | null;
  fulfillment_mode?: string | null;
}

export interface ChefReviewData {
  orderId: string;
  feasibility: 'feasible' | 'not_feasible' | 'needs_modification';
  preparationTime: string;
  proposedPrice: number;
  notes?: string;
  rejectionReason?: string;
  customerNotes?: string;
}

export function useCreateCustomOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomOrderFormData) => {
      const { data: orderId, error } = await supabase.rpc('create_custom_order', {
        _customer_name: data.customerName,
        _customer_phone: data.customerPhone,
        _customer_address: data.customerAddress || null,
        _branch_id: data.branchId,
        _pickup_date: data.pickupDate,
        _pickup_time: data.pickupTime,
        _product_type: data.productType,
        _occasion: data.occasion || null,
        _number_of_people: data.numberOfPeople || null,
        _flavor: data.flavor || null,
        _filling: data.filling || null,
        _sugar_level: data.sugarLevel || null,
        _design_description: data.designDescription || null,
        _writing_text: data.writingText || null,
        _reference_image_url: data.referenceImageUrl || null,
        _reference_order_id: data.referenceOrderId || null,
        _notes: data.notes || null,
        // The studio payload is a plain JSON object; Supabase's generated Json
        // type just can't see that through the interface.
        _cake_design: (data.cakeDesign ?? null) as unknown as Json,
      });

      if (error) throw error;
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['custom-orders-review'] });
      toast({
        title: 'تم إنشاء الطلب المخصص',
        description: 'تم إرسال الطلب للمطبخ للمراجعة',
      });
    },
    onError: (error) => {
      console.error('Create custom order error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الطلب المخصص: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCustomOrdersForReview() {
  return useQuery({
    queryKey: ['custom-orders-review'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_custom_orders_for_review');
      if (error) throw error;
      return (data || []) as unknown as CustomOrderForReview[];
    },
    refetchInterval: 30000, // keep the chef's review queue fresh, like kitchen orders
  });
}

export function useChefReviewOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChefReviewData) => {
      const { data: result, error } = await supabase.rpc('chef_review_custom_order', {
        _order_id: data.orderId,
        _feasibility: data.feasibility,
        _preparation_time: data.preparationTime,
        _proposed_price: data.proposedPrice,
        _notes: data.notes || null,
        _rejection_reason: data.rejectionReason || null,
        _customer_notes: data.customerNotes || null,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result: { new_status?: string; price?: number } | null) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['custom-orders-review'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['priced-orders-support'] });

      const isRejected = result?.new_status === 'custom_rejected';
      toast({
        title: isRejected ? 'تم رفض الطلب' : 'تم تسعير الطلب',
        description: isRejected 
          ? 'تم إرسال الرفض لخدمة العملاء'
          : `السعر: ${formatSARText(result?.price)} - بانتظار إرسال العرض للعميل`,
      });
    },
    onError: (error) => {
      console.error('Chef review error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في مراجعة الطلب: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useConfirmCustomOrderPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('confirm_custom_order_price', {
        _order_id: orderId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'تم تأكيد السعر',
        description: 'تم تحويل الطلب لانتظار الدفع',
      });
    },
    onError: (error) => {
      console.error('Confirm price error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تأكيد السعر: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}
