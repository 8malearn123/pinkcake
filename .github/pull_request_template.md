## Summary

<!-- What and why. Link the task card ID from 08-enhancement-and-polish-plan.md. -->

## Branch / role / status impact

<!-- Which branches, which roles, which order statuses does this touch? -->

## Definition of Done (§1.3)

- [ ] Migration applied + `src/integrations/supabase/types.ts` regenerated (if DB changed)
- [ ] RPC/policy tested for **each affected role**
- [ ] Hook with stable `queryKey` + invalidations on success
- [ ] UI in Arabic, token-colored, success/error toasts (`destructive` on error)
- [ ] `order_logs` / audit written where relevant
- [ ] Test notes recorded; changelog line proposed for file 06

## RTL invariants (§1.7) — required for any UI change

- [ ] Verified mentally/visually at `dir="rtl"`
- [ ] Primary nav on the **right**; mobile drawer opens from the right
- [ ] Logical utilities only (`ps`/`pe`, `ms`/`me`, `start`/`end`, `text-start`/`text-end`) — `npm run check:rtl` passes
- [ ] Directional icons flip; carousels run RTL
- [ ] Loza tokens stay scoped to Loza (no leakage either way)

## Verification

<!-- Commands run and their result: npm run verify, screenshots at 360/390/414, etc. -->
