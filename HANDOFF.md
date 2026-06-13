# Handoff — frontend → backend wiring

This repo's **frontend/UI is built and testable without any backend**. It runs on
a mock data layer ("demo mode") so design work never needs Supabase. This page is
for the engineer wiring the real backend.

## TL;DR

- **Frontend devs** run it as-is — no `.env` needed. Demo mode auto-activates and
  every screen renders on sample data.
- **To go live:** add real Supabase env and turn demo mode off. The fake backend
  lives in exactly one place — `src/lib/demo/` — behind a single flag.

## The one seam

Everything that fakes the backend is in **`src/lib/demo/`**, switched on by
`DEMO_MODE` in `src/lib/demo/config.ts`:

```
DEMO_MODE = VITE_DEMO_MODE === "true"
         || (no VITE_SUPABASE_URL && VITE_DEMO_MODE !== "false")
```

It is consumed in just two spots (both marked with comments):

1. `src/integrations/supabase/client.ts` — exports the demo client instead of the
   real one when `DEMO_MODE`.
2. `src/main.tsx` — skips the "missing env" setup screen when `DEMO_MODE`.

Nothing else in the app knows demo mode exists — every hook imports `supabase`
from the same place as always.

## Turning demo mode OFF (go live)

1. Create `.env` from `.env.example` with the real project values:
   ```
   VITE_SUPABASE_URL="https://<ref>.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>"
   VITE_SUPABASE_PROJECT_ID="<ref>"
   VITE_DEMO_MODE="false"
   ```
   (With a real `VITE_SUPABASE_URL`, demo mode is already off; `="false"` makes it
   explicit and guarantees it even in dev.)
2. Once the backend is confirmed working, you can delete `src/lib/demo/`, the
   `DemoModeBadge`, and the two `DEMO_MODE` branches above. The app needs no other
   change.

## What the backend must provide

The frontend already calls real Supabase names; demo mode just answers them with
samples. To wire the real backend, make sure these exist and return matching
shapes (the demo definitions in `src/lib/demo/` are the contract):

- **Auth:** Supabase Auth (email/password). Roles come from the `get_my_roles` RPC.
- **RPCs** (`src/lib/demo/rpc.ts` lists them all): catalogue (`get_products_*`,
  `get_branches_*`, `get_product_*`), orders (`get_orders_for_admin`,
  `get_kitchen_orders_secure`, `get_driver_orders`, `get_order_by_tracking_code`,
  …), identity (`get_my_roles`, `get_my_branch`, `get_my_customer_profile`), plus
  the write RPCs (`create_customer_order`, `kitchen_mark_order_ready`,
  `transfer_order`, …).
- **Tables** read directly (`src/lib/demo/data.ts` → `TABLES`): `products`,
  `branches`, `orders`, `order_items`, `order_logs`, `profiles`, `user_roles`,
  `user_branch_assignments`, `notification_settings`, `notification_log`.

Migrations for these live in `supabase/migrations/`; server functions in
`supabase/functions/`.

## Order notifications (T4)

The SMS/WhatsApp notification slice is already built (server-side Edge Function +
migration + admin UI). Its own deploy guide is in
[`docs/notifications.md`](docs/notifications.md).

## Quick checklist

- [ ] Add real Supabase env, set `VITE_DEMO_MODE="false"`
- [ ] Apply migrations (`supabase db push`) and regenerate
      `src/integrations/supabase/types.ts`
- [ ] Confirm `get_my_roles` returns each role; verify each role's screens load
- [ ] Deploy Edge Functions (incl. `send-notification` — see `docs/notifications.md`)
- [ ] Smoke-test create-order → kitchen → branch → pickup against real data
- [ ] Remove `src/lib/demo/` + the two `DEMO_MODE` branches once green
