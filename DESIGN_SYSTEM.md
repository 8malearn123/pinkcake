# Cake & Bloom Design System

The single source of truth for look, feel, and tone across every screen.
Living style guide (rendered, admin-only): **`/design-system`** · DS components: **`src/components/ds/`**

---

## 1. Brand essence

Cake & Bloom is a **warm, editorial, pastry-luxe** brand: deep berry on cream, gold as the one decorative metal, heavy Noto Kufi headings, squared cards, and friendly Arabic copy. Every screen — even the kitchen dashboard — should feel like it belongs to the same boutique. Professional, never sterile; sweet, never childish.

**One palette, one type ramp, one surface vocabulary, two densities.** The storefront and the staff console differ in *breathing room*, never in language.

| Face | Routes | Personality |
|---|---|---|
| **Public store** | `/`, `/shop`, `/product/*`, `/track`, `/my-orders`… | Editorial and appetizing. Roomy sections (`py-14`–`py-28`), hero imagery, gold rules, decorative motion allowed. |
| **Staff console** | `/live`, `/kitchen`, `/orders`… | Same palette, type and surfaces — compact. `space-y-8` sections, dense tables, one brand CTA per screen. |
| **Loza marketplace** | `/loza/*` | Separate sub-brand: gold / cream / brown, Alexandria font. Fully scoped — never leaks outside `/loza`, and unaffected by the global theme. |

---

## 2. Color

**The one rule: every color comes from a token.** Primary colors are user-configurable at runtime (Settings → CSS variables), so any hardcoded palette class (`text-blue-600`, `bg-green-100`…) breaks theming and dark mode.

### Core tokens (defined in `src/index.css`, mapped in `tailwind.config.ts`)

| Token | Value | Use for |
|---|---|---|
| `primary` / `primary-foreground` | berry `#9e3a5c` | Buttons, links, focus rings, active nav, prices |
| `rose` | `#b0506e` | Eyebrows, second lines of display headings |
| `gold`, `gold-soft`, `gold-deep` | `#ddbd75` | Hairlines, badges, on-dark CTAs. **Decorative only** |
| `accent` / `accent-foreground` | blush `#fbeef2` | shadcn's hover surface. **Never the gold** — see below |
| `background`, `card`, `popover` | cream `#fffdfa` | Structure |
| `foreground` | ink `#2c2226` | Body text |
| `secondary`, `muted`, `muted-foreground`, `border`, `input`, `ring` | | Quiet surfaces, secondary text, structure |
| `blush`, `blush-deep` | | Soft brand washes |
| `berry-deep`, `berry-dark`, `berry-ink`, `berry-black` | | Dark bands (Reviews, footer) and photo scrims |
| `seasonal`, `seasonal-wash` | `#e8942f` | The summer collection accent |
| `destructive` | | Errors, deletion, rejection — nothing else |
| `success`, `warning`, `info` (+`-foreground`) | | Feedback & stat tones |
| `pink`, `pink-light`, `pink-dark` | | Legacy aliases of the berry ramp — kept so old class names still work |
| `sidebar-*` | plum-ink + gold | Console chrome — sidebar only |

> **`--accent` is not the gold.** shadcn resolves `hover:bg-accent` for every ghost/outline button, dropdown row and select item. Point it at a saturated brand color and the whole console turns that color on hover. Gold lives in `--gold`.

Tints come from opacity modifiers, not new colors: `bg-success/10 text-success`.

### Semantic meaning

- **success** — paid, completed, accepted
- **warning** — waiting states (approval, payment, response)
- **info** — in progress (preparing, in transit)
- **destructive** — rejected, failed, overdue, delete actions
- **primary** — totals, featured numbers, the main thing on screen

### Gradients & special surfaces

`gradient-pink` (the anchor CTA + brand icon boxes — a vertical berry gradient) · `gradient-berry-deep` / `gradient-footer-berry` (the Reviews band and footer) · `gradient-blush-warm` (soft store headers) · `gradient-rose-deep` / `gradient-cocoa` (dark store sections) · `glass-card` (default card surface: solid cream + berry lift).

### Order status

Order status colors live in one place: the `status-*` utility classes in `index.css`, consumed **only** through `<StatusBadge status={...} />`. Each of the eleven is one `--status-*` hue used as the text color with its own 12% wash as the fill — low-chroma by design, so the set reads as one family on cream. Never hand-build a status chip; never repurpose status classes for other meanings.

---

## 3. Typography

The brand face is **Noto Kufi Arabic** everywhere (set on `<body>` via `font-sans`), the app is **RTL** (`<html dir="rtl">`). Hierarchy comes from size and weight, never from a second family — `.font-display`, `.font-display-latin` and `.font-wedding` all resolve to Noto Kufi 800 and survive only as legacy hooks.

| Role | Classes | Notes |
|---|---|---|
| Store display (h2) | `<Title variant="display">` — `text-[2.5rem] sm:text-[3.25rem] font-black` | Feature sections |
| Store section (h2) | `<Title variant="h2">` — `text-3xl sm:text-4xl font-black` | List sections |
| Eyebrow / kicker | `<Eyebrow>` — `text-xs font-bold tracking-[.08em] text-rose` (`caps` for `text-[11px] uppercase tracking-[.22em]`) | Always above a Title |
| Lede | `<Lede>` — `text-[15px] leading-8 text-muted-foreground` | Intro paragraph |
| Console page title (h1) | `text-3xl font-black` | One per page, via `<PageHeader />` |
| Console section (h2) | `text-xl font-black` | Via `<SectionHeading />` / `<SectionCard />` |
| Card/field title, buttons, chips | `font-bold` | |
| Body | default (`text-base`) | |
| Secondary/meta | `text-sm text-muted-foreground` | |
| Numbers, codes, prices | `dir="ltr"` where mixed | Western digits 0-9 |
| Loza display | `font-loza-display` (DM Serif Display) | Inside `.loza-theme` only |

**Arabic rules:** no negative letter-spacing, no italics, line-height ≥ 1.5 for paragraphs (`leading-relaxed`).

---

## 4. Layout, spacing & radius

**Store page anatomy** (top to bottom):

```
<div class="store-surface min-h-screen bg-background text-foreground">
├─ <Marquee />                    ← the berry ticker
├─ <StorefrontMasthead />         ← `floating` only on the home page (over the hero)
├─ <Section variant="list|feature">
│    └─ <Eyebrow> + <Title> + <Lede>, then the content
└─ <StorefrontFooter />           ← always closes the page
```

**Staff page anatomy:**

```
MainLayout (sidebar + main, p-6 lg:p-8)
└─ <div class="space-y-8">
   ├─ <PageHeader />          ← always first
   ├─ stats grid               ← grid gap-6, StatTile only
   └─ content sections         ← SectionCard, or SectionHeading + self-carded content
```

- Console sections: `space-y-8` · grids: `gap-6` (stats) / `gap-4` (dense)
- Store sections: `<Section variant="list">` = `py-14 lg:py-20`, `variant="feature"` = `py-20 lg:py-28`; horizontal padding is always `px-5 sm:px-8 lg:px-12`
- Store container widths: `max-w-[1500px]` (default), `max-w-[1400px]` (feature), `max-w-[820px]` (prose)
- **Radius ladder:** `rounded-full` chips & pills · `rounded-2xl` cards and photo tiles · `rounded-3xl` feature panels · `rounded-xl` buttons · `rounded-lg/md/sm` follow `--radius` (`0.5rem`)
- Cards: `p-6`

**RTL rules:**

- Prefer `gap-*` over `ml-*`/`mr-*` (gap is direction-safe)
- Icon before button text uses `ml-2` (icon sits right, text left — RTL)
- Directional icons (arrows, chevrons) must point the RTL-correct way
- Phone numbers, codes, prices in inputs/labels: `dir="ltr"` + left-align

---

## 5. Elevation

| Shadow | Use |
|---|---|
| `glass-card` | Default card surface — solid cream, border, soft berry lift |
| `shadow-berry-soft` / `-lg` | The canonical elevation. `-lg` is the hover step |
| `shadow-warm` | Alias of `shadow-berry-soft` (legacy class name) |
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

### Editorial primitives (`src/components/ds/Editorial.tsx`) — the store vocabulary

Shared by both faces; `variant` carries the density. Use these instead of re-declaring the class strings.

| Component | Replaces |
|---|---|
| `<Section variant="list"\|"feature"\|"console" width>` | Hand-written section padding + `max-w-*` wrappers |
| `<Eyebrow tone rule caps>` | The kicker + hairline pattern above every heading |
| `<Title variant="display"\|"h2"\|"h3" tone>` + `<TitleAccent>` | Hand-written `font-black` headings |
| `<Lede tone>` | Intro paragraphs |
| `<Chip tone>` | The badge/pill family (berry, gold, seasonal, success, glass, blush) |
| `<PhotoTile ratio scrim>` | Photo wells with hover-zoom and one of two canonical scrims |
| `<GoldRule />` / `<GoldDivider />` | The fading-gold hairline and the ✦ section break |

### Store chrome

`<StorefrontMasthead />` is the one header — `floating` only on the home page. `<StorefrontFooter />` closes every store page. Both live under `StorefrontLayout` in `App.tsx`, which provides the shared cart.

### Buttons

- **One** anchor CTA per screen: `<Button variant="brand">` (gradient berry + lift) — the single most important action.
- Storefront variants: `brandFlat` (workhorse berry), `gold` (on dark bands / over photography), `outlineBrand` (berry outline on light), `onDark` (translucent over photos). Sizes `cta` and `pill` are the storefront scale.
- Console: standard variants (`default`, `secondary`, `outline`, `ghost`, `link`).
- Base weight is `font-bold` — the brand's buttons are heavy.
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

## 11. Adoption status

The Cake & Bloom unification is complete: the palette, type ramp, surfaces and chrome are global, and `.storefront-theme` no longer exists (the tokens live in `:root`).

**Invariants to keep:**

- No raw Tailwind palette classes (`text-blue-600`, `bg-green-100`…) and no arbitrary brand hex (`bg-[#9e3a5c]`). Both are at zero outside `/loza` and this guide's own examples — keep it that way.
- `--accent` stays a quiet blush wash; gold is `--gold`.
- `defaultSettings.colors` in `src/contexts/SettingsContext.tsx` must mirror `:root` — it is written as inline styles on `<html>` and silently wins over the stylesheet.
- `.loza-theme` is a separate sub-brand and pins its own feedback tokens. Don't let berry leak in, or gold leak out.
- `npm run check:rtl` has an **empty** baseline: use `ms/me-*`, `ps/pe-*`, `start/end-*`, `text-start/end`, `rounded-s/e-*`, `border-s/e-*`.
