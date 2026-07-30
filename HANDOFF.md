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

## Storefront cart & product details (frontend-only)

The public storefront cart lives entirely in the client: `StoreCartProvider`
(`src/contexts/StoreCartContext.tsx`) holds it as React state and is shared across
the landing page (`/`, `/store`) and the product details page (`/product/:id`).
No backend is involved until checkout, which still calls the existing
`create_customer_order` RPC. Nothing here needs wiring — the data it renders comes
from the same `get_products_for_public_store` / `get_product_rating` RPCs the store
already uses.

The **wishlist** (`StoreWishlistProvider`, `src/contexts/StoreWishlistContext.tsx`,
page `/wishlist`) is likewise frontend-only — saved items persist to
`localStorage` (key `pinkcake:wishlist:v1`). To make it account-bound, swap the
localStorage read/write for a server-side list keyed by `product_id` (e.g.
`get_my_wishlist` / `toggle_my_wishlist` RPCs); the UI contract (`items`, `has`,
`toggle`, `remove`, `count`) stays the same.

The **catalog** (`/shop`, page `src/pages/Shop.tsx`) filters/sorts the products
query client-side via URL params (`?q`, `?category`, `?sort`, `?occasion`). The
`occasion` param currently only *frames* the page (heading) and shows the full
range, since products carry no occasion metadata yet. When the catalogue gains
occasion tags, filter `results` by `occasion` in `Shop.tsx` — the URL contract
stays the same.

## Cake design catalog (browser-local)

The admin section **«تصميم الكيك»** (`/cake-design`, `src/pages/CakeDesign.tsx`) does
**not** talk to Supabase at all yet. It is the only feature in the app with its own
private storage:

| What | Where |
|---|---|
| Metadata (levels, values, cakes, image records) | `localStorage` key `pinkcake:cake-catalog:v1`, one JSON document |
| Image bytes | IndexedDB database `pinkcake-cake-catalog`, object store `images`, key = image id → `Blob` |
| Displayable URLs | `URL.createObjectURL`, minted and revoked by the store |

Consequences to be honest about: the catalog is **per-browser and per-profile**.
Two staff on two laptops have two unrelated catalogs, "clear browsing data" destroys
it, incognito loses it on close, and Safari evicts IndexedDB after ~7 idle days. The
page says so under its header.

The storefront studio `/customize` (`src/pages/CakeCustomizer.tsx`) reads this same
catalog read-only via `src/hooks/useCatalogSession.ts`: the gallery shows only cakes
with a preview + photographed first step, an option is offered **only when its
combination has a photo**, and the stage shows the deepest photographed match. The
old CSS-art builder (`cakeBuilder.ts`) is deleted; `src/test/no-cake-art.test.ts`
gates its return. The kitchen brief (`src/components/cake/CakeDesignPreview.tsx`)
renders new designs from their Arabic labels (photos are per-browser and don't
travel), and orders placed under the old catalog render a frozen-label text brief
via `LEGACY_OPTION_LABELS` in `src/lib/cakeStudio.ts` — do not delete that map;
paid orders reference those ids forever.

**The seam** is `CakeCatalogStore` in `src/lib/cakeCatalog/store.ts` — six methods
(`load`, `saveCatalog`, `putImage`, `deleteImages`, `reset`, `dispose`). It hands
back *URLs*, never Blobs, which is what makes a Supabase adapter a drop-in:

- `load()` → select `cake_levels` / `cake_level_values` / `cakes` / `cake_images`,
  then `storage.from('cake-variants').getPublicUrl()` per image
- `putImage()` → `storage.upload()` under the key from `imageStorageKey(cakeId, path)`
  (`cake-<cakeId>--<valueId>--<valueId>`, derived and traceable)
- `deleteImages()` → `storage.remove()`; `dispose()` → a no-op

Swap the implementation in `CakeCatalogProvider`
(`src/contexts/CakeCatalogContext.tsx`, `getStore()`) and nothing else changes: every
mutation in `src/lib/cakeCatalog/catalog.ts` is pure and already returns
`{ catalog, deadImageIds, clearedPreviewCakeIds }`, so a SQL adapter has the exact
deltas it needs instead of a whole-document write.

Bump `SCHEMA_VERSION` in `src/lib/cakeCatalog/types.ts` (and push the old key onto
`LEGACY_META_KEYS`) whenever the shape or the seed changes — the store then wipes,
reseeds, and clears the stale blobs.

## Quick checklist

- [ ] Add real Supabase env, set `VITE_DEMO_MODE="false"`
- [ ] Apply migrations (`supabase db push`) and regenerate
      `src/integrations/supabase/types.ts`
- [ ] Confirm `get_my_roles` returns each role; verify each role's screens load
- [ ] Deploy Edge Functions (incl. `send-notification` — see `docs/notifications.md`)
- [ ] Smoke-test create-order → kitchen → branch → pickup against real data
- [ ] **CC1 payment link** — `useSendPaymentLink` builds a `/track?code=…` URL and
      writes `orders.payment_link`. Replace with a real gateway checkout URL
      (Moyasar/Tap/HyperPay) and confirm the customer can pay from it.
- [ ] **C1 checkout payment** — the checkout has a payment-method step and a
      `mock_capture_payment` RPC (`useCapturePayment`) that fakes a processing →
      paid transition. Wire a real gateway (Moyasar/Tap/HyperPay) to replace
      `mock_capture_payment`, and have `create_customer_order` persist the chosen
      `_payment_method` + resulting payment status.
- [ ] **C7 product gallery** — add an `images text[]` column to `products` and
      return it from the product RPCs. ProductDetails renders a thumbnail gallery
      from `images` and falls back to `image_url` when it's empty.
- [ ] **Cake design catalog** — move `/cake-design` off browser-local storage:
      tables mirroring `src/lib/cakeCatalog/types.ts` plus a `cake-variants`
      storage bucket, then a Supabase implementation of `CakeCatalogStore`. Until
      then the catalog does not leave the browser it was authored in.
- [ ] **Designed-cake order payload** — the client now sends each `_items` line
      with `cake_design` (see `src/lib/orderItems.ts` and `CartCakeDesign` in
      `src/lib/cakeStudio.ts`) and `product_id: null` for designed cakes
      (`custom-…` ids fail the RPC's `::uuid` cast). The backend must:
      `ALTER TABLE order_items ADD COLUMN cake_design jsonb` + make `product_id`
      nullable + persist both in `create_customer_order`; select `cake_design`
      from `get_custom_orders_for_review`; and route storefront design lines
      into the chef's queue — today they land in `orders`/`order_items`, which
      the kitchen's custom tab never reads. `pushCustomerOrder` in
      `src/lib/demo/data.ts` is the demo-only model of that routing (it also
      persists to sessionStorage because the demo role switcher reloads).
- [ ] **A4 impersonation** — the banner now says "عرض فقط" because admin
      impersonation is view-only: RLS still runs as the admin. For true
      role-scoped impersonation, add server-side session/role switching so RLS
      applies as the impersonated user, then relax the caveat.
- [ ] Remove `src/lib/demo/` + the two `DEMO_MODE` branches once green
