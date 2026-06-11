export type OrderStatus = 
  | 'pending_approval'        // بانتظار اعتماد العميل
  | 'awaiting_payment'        // بانتظار الدفع
  | 'paid'                    // تم الدفع
  | 'preparing'               // قيد التجهيز بالمطبخ
  | 'ready_to_ship'           // جاهز للإرسال
  | 'in_transit'              // في طريقه للفرع
  | 'ready_for_pickup'        // جاهز للاستلام
  | 'completed'               // تم الاستلام
  | 'custom_pending_review'   // طلب مخصص - بانتظار مراجعة الشيف
  | 'custom_chef_approved'    // طلب مخصص - تمت موافقة الشيف
  | 'custom_rejected'         // طلب مخصص - مرفوض
  | 'sent_to_chef'            // طلب مخصص - تم الإرسال للشيف
  | 'chef_priced'             // طلب مخصص - تم التسعير
  | 'pricing_sent_to_customer' // طلب مخصص - تم إرسال السعر للعميل
  | 'customer_accepted'       // طلب مخصص - قبل العميل السعر
  | 'customer_rejected';      // طلب مخصص - رفض العميل السعر

export type UserRole = 'admin' | 'call_center' | 'kitchen' | 'branch' | 'customer';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  // customerPhone removed - sensitive data only accessible via secure reveal functions
  branchId: string;
  branchName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  pickupDate: string;
  pickupTime: string;
  paymentLink?: string;
  paymentStatus: 'unpaid' | 'paid' | 'failed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
  trackingCode: string;
}

export interface OrderLog {
  id: string;
  orderId: string;
  action: string;
  status: OrderStatus;
  performedBy: string;
  performedByRole: UserRole;
  timestamp: string;
  details?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_approval: 'بانتظار اعتماد العميل',
  awaiting_payment: 'بانتظار الدفع',
  paid: 'تم الدفع',
  preparing: 'قيد التجهيز',
  ready_to_ship: 'جاهز للإرسال',
  in_transit: 'في الطريق للفرع',
  ready_for_pickup: 'جاهز للاستلام',
  completed: 'تم الاستلام',
  custom_pending_review: 'طلب مخصص - بانتظار المراجعة',
  custom_chef_approved: 'طلب مخصص - تمت الموافقة',
  custom_rejected: 'طلب مخصص - مرفوض',
  sent_to_chef: 'طلب مخصص - أُرسل للشيف',
  chef_priced: 'طلب مخصص - تم التسعير',
  pricing_sent_to_customer: 'طلب مخصص - بانتظار رد العميل',
  customer_accepted: 'طلب مخصص - قُبل السعر',
  customer_rejected: 'طلب مخصص - رُفض السعر',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_approval: 'status-pending',
  awaiting_payment: 'status-awaiting-payment',
  paid: 'status-paid',
  preparing: 'status-preparing',
  ready_to_ship: 'status-ready-to-ship',
  in_transit: 'status-in-transit',
  ready_for_pickup: 'status-ready-pickup',
  completed: 'status-completed',
  custom_pending_review: 'status-custom-pending',
  custom_chef_approved: 'status-custom-approved',
  custom_rejected: 'status-custom-rejected',
  sent_to_chef: 'status-custom-pending',
  chef_priced: 'status-custom-approved',
  pricing_sent_to_customer: 'status-awaiting-payment',
  customer_accepted: 'status-paid',
  customer_rejected: 'status-custom-rejected',
};
