import { FlaskConical } from 'lucide-react';
import {
  DEMO_MODE,
  DEMO_ROLES,
  DEMO_ROLE_LABELS,
  getDemoRole,
  setDemoRole,
  type DemoRole,
} from '@/lib/demo/config';

/**
 * Visible only in demo mode. Marks the app as running on mock data and lets you
 * preview any role's screens. Renders nothing in real mode, so it tree-shakes
 * out of production builds.
 */

// Where each role "lands" — switching role navigates here so the change is
// actually visible (the public store looks identical for every role). Mirrors
// getRoleLandingPage in ProtectedRoute.
const ROLE_LANDING: Record<DemoRole, string> = {
  admin: '/dashboard',
  call_center: '/dashboard',
  customer_support: '/submissions',
  kitchen: '/kitchen',
  branch: '/branch-orders',
  driver: '/driver',
  customer: '/store',
};

export function DemoModeBadge() {
  if (!DEMO_MODE) return null;

  return (
    <div className="fixed bottom-4 start-4 z-[60] flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur px-3 py-1.5 shadow-lg text-xs">
      <FlaskConical className="w-4 h-4 text-primary" />
      <span className="font-semibold text-foreground">وضع تجريبي</span>
      <span className="text-muted-foreground">·</span>
      <label htmlFor="demo-role" className="sr-only">عرض كدور</label>
      <select
        id="demo-role"
        value={getDemoRole()}
        onChange={(e) => {
          const role = e.target.value as DemoRole;
          setDemoRole(role);
          // Full navigation to the role's landing page → reloads, re-evaluates
          // guards, and drops you straight into that role's screens.
          window.location.href = ROLE_LANDING[role];
        }}
        className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
        aria-label="تبديل الدور التجريبي"
      >
        {DEMO_ROLES.map((r) => (
          <option key={r} value={r}>{DEMO_ROLE_LABELS[r]}</option>
        ))}
      </select>
    </div>
  );
}
