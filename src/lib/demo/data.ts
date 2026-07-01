/**
 * Demo sample data. Plain objects shaped to satisfy the app's hooks/screens —
 * not the full DB schema. Edit freely to design against different content.
 */
import { getDemoRole } from './config';

const now = Date.now();
const iso = (offsetMin = 0) => new Date(now - offsetMin * 60_000).toISOString();
const today = new Date(now).toISOString().slice(0, 10);

/* ── Auth ──────────────────────────────────────────────────────────────── */
export const demoUser = {
  id: 'demo-user-0001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@pinkcake.test',
  user_metadata: { full_name: 'مستخدم تجريبي' },
  app_metadata: { provider: 'demo' },
  created_at: iso(60 * 24 * 30),
};

export const demoSession = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(now / 1000) + 3600,
  user: demoUser,
};

/* ── Catalogue ─────────────────────────────────────────────────────────── */
// Demo/placeholder product imagery (design phase). Swap for owned/CDN assets
// when the real catalogue is wired. Each cake gets a matching photo.
const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;

export const PRODUCTS = [
  { id: 'p1', name: 'كيكة الشوكولاتة الفاخرة', description: 'طبقات شوكولاتة بلجيكية مع كريمة الغاناش', price: 145, category: 'كيكات', image_url: img('1563729784474-d77dbb933a9e'), is_available: true, display_order: 1, stock: 12, occasions: ['أعياد الميلاد', 'أعراس وخطوبة', 'شكراً وامتنان'] },
  { id: 'p2', name: 'تشيز كيك التوت', description: 'تشيز كيك كريمي بصوص التوت الطازج', price: 120, category: 'تشيز كيك', image_url: img('1533134242443-d4fd215305ad'), is_available: true, display_order: 2, stock: 8, occasions: ['أعياد الميلاد', 'شكراً وامتنان'] },
  { id: 'p3', name: 'كيكة الريد فيلفت', description: 'الكلاسيكية الحمراء بكريمة الجبن', price: 135, category: 'كيكات', image_url: img('1586788680434-30d324b2d46f'), is_available: true, display_order: 3, stock: 5, occasions: ['أعراس وخطوبة', 'أعياد الميلاد'] },
  { id: 'p4', name: 'كب كيك الفانيلا', description: 'علبة 6 قطع بنكهات متنوعة', price: 75, category: 'كب كيك', image_url: img('1426869981800-95ebf51ce900'), is_available: true, display_order: 4, stock: 20, occasions: ['أعياد الميلاد', 'تخرّج ونجاح'] },
  { id: 'p5', name: 'كيكة اللوتس', description: 'بسكويت اللوتس مع كريمة الكراميل', price: 160, category: 'كيكات', image_url: img('1535141192574-5d4897c12636'), is_available: true, display_order: 5, stock: 0, occasions: ['أعياد الميلاد', 'شكراً وامتنان'] },
  { id: 'p6', name: 'ماكرون فرنسي', description: 'تشكيلة 12 قطعة ماكرون', price: 95, category: 'حلويات', image_url: img('1569864358642-9d1684040f43'), is_available: true, display_order: 6, stock: 15, occasions: ['تخرّج ونجاح', 'شكراً وامتنان', 'أعراس وخطوبة'] },
];

export const BRANCHES = [
  { id: 'b1', name: 'فرع العليا', address: 'حي العليا، الرياض', phone: '0512345678', is_active: true },
  { id: 'b2', name: 'فرع النخيل', address: 'حي النخيل، الرياض', phone: '0512345679', is_active: true },
  { id: 'b3', name: 'فرع الروضة', address: 'حي الروضة، جدة', phone: '0512345680', is_active: true },
];

/* ── Orders ────────────────────────────────────────────────────────────── */
const item = (name: string, qty: number, price: number) => ({ product_name: name, quantity: qty, unit_price: price, total_price: qty * price, notes: null });

const order = (i: number, status: string, opts: Partial<Record<string, unknown>> = {}) => ({
  id: `o${i}`,
  order_number: `ORD-${1000 + i}`,
  status,
  payment_status: status === 'awaiting_payment' ? 'unpaid' : 'paid',
  total_amount: 145 + i * 20,
  branch_id: 'b1',
  branch_name: 'فرع العليا',
  customer_id: `c${i}`,
  customer_name: ['نورة', 'سارة', 'محمد', 'عبدالله', 'ريم', 'فهد'][i % 6],
  customer_phone: '+966••••6' + (10 + i),
  tracking_code: `TRK${1000 + i}`,
  delivery_date: today,
  delivery_time: `${14 + (i % 6)}:00`,
  created_at: iso(i * 37),
  notes: i % 3 === 0 ? 'بدون مكسرات' : null,
  items: [item(PRODUCTS[i % PRODUCTS.length].name, 1 + (i % 2), PRODUCTS[i % PRODUCTS.length].price)],
  ...opts,
});

export const ORDERS = [
  order(1, 'paid'),
  order(2, 'preparing'),
  order(3, 'ready_to_ship'),
  order(4, 'in_transit'),
  order(5, 'ready_for_pickup'),
  order(6, 'completed'),
  order(7, 'awaiting_payment'),
  order(8, 'preparing'),
];

export const MY_ORDERS = [order(1, 'preparing'), order(2, 'ready_for_pickup'), order(3, 'completed')];

// Custom cakes & occasion/ضيافة orders. Pay-upfront model: the customer sees the
// price and pays at checkout, so these reach the kitchen already `paid` — the chef
// just prepares them from the attached brief (no pricing / no customer approval).
export const CUSTOM_ORDERS = [
  { id: 'co1', order_number: 'CUS-2001', customer_name: 'لمياء', customer_phone: '+966••••601', branch_name: 'فرع العليا', status: 'paid', payment_status: 'paid', total_amount: 850, order_kind: 'custom', product_type: 'كيكة زفاف', occasion: 'زواج', number_of_people: 60, flavor: 'فانيليا بوربون', filling: 'كريمة الزبدة', sugar_level: 'وسط', design_description: 'ثلاث طوابق باللونين الأبيض والذهبي مع ورود سكرية وأوراق ذهب', writing_text: 'مبارك الزواج', reference_image_url: null, pickup_date: today, pickup_time: '18:00', notes: null, created_at: iso(120) },
  { id: 'co2', order_number: 'CUS-2002', customer_name: 'خالد', customer_phone: '+966••••602', branch_name: 'فرع النخيل', status: 'preparing', payment_status: 'paid', total_amount: 320, order_kind: 'custom', product_type: 'كيكة عيد ميلاد', occasion: 'عيد ميلاد', number_of_people: 12, flavor: 'شوكولاتة بلجيكية', filling: 'نوتيلا', sugar_level: 'وسط', design_description: 'شخصية كرتونية ثلاثية الأبعاد للأطفال', writing_text: 'كل عام وأنت بخير', reference_image_url: null, pickup_date: today, pickup_time: '16:00', notes: 'بدون مكسرات', created_at: iso(300) },
  { id: 'co3', order_number: 'EVT-3001', customer_name: 'فاطمة', customer_phone: '+966••••603', branch_name: 'فرع العليا', status: 'paid', payment_status: 'paid', total_amount: 4500, order_kind: 'event', product_type: 'ضيافة مناسبة', occasion: 'حفل زفاف', number_of_people: 150, flavor: null, filling: null, sugar_level: null, design_description: null, writing_text: null, reference_image_url: null, pickup_date: today, pickup_time: '20:00', notes: 'القاعة شمال الرياض — يُفضّل التجهيز قبل الموعد بساعة', created_at: iso(60), guest_count: 150, serve_styles: ['centerpiece_cake', 'assorted_mini'], station_type: 'live', servers_needed: true, servers_count: 3, service_hours: 4, event_date: today, fulfillment_mode: 'onsite_setup' },
];

export const SUBMISSIONS = [
  { id: 's1', type: 'contact', customer_name: 'أحمد', phone: '+966••••701', email: 'a@test.co', message: 'هل تتوفر كيكات خالية من الجلوتين؟', status: 'new', internal_notes: null, created_at: iso(45) },
  { id: 's2', type: 'complaint', customer_name: 'منى', phone: '+966••••702', email: null, message: 'تأخر طلبي عن الموعد', status: 'in_progress', internal_notes: 'تم التواصل', created_at: iso(180) },
  { id: 's3', type: 'custom_order', customer_name: 'سعد', phone: '+966••••703', email: null, message: 'أريد كيكة مخصصة لتخرج', status: 'closed', internal_notes: 'تم التحويل لقسم المخصص', created_at: iso(600) },
];

export const PROFILES = [
  { id: 'demo-user-0001', user_id: 'demo-user-0001', full_name: 'مستخدم تجريبي', email: 'demo@pinkcake.test', phone: '+966••••600', roles: ['admin'], created_at: iso(60 * 24 * 30) },
  { id: 'u2', user_id: 'u2', full_name: 'شيف المطبخ', email: 'kitchen@pinkcake.test', phone: '+966••••611', roles: ['kitchen'], created_at: iso(60 * 24 * 20) },
  { id: 'u3', user_id: 'u3', full_name: 'موظف الفرع', email: 'branch@pinkcake.test', phone: '+966••••612', roles: ['branch'], created_at: iso(60 * 24 * 15) },
  { id: 'u4', user_id: 'u4', full_name: 'سائق التوصيل', email: 'driver@pinkcake.test', phone: '+966••••613', roles: ['driver'], created_at: iso(60 * 24 * 10) },
];

export const REVIEWS = [
  { id: 'r1', product_id: 'p1', customer_name: 'نورة', rating: 5, comment: 'رائعة جداً وطازجة!', created_at: iso(2000) },
  { id: 'r2', product_id: 'p1', customer_name: 'سارة', rating: 4, comment: 'لذيذة لكن حلوة قليلاً', created_at: iso(5000) },
];

export const ORDER_LOGS = [
  { id: 'l1', order_id: 'o1', action: 'تم إنشاء الطلب', status: 'paid', performed_by_name: 'مركز الاتصال', created_at: iso(120) },
  { id: 'l2', order_id: 'o1', action: 'بدأ التجهيز', status: 'preparing', performed_by_name: 'المطبخ', created_at: iso(60) },
];

export const NOTIFICATION_SETTINGS = { enabled: false, provider: 'mock', channel: 'sms', base_url: 'https://app.pinkcake.test' };

export const NOTIFICATION_LOG = [
  { id: 'n1', order_number: 'ORD-1005', status: 'ready_for_pickup', channel: 'sms', provider: 'mock', recipient: '+966••••615', send_status: 'sent', attempts: 1, error: null, created_at: iso(30) },
  { id: 'n2', order_number: 'ORD-1002', status: 'paid', channel: 'sms', provider: 'mock', recipient: '+966••••612', send_status: 'failed', attempts: 3, error: 'رقم غير صالح', created_at: iso(90) },
];

/* Tables addressed via supabase.from(...) */
export const TABLES: Record<string, Record<string, unknown>[]> = {
  products: PRODUCTS,
  branches: BRANCHES,
  orders: ORDERS,
  order_items: ORDERS.flatMap((o) => (o.items as Record<string, unknown>[]) ?? []),
  order_logs: ORDER_LOGS,
  profiles: PROFILES,
  user_roles: PROFILES.flatMap((p) => (p.roles as string[]).map((role) => ({ user_id: p.user_id, role }))),
  user_branch_assignments: [{ user_id: 'u3', branch_id: 'b1', branch_name: 'فرع العليا' }],
  notification_settings: [{ id: true, ...NOTIFICATION_SETTINGS }],
  notification_log: NOTIFICATION_LOG,
};

/** Roles for the current demo session (drives ProtectedRoute / dashboards). */
export function currentRoles(): string[] {
  return [getDemoRole()];
}
