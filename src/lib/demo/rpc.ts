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
  get_my_branch: () => [{ branch_id: 'b1', branch_name: 'فرع العليا' }],
  get_my_customer_profile: () => [{
    id: d.PROFILES[0].id,
    name: d.PROFILES[0].full_name,
    phone: d.PROFILES[0].phone,
    address: 'حي الورود، شارع الأمير سلطان، الرياض',
  }],
  get_all_profiles_for_admin: () => d.PROFILES,
  get_employees_secure: () => d.PROFILES.filter((p) => !(p.roles as string[]).includes('customer')),
  get_admin_access_logs: () => [],

  // orders (staff views)
  get_orders_for_admin: () => d.ORDERS,
  get_orders_for_branch: () => d.ORDERS,
  get_branch_orders_secure: () => d.ORDERS,
  get_kitchen_orders_secure: () => d.ORDERS.filter((o) => ['paid', 'preparing', 'ready_to_ship'].includes(o.status as string)),
  get_driver_orders: () => d.ORDERS.filter((o) => ['ready_to_ship', 'in_transit'].includes(o.status as string)),
  get_priced_orders_for_support: () => d.CUSTOM_ORDERS,
  // Chef's review queue: only orders still awaiting a price.
  get_custom_orders_for_review: () =>
    d.CUSTOM_ORDERS.filter((o) => ['custom_pending_review', 'sent_to_chef'].includes(o.status as string)),
  // Chef sets feasibility + price; echo the submitted price so the toast is accurate.
  chef_review_custom_order: (a) => ({
    new_status: a?.['_feasibility'] === 'not_feasible' ? 'custom_rejected' : 'chef_priced',
    price: a?.['_proposed_price'] ?? 0,
  }),
  get_order_details_secure: (a) => d.ORDERS.find((o) => o.id === a?.['_order_id']) ?? d.ORDERS[0],
  get_order_by_tracking_code: (a) => {
    const code = a?.['_tracking_code'];
    return [d.ORDERS.find((o) => o.tracking_code === code) ?? d.ORDERS[0]];
  },
  get_order_by_pickup_code: () => d.ORDERS[4],
  get_order_logs_with_user: () => d.ORDER_LOGS,
  get_order_notes: () => [],
  get_customer_phone_audited: () => '+966512345678',
  get_profile_phone_audited: () => '+966512345678',

  // customer self-service
  get_my_orders: () => d.MY_ORDERS,
  get_my_order_details: (a) => [d.MY_ORDERS.find((o) => o.id === a?.['_order_id']) ?? d.MY_ORDERS[0]],
  get_my_pickup_code: () => 'PICK-4821',
  get_my_pricing_requests: () => d.CUSTOM_ORDERS,

  // support / submissions
  get_contact_submissions_secure: () => d.SUBMISSIONS,

  // barcodes
  get_handover_barcode: () => ({ barcode_code: 'HB-77213', barcode_type: 'kitchen_handover', is_scanned: false }),

  // event/ضيافة builder — returns a tracking code so the success screen has one
  create_event_order: () => ({ tracking_code: `EVT-${2000 + Math.floor(Math.random() * 900)}`, order_id: 'evt-demo' }),

  // storefront checkout — returns an order id + number for the confirmation screen
  create_customer_order: () => ({ order_id: 'o1', order_number: `PC-${3000 + Math.floor(Math.random() * 900)}` }),
};

export function resolveRpc(name: string, args?: Args): unknown {
  if (name in READ) return READ[name](args);
  // Unknown / write RPC → generic success so mutations don't throw in demo mode.
  return { success: true, message: 'تم تنفيذ العملية (وضع تجريبي)' };
}
