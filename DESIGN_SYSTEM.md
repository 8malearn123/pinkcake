# Pink Cake Design System

The single source of truth for look, feel, and tone across every screen.
Living style guide (rendered, admin-only): **`/design-system`** · DS components: **`src/components/ds/`**

---

## 1. Brand essence

Pink Cake is a **warm, feminine, pastry-luxe** brand. Every screen — even the kitchen dashboard — should feel like it belongs to a boutique cake shop: soft rose surfaces, generous rounding, gentle motion, and friendly Arabic copy. Professional, never sterile; sweet, never childish.

The product has three faces sharing one system:

| Face | Routes | Personality |
|---|---|---|
| **Staff console** | `/dashboard`, `/kitchen`, `/orders`… | Calm, efficient, data-first. Rose-tinted neutrals, one pink CTA per screen. |
| **Public store** | `/`, `/store`, `/customize`, `/track` | Expressive and appetizing. Gradients, hero imagery, decorative motion allowed. |
| **Loza marketplace** | `/loza/*` | Separate sub-brand: gold / cream / brown, Tajawal font. Never leaks outside `/loza`. |

---

## 2. Color

**The one rule: every color comes from a token.** Primary colors are user-configurable at runtime (Settings → CSS variables), so any hardcoded palette class (`text-blue-600`, `bg-green-100`…) breaks theming and dark mode.

### Core tokens (defined in `src/index.css`, mapped in `tailwind.config.ts`)

| Token | Use for |
|---|---|
| `primary` / `primary-foreground` | Buttons, links, focus rings, active nav |
| `accent` | Deeper rose for gradients and highlights |
| `secondary`, `muted`, `muted-foreground` | Quiet surfaces and secondary text |
| `background`, `card`, `popover`, `border`, `input`, `ring` | Structure |
| `destructive` | Errors, deletion, rejection — nothing else |
| `success`, `warning` (+`-foreground`), `info` (+`-foreground`) | Feedback & stat tones |
| `pink`, `pink-light`, `pink-dark`, `rose`, `blush` | Brand extras (gradients, decorative) |
| `sidebar-*` | Dark sidebar scale — sidebar only |

Tints come from opacity modifiers, not new colors: `bg-success/10 text-success`.

### Semantic meaning

- **success** — paid, completed, accepted
- **warning** — waiting states (approval, payment, response)
- **info** — in progress (preparing, in transit)
- **destructive** — rejected, failed, overdue, delete actions
- **primary** — totals, featured numbers, the main thing on screen

### Gradients & special surfaces

`gradient-pink` (CTA + icon boxes) · `gradient-blush-warm` / `gradient-rose-deep` (store heroes) · `gradient-cocoa` (dark store sections) · `glass-card` (default staff card surface).

### Order status

Order status colors live in one place: the `status-*` utility classes in `index.css`, consumed **only** through `<StatusBadge status={...} />`. Never hand-build a status chip; never repurpose status classes for other meanings.

---

## 3. Typography

Default body font is **Cairo** (set on `<body>`), the app is **RTL** (`<html dir="rtl">`).

| Role | Classes | Notes |
|---|---|---|
| Page title (h1) | `text-3xl font-bold` | One per page, via `<PageHeader />` |
| Section title (h2) | `text-xl font-bold` | Via `<SectionHeading />` / `<SectionCard />` |
| Card/field title | `font-semibold` | |
| Body | default (`text-base`) | |
| Secondary/meta | `text-sm text-muted-foreground` | |
| Numbers, codes, prices | `font-sans` (Work Sans) + `dir="ltr"` where mixed | Western digits 0-9 |
| Latin display (store/celebratory) | `font-display-latin` (Instrument Serif) | Latin text only |
| Loza display | `font-loza-display` (DM Serif Display) | Inside `.loza-theme` only |

**Arabic rules:** no negative letter-spacing, no italics, line-height ≥ 1.5 for paragraphs (`leading-relaxed`).

---

## 4. Layout, spacing & radius

**Staff page anatomy** (top to bottom):

```
MainLayout (sidebar + main, p-6 lg:p-8)
└─ <div class="space-y-8">
   ├─ <PageHeader />          ← always first
   ├─ stats grid               ← grid gap-6, StatTile only
   └─ content sections         ← SectionCard, or SectionHeading + self-carded content
```

- Page sections: `space-y-8` · grids: `gap-6` (stats) / `gap-4` (dense)
- Cards: `p-6`, `rounded-2xl` · inner elements: `rounded-xl` / `rounded-lg` · chips & badges: `rounded-full`
- Store sections breathe more: `py-16`–`py-24`
- Max content width on wide screens: prefer `max-w-6xl` for document-like pages

**RTL rules:**

- Prefer `gap-*` over `ml-*`/`mr-*` (gap is direction-safe)
- Icon before button text uses `ml-2` (icon sits right, text left — RTL)
- Directional icons (arrows, chevrons) must point the RTL-correct way
- Phone numbers, codes, prices in inputs/labels: `dir="ltr"` + left-align

---

## 5. Elevation

| Shadow | Use |
|---|---|
| `glass-card` (includes `shadow-lg`) | Default staff surface |
| `shadow-warm` | Pink glow for CTAs and `gradient-pink` icon boxes |
| `shadow-soft-lift` | Elevated store cards |
| `shadow-rose-glow` | Hero/promo only |
| `shadow-loza`, `shadow-loza-lift` | Loza scope only |

One elevation step per element — don't stack glows.

---

## 6. Motion

- **Functional** motion (lists, cards, dialogs appearing): `animate-fade-in`, `animate-slide-in-up`, `animate-scale-in` — ≤ 400ms, ease-out. Stagger list rows by ≤ 50ms/row (`style={{ animationDelay }}`).
- **Decorative** motion (`animate-float`, `.sparkle`, `.candle-flicker`, `.marquee`): public store & Loza **only** — never in staff dashboards.
- Hover transitions: `transition-all duration-300` on cards, `transition-colors`/`transition-opacity` on small elements.
- Realtime dashboards may pulse (`animate-pulse-slow`) to signal liveness — one pulsing element per view.

---

## 7. Components

### Base library

shadcn/ui in `src/components/ui/` — use it before building anything custom. Toasts via the existing `use-toast` / Sonner setup.

### DS primitives (`src/components/ds/`) — required usage

| Component | Replaces | Rule |
|---|---|---|
| `<PageHeader />` | hand-rolled h1 blocks | Every staff page starts with it. `icon` optional, `actions` for page-level buttons. |
| `<StatTile />` | ad-hoc stat cards with `text-blue-600` etc. | All dashboard stats. Pick a semantic `tone`; `primary` for the headline metric. |
| `<EmptyState />` | bare `<p>لا توجد بيانات</p>` | Every empty list/table. Title + (usually) a hint or action. |
| `<LoadingState />` | scattered `Loader2` spinners | Every async list/page region. |
| `<SectionCard />` | unstructured card+heading combos | Carded section with built-in h2. |
| `<SectionHeading />` | loose h2 rows | Heading above content that brings its own card (tables). |

### Buttons

- **One** gradient CTA per screen: `className="gradient-pink text-white shadow-warm hover:opacity-90 transition-opacity"` — the single most important action.
- Everything else: standard variants (`default`, `secondary`, `outline`, `ghost`, `link`).
- `destructive` only for destructive actions, always behind a confirm (AlertDialog).
- Buttons that trigger async work show a spinner and disable while pending.

### Forms

- Label above field (`<Label>` + spacing `space-y-2`), errors below in `text-destructive text-sm`.
- Validation copy says what to fix, e.g. «رقم الجوال يجب أن يبدأ بـ 05».
- Numeric fields (`phone`, amounts, codes): `dir="ltr"` and left-aligned.

---

## 8. Voice & tone (Arabic copy)

Warm, simple فصحى. Talk like a friendly shop assistant, not a system.

| | Example |
|---|---|
| ✅ | «تم استلام طلبك، نجهّزه لك بكل حب 🎂» |
| ✅ | «عذراً، ما قدرنا نحفظ التعديل. جرّب مرة ثانية» |
| ✅ | «لا توجد طلبات بعد — عندما يصل طلب جديد سيظهر هنا» |
| ❌ | «ERROR 500: فشلت العملية!!» |
| ❌ | «إدخال غير صالح» (no guidance) |
| ❌ | Commanding tone: «أدخل البيانات فوراً» |

- Errors = what happened + what to do next. Never blame the user.
- Emoji: at most one, only in customer-facing celebratory moments (order placed, delivered). Never in staff consoles or error messages.
- Currency: `1,250 ر.س` (Western digits, thousands separator, ر.س after).
- Dates Gregorian; time 12-hour with صباحاً/مساءً.
- Buttons are verbs: «احفظ التغييرات», «أرسل للشيف» — not «موافق».

---

## 9. Loza sub-brand

- Activated **only** by wrapping the page in `.loza-theme` (re-maps all semantic tokens to gold/cream/brown, switches font to Tajawal, radius to 1rem).
- Inside Loza use the same semantic classes (`bg-background`, `text-primary`…) — the scope does the re-skinning. Loza-specific extras: `gradient-loza-gold`, `gradient-loza-header`, `text-gradient-loza`, `shadow-loza`, `font-loza-display`.
- Pink Cake rose styling must not appear inside `/loza`, and gold styling must not leak out.

---

## 10. New screen checklist

1. Starts with `<PageHeader />` (staff) or the store/Loza shell.
2. All colors via tokens; stats via `StatTile` tones; statuses via `StatusBadge`.
3. Async regions have `LoadingState` and `EmptyState`.
4. One gradient CTA max; destructive actions confirmed.
5. RTL-checked: gaps not margins, directional icons, `dir="ltr"` for numbers/codes.
6. Copy follows §8 (warm, helpful, correct currency/date formats).
7. Mobile-checked at 375px; cards collapse to single column.
8. Compare against `/design-system` for vibe drift before merging.

---

## 11. Adoption status & migration

`Dashboard.tsx` is the reference implementation. Remaining screens to migrate gradually (replace hand-rolled headers/stats/empty/loading states with DS primitives, and raw palette colors with tones):

- [x] Dashboard
- [ ] Kitchen (stats + empty states)
- [ ] BranchOrders / BranchLive (stat tiles use raw `text-blue-600`/`text-green-600`…)
- [ ] Driver (stats + empty states)
- [ ] LiveDashboard (stats)
- [ ] ContactSubmissions (stats use `text-amber-600`/`text-blue-600`…)
- [ ] Orders / Products / Branches / Users / Reports / Settings (headers + loading/empty)
- [ ] CustomOrders / BranchPickupScanner (headers)

When migrating: behavior must not change — visuals only converge to the system.
