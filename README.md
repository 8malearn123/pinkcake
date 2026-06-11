# Pink Cake — نظام إدارة الطلبات 🎂

An Arabic-first, RTL cake-shop management platform: a public storefront, a custom-cake
ordering workflow with chef pricing, and role-based operations dashboards (kitchen,
branch, driver, call center, support, admin) backed by Supabase.

> Working agreements, RTL rules, and the per-feature Definition of Done live in
> `08-enhancement-and-polish-plan.md`. The visual language lives in
> `DESIGN_SYSTEM.md` and the live guide at `/design-system` (admin-only).

## Stack

- **Build/UI:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix)
- **Data:** Supabase (Postgres + RLS, Auth, Edge Functions, Realtime)
- **State/forms:** TanStack Query, React Router v6, react-hook-form + zod
- **Extras:** framer-motion, recharts, date-fns, html5-qrcode, xlsx

## Prerequisites

- Node **≥ 20** (see `.nvmrc`)
- **npm** (the single supported package manager — there is one `package-lock.json`)

## Setup

```sh
git clone https://github.com/uxsalem/Pink_Cacke.git
cd Pink_Cacke
nvm use            # optional, picks up .nvmrc
npm ci
cp .env.example .env   # then fill in your Supabase project values
npm run dev            # http://localhost:8080
```

## Environment variables

All are build-time `VITE_*` values (exposed to the browser — that is expected; the anon
key is RLS-protected). See `.env.example`. **Never** commit a real `.env`; the
service-role key belongs only in Edge Functions.

| Var | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key (public by design) |
| `VITE_ENABLE_LOZA` | Toggle the experimental Loza marketplace (`/loza/*`). Defaults: on in dev, off in prod |

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Dev server on :8080 |
| `npm run build` | Production build |
| `npm run lint` | ESLint over the repo |
| `npm run check:rtl` | RTL guardrail (§1.7) — fails on new physical-direction utilities |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run verify` | `check:rtl` + `lint` + `test` (run before pushing) |
| `npm run preview` | Preview the production build |

## Roles & demo accounts

Seven roles (Postgres enum `app_role`): `admin`, `call_center`, `kitchen`, `branch`,
`driver`, `customer_support`, `customer`. Routing/landing per role lives in
`src/hooks/useRoleRedirect.ts`; access is gated by `ProtectedRoute`.

Demo accounts (seeded by the latest migration) — password **`Demo1234!`**:

| Email | Role | Lands on |
|---|---|---|
| `admin@demo.com` | admin | `/dashboard` |
| `callcenter@demo.com` | call_center | `/dashboard` |
| `kitchen@demo.com` | kitchen | `/kitchen` |
| `branch@demo.com` | branch | `/branch-orders` |
| `driver@demo.com` | driver | `/driver` |
| `support@demo.com` | customer_support | `/submissions` |
| `customer@demo.com` | customer | `/store` |

## Architecture

```
src/
  pages/              Route components (thin; logic lives in hooks)
    loza/             Experimental marketplace (flag-gated, isolated theme/cart)
  components/
    ui/               shadcn primitives
    ds/               Design-system primitives (PageHeader, StatTile, EmptyState, …)
    <domain>/         Feature components (orders, branches, products, …)
  hooks/              One hook per domain; TanStack Query with stable queryKeys
  contexts/           Auth, Settings, Impersonation, LozaCart (Loza-scoped)
  integrations/supabase/  client.ts + generated types.ts
  lib/                Pure helpers (e.g. orderWorkflow.ts state machine)
  types/              Shared types (order.ts: statuses, labels, colors)
supabase/
  migrations/         Timestamped SQL (schema, RLS, SECURITY DEFINER RPCs)
  functions/          Edge Functions (admin-impersonate, create-user, submit-contact)
```

### Conventions (condensed)

- **Security:** RLS on every table; client uses the **anon key only**. Sensitive reads
  go through `get_*_secure` / role-scoped RPCs — never raw `from('table').select()`.
  Order status transitions go through RPCs that validate role + current status and write
  `order_logs`. Customer phone is masked by default (audited reveal only).
- **Data:** one hook per domain; stable `queryKey` arrays; invalidate affected keys in
  `onSuccess`. Every mutation shows an Arabic success/error toast (`destructive` on error).
- **UI:** Arabic, RTL. Design tokens only — no hardcoded colors; status colors via
  `ORDER_STATUS_COLORS`. Use **logical** Tailwind utilities (`ps`/`pe`, `ms`/`me`,
  `start`/`end`) — `npm run check:rtl` enforces this.
- **Forms:** react-hook-form + zod; Arabic validation messages.

### Supabase migration workflow

1. Add one timestamped SQL file under `supabase/migrations/` (schema + RLS policies +
   `SECURITY DEFINER` functions with explicit role checks).
2. Regenerate `src/integrations/supabase/types.ts` from the updated schema.
3. A new order status requires **simultaneous** updates to the enum, `src/types/order.ts`
   (label + color), the timeline components, and any status filters (§1.2). Prefer
   `order_logs` action types over new enum values for sub-stages.

## Testing

Vitest + Testing Library (jsdom). The baseline covers the order state machine, status
constants integrity, an RPC-hook invalidation test, a `Cake2DPreview` smoke render, and
an **RTL shell smoke test** that fails if the nav sidebar ever leaves the right side.
CI (`.github/workflows/ci.yml`) runs `check:rtl → lint → test → build` on every PR.
