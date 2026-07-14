/**
 * Maps Supabase RPC names → demo responses. Read RPCs (get_*) return sample
 * data; write RPCs return a generic success so flows don't error in design mode.
 */
import * as d from './data';
import { currentRoles } from './data';

type Args = Record<string, unknown> | undefined;

const READ: Record<string, (args: Args) => unknown> = {
  // catalogue
  get_products_for_public_store: () => d.PRODUCTS,
  get_products_for_authenticated_store: () => d.PRODUCTS,
  get_product_with_options: (a) => [{ ...(d.PRODUCTS.find((p) => p.id === a?.['_product_id']) ?? d.PRODUCTS[0]), options: [] }],
  get_product_rating: () => [{ average_rating: 4.6, review_count: d.REVIEWS.length }],
  get_product_reviews: () => d.REVIEWS,
  get_my_product_review: () => null,
  get_branches_for_public_store: () => d.BRANCHES,
  get_branches_for_authenticated_store: () => d.BRANCHES,

  // identity / role
  get_my_roles: () => currentRoles(),
  get_my_branch: () => [{ id: 'b1', name: 'فرع العليا' }],
  get_my_customer_profile: () => [{
    id: d.PROFILES[0].id,
    name: d.PROFILES[0].full_name,
    phone: d.PROFILES[0].phone,
    address: 'حي الورود، شارع الأمير سلطان، الرياض',
  }],
  get_all_profiles_for_admin: () => d.PROFILES,
  // "Employees" = anyone with a non-customer role (derived from the live roles table).
  get_employees_secure: () =>
    d.PROFILES.filter((p) =>
      d.USER_ROLES.some((r) => r.user_id === (p.user_id ?? p.id) && r.role !== 'customer'),
    ),
  get_admin_access_logs: () => [],

  // orders (staff views)
  get_orders_for_admin: () => d.ORDERS,
  get_orders_for_branch: () => d.ORDERS.filter((o) => ['in_transit', 'ready_for_pickup', 'completed'].includes(o.status as string)),
  get_branch_orders_secure: () => d.ORDERS.filter((o) => ['in_transit', 'ready_for_pickup', 'completed'].includes(o.status as string)),
  get_kitchen_orders_secure: () => d.ORDERS.filter((o) => ['paid', 'preparing', 'ready_to_ship'].includes(o.status as string)),
  get_driver_orders: () => d.ORDERS.filter((o) => ['ready_to_ship', 'in_transit'].includes(o.status as string)),
  get_priced_orders_for_support: () => d.CUSTOM_ORDERS,
  // Kitchen's custom/occasion prep queue. Pay-upfront model: these orders are
  // already paid, so the chef just prepares them (paid → preparing → ready_to_ship).
  get_custom_orders_for_review: () =>
    d.CUSTOM_ORDERS.filter((o) => ['paid', 'preparing', 'ready_to_ship'].includes(o.status as string)),
  // Kitchen prep actions — mutate demo state so the card actually moves across the board.
  kitchen_mark_order_ready: (a) => {
    d.mutateOrderStatus(a?.['_order_id'], { status: 'ready_to_ship' });
    return { success: true, barcode_code: 'HB-77213', message: 'تم تجهيز الطلب وإنشاء باركود التسليم' };
  },
  kitchen_send_to_branch: (a) => {
    d.mutateOrderStatus(a?.['_order_id'], { status: 'in_transit' });
    return { success: true, message: 'تم إرسال الطلب للفرع بنجاح' };
  },
  // Real RPC returns rows — wrap in an array so useOrder's data[0] resolves (else "not found").
  get_order_details_secure: (a) => [d.ORDERS.find((o) => o.id === a?.['_order_id']) ?? d.ORDERS[0]],
  get_order_by_tracking_code: (a) => {
    const code = a?.['_tracking_code'];
    return [d.ORDERS.find((o) => o.tracking_code === code) ?? d.ORDERS[0]];
  },
  get_order_by_pickup_code: () => d.ORDERS[4],
  get_order_logs_with_user: () => d.ORDER_LOGS,
  get_order_notes: () => [],
  get_customer_phone_audited: () => '+966512345678',
  // Reveal-phone (audited) — return the target profile's real number.
  get_profile_phone_audited: (a) => {
    const id = a?.['_profile_id'];
    const p = d.PROFILES.find((x) => x.id === id || x.user_id === id);
    return (p?.phone_full as string) ?? '+966512345678';
  },

  // customer self-service
  get_my_orders: () => d.MY_ORDERS,
  get_my_order_details: (a) => [d.MY_ORDERS.find((o) => o.id === a?.['_order_id']) ?? d.MY_ORDERS[0]],
  get_my_pickup_code: () => 'PICK-4821',
  get_my_pricing_requests: () => d.CUSTOM_ORDERS,

  // support / submissions
  get_contact_submissions_secure: () => d.SUBMISSIONS,

  // barcodes
  // Real RPC returns the barcode CODE (a string) — the display renders it directly
  // (QR + <code>), so returning an object here crashes React (#31).
  get_handover_barcode: () => 'HB-77213',
  generate_handover_barcode: () => 'HB-77213',

  // event/ضيافة builder — returns a tracking code so the success screen has one
  create_event_order: () => ({ tracking_code: `EVT-${2000 + Math.floor(Math.random() * 900)}`, order_id: 'evt-demo' }),

  // storefront checkout — returns an order id + number for the confirmation screen
  create_customer_order: () => ({ order_id: 'o1', order_number: `PC-${3000 + Math.floor(Math.random() * 900)}` }),
  // mock payment capture — returns a "paid" envelope so checkout can show a
  // processing → paid transition without a real gateway (see HANDOFF).
  mock_capture_payment: () => ({
    status: 'paid',
    transaction_id: `TXN-${100000 + Math.floor(Math.random() * 900000)}`,
    message: 'تم الدفع بنجاح',
  }),
};

export function resolveRpc(name: string, args?: Args): unknown {
  if (name in READ) return READ[name](args);
  // Unknown / write RPC → generic success so mutations don't throw in demo mode.
  return { success: true, message: 'تم تنفيذ العملية (وضع تجريبي)' };
}

/**
 * Maps Supabase Edge Function names → demo `{ data, error }` envelopes. The
 * user-management functions actually mutate demo state so the admin flows work;
 * everything else returns a generic success.
 */
export function resolveFunction(
  name: string,
  body?: Record<string, unknown>,
): { data: unknown; error: null } {
  switch (name) {
    case 'create-user':
      return { data: d.createDemoUser(body), error: null };
    case 'admin-impersonate': {
      if (body?.['action'] === 'end') return { data: { success: true }, error: null };
      const impersonatedUser = d.getDemoImpersonation(body?.['targetUserId']);
      if (!impersonatedUser) return { data: { error: 'تعذّر الدخول: المستخدم غير موجود' }, error: null };
      return { data: { success: true, adminId: d.demoUser.id, impersonatedUser }, error: null };
    }
    default:
      return { data: { success: true }, error: null };
  }
}
