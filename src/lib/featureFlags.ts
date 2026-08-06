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

/**
 * Order notifications admin UI (Track T4). Controls whether the "Notifications"
 * tab is shown in Settings; the actual sending is gated server-side by the
 * `notification_settings.enabled` row. Shown by default — set
 * VITE_ENABLE_NOTIFICATIONS="false" to hide the tab entirely.
 */
export const NOTIFICATIONS_UI_ENABLED: boolean =
  import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false';

/**
 * Supabase Storage image transformation (`/render/image/...`), used by
 * `@/lib/productImages` to serve card-sized product photos instead of the
 * full-resolution originals.
 *
 * OFF by default and opt-in, because the rendering endpoint is only available
 * on paid Supabase plans — enabling it on a plan without it would 400 every
 * product photo. New uploads are downscaled client-side regardless, so this
 * flag only matters for photos uploaded before that was in place.
 *   - VITE_IMAGE_TRANSFORM="true" → on
 *   - anything else               → off (URLs are passed through untouched)
 */
export const IMAGE_TRANSFORM_ENABLED: boolean =
  import.meta.env.VITE_IMAGE_TRANSFORM === 'true';
