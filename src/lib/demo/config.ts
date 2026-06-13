/**
 * Demo / design mode — configuration.
 *
 * This whole folder (src/lib/demo) is the ONLY place that fakes the backend.
 * It lets the frontend run and be tested with zero Supabase: see HANDOFF.md.
 *
 * DEMO_MODE is on when:
 *   • VITE_DEMO_MODE="true", OR
 *   • there is no VITE_SUPABASE_URL and it isn't explicitly disabled.
 * So a fresh checkout with no .env boots straight into design mode.
 * The backend dev sets VITE_DEMO_MODE="false" (or just adds real Supabase env).
 */
export type DemoRole =
  | 'admin'
  | 'call_center'
  | 'customer_support'
  | 'kitchen'
  | 'branch'
  | 'driver'
  | 'customer';

const explicit = import.meta.env.VITE_DEMO_MODE;

export const DEMO_MODE: boolean =
  explicit === 'true' || (explicit !== 'false' && !import.meta.env.VITE_SUPABASE_URL);

export const DEMO_ROLES: DemoRole[] = [
  'admin',
  'call_center',
  'customer_support',
  'kitchen',
  'branch',
  'driver',
  'customer',
];

export const DEMO_ROLE_LABELS: Record<DemoRole, string> = {
  admin: 'مدير',
  call_center: 'مركز اتصال',
  customer_support: 'دعم العملاء',
  kitchen: 'المطبخ',
  branch: 'الفرع',
  driver: 'السائق',
  customer: 'عميل',
};

const ROLE_KEY = 'demo-role';

/** The role the demo session is currently "logged in" as (drives ProtectedRoute). */
export function getDemoRole(): DemoRole {
  if (typeof localStorage === 'undefined') return 'admin';
  const saved = localStorage.getItem(ROLE_KEY) as DemoRole | null;
  return saved && DEMO_ROLES.includes(saved) ? saved : 'admin';
}

export function setDemoRole(role: DemoRole): void {
  localStorage.setItem(ROLE_KEY, role);
}
