/**
 * Maps Supabase RPC names → demo responses. Read RPCs (get_*) return sample
 * data; write RPCs return a generic success so flows don't error in design mode.
 */
import * as d from './data';
import { currentRoles } from './data';
import { loyaltyRpc } from './loyalty';

type Args = Record<string, unknown> | undefined;

/** The signed-in customer's own delivery address — mutable so the edit sticks. */
let demoOwnAddress: string | null = 'حي الورود، شارع الأمير سلطان، الرياض';

const READ: Record<string, (args: Args) => unknown> = {
  // catalogue
  get_products_for_public_store: () => d.PRODUCTS,
  get_products_for_authenticated_store: () => d.PRODUCTS,
  get_product_with_options: (a) => [{ ...(d.PRODUCTS.find((p) => p.id === a?.['_product_id']) ?? d.PRODUCTS[0]), options: [] }],
  // Both keyed off _product_id so the aggregate and the rows can't disagree —
  // the product page now renders the reviews themselves next to the average.
  get_product_rating: (a) => {
    const rows = d.REVIEWS.filter((r) => r.product_id === a?.['_product_id']);
    if (rows.length === 0) return [{ average_rating: 0, review_count: 0 }];
    const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
    return [{ average_rating: Math.round(avg * 10) / 10, review_count: rows.length }];
  },
  get_product_reviews: (a) => d.REVIEWS.filter((r) => r.product_id === a?.['_product_id']),
  get_my_product_review: () => null,
  get_branches_for_public_store: () => d.BRANCHES,
  get_branches_for_authenticated_store: () => d.BRANCHES,

  // identity / role
  get_my_roles: () => currentRoles(),
  get_my_branch: () => [{ id: 'b1', name: 'فرع العليا' }],
  // Own-profile view. Reads `phone_full`, not the masked `phone`: this is the
  // customer looking at her own record, and the mask is a staff-side control —
  // the edit form was otherwise pre-filled with «+966••••600» and would have
  // saved the bullets back on the first submit.
  get_my_customer_profile: () => [{
    id: d.PROFILES[0].id,
    name: d.PROFILES[0].full_name,
    phone: d.PROFILES[0].phone_full,
    address: demoOwnAddress,
  }],
  // Persists in demo so «احفظ التغييرات» actually changes the greeting and the
  // meta pills; unmapped writes return a bare success and the page would snap
  // back to the seed on the next fetch.
  update_my_customer_profile: (a) => {
    const name = String(a?.['_name'] ?? '').trim();
    const phone = String(a?.['_phone'] ?? '').trim();
    if (name) d.PROFILES[0].full_name = name;
    if (phone) d.PROFILES[0].phone_full = phone;
    demoOwnAddress = (a?.['_address'] as string | null) ?? null;
    return { success: true, message: 'تم تحديث بياناتك (وضع تجريبي)' };
  },
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
  // Staff customer lookup — returns 0 or 1 rows, like search_customer_by_phone.
  search_customer_by_phone: (a) => d.findCustomerByPhone(a?.['_phone']),
  get_customer_phone_audited: (a) => {
    const order = d.ORDERS.find((o) => o.id === a?.['_order_id'] || o.customer_id === a?.['_customer_id']);
    return (order?.customer_phone_full as string) ?? '+966512345678';
  },
  // Driver manual "mark delivered" fallback when the customer barcode can't be scanned.
  driver_mark_delivered: (a) => {
    d.mutateOrderStatus(a?.['_order_id'], { status: 'completed' });
    return { success: true, message: 'تم تأكيد التسليم' };
  },
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
  // Persist submission edits (status/notes/resolution/linked-order) in place so
  // support changes survive a refetch in demo. Only patches keys that are sent.
  update_contact_submission_secure: (a) => {
    const row = d.SUBMISSIONS.find((s) => s.id === a?.['_submission_id']) as Record<string, unknown> | undefined;
    if (row && a) {
      if ('_status' in a) row.status = a['_status'];
      if ('_internal_notes' in a) row.internal_notes = a['_internal_notes'];
      if ('_resolution_type' in a) row.resolution_type = a['_resolution_type'];
      if ('_linked_order_id' in a) row.linked_order_id = a['_linked_order_id'];
    }
    return { success: true };
  },

  // barcodes
  // Real RPC returns the barcode CODE (a string) — the display renders it directly
  // (QR + <code>), so returning an object here crashes React (#31).
  get_handover_barcode: () => 'HB-77213',
  generate_handover_barcode: () => 'HB-77213',

  // event/ضيافة builder — returns a tracking code so the success screen has one
  create_event_order: () => ({ tracking_code: `EVT-${2000 + Math.floor(Math.random() * 900)}`, order_id: 'evt-demo' }),

  // storefront checkout — appends to the demo orders (and, when a line carries a
  // cake_design, to the chef's custom queue) so the session's own checkout is
  // visible downstream, then returns the confirmation envelope.
  //
  // المكافأة تُصرف هنا لا في نداء منفصل، مطابقةً للدالة الحقيقية: طلب يُنشأ
  // ومكافأة لا تُصرف (أو العكس) هو بالضبط ما تمنعه المعاملة الواحدة.
  create_customer_order: (a) => {
    const res = d.pushCustomerOrder(a) as Record<string, unknown>;
    const rewardCode = a?.['_reward_code'];
    if (rewardCode) {
      const name = loyaltyRpc.__captureReward({ _code: rewardCode });
      if (name) return { ...res, reward_applied: name };
    }
    return res;
  },
  // mock payment capture — returns a "paid" envelope so checkout can show a
  // processing → paid transition without a real gateway (see HANDOFF).
  mock_capture_payment: () => ({
    status: 'paid',
    transaction_id: `TXN-${100000 + Math.floor(Math.random() * 900000)}`,
    message: 'تم الدفع بنجاح',
  }),
  // coupon validation — fixed demo codes → % or SAR off. Real backend replaces
  // this with a coupons table lookup (admin CRUD is task A2).
  validate_coupon: (a) => {
    const code = String(a?.['_code'] ?? '').trim().toUpperCase();
    const coupons: Record<string, { kind: 'percent' | 'fixed'; value: number }> = {
      CAKE15: { kind: 'percent', value: 15 }, // the storefront's single headline first-order welcome code
      WELCOME10: { kind: 'percent', value: 10 },
      SWEET15: { kind: 'percent', value: 15 },
      PINK25: { kind: 'fixed', value: 25 },
    };
    const match = coupons[code];
    if (!match) return { valid: false, message: 'رمز غير صالح أو منتهي الصلاحية' };
    return { valid: true, code, kind: match.kind, value: match.value, message: 'تم تطبيق الكوبون' };
  },

  // «دائرة المناسبات» — حالة حقيقية قابلة للتغيّر في `./loyalty.ts`، لا ردود
  // ثابتة، وإلا بدت المناسبات تُحفظ والمكافآت تُصرف بلا أن يتغيّر شيء.
  ...loyaltyRpc,
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
