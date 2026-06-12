/**
 * Feature flags. Keep flag reads in one place so gating is consistent and testable.
 */

/**
 * Loza — the experimental dessert marketplace (`/loza/*`). Mock-only and isolated
 * (its own theme + cart scope). Decision (08-plan F4): parked behind a flag.
 *   - VITE_ENABLE_LOZA="true"  → on
 *   - VITE_ENABLE_LOZA="false" → off
 *   - unset                    → on in dev, off in production
 */
export const LOZA_ENABLED: boolean = (() => {
  const flag = import.meta.env.VITE_ENABLE_LOZA;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return import.meta.env.DEV;
})();
