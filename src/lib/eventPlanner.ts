/**
 * Event/ضيافة recommendation engine (spec file 09 §4).
 *
 * Pure + deterministic: given the wizard answers it returns a sensible, fully
 * editable package. No I/O. Every constant is sourced to the portion/staffing
 * research in §1.2/§1.3 so the events team can reason about (and later tune) it.
 */
import {
  CAKES, MINIS, OTHER_DESSERTS, STATIONS, SERVER_SKU, catalogItem,
  type ServeStyle, type CatalogItem,
} from './eventCatalog';

export type Occasion =
  | 'wedding' | 'corporate' | 'graduation' | 'newborn' | 'birthday' | 'family' | 'other';
export type StationType = 'none' | 'ready_corner' | 'live';

export interface EventConfig {
  occasion: Occasion | null;
  guestCount: number;
  serveStyles: ServeStyle[];
  stationType: StationType;
  liveStationId?: string | null;
  serversNeeded: boolean;
  serversCount: number;
  serviceHours: number;
}

export interface EventLineItem {
  catalogId: string;
  name: string;
  emoji: string;
  kind: string;
  unitPrice: number;
  unitLabel: string;
  qty: number;
  /** e.g. "٢٠ قطعة بالعلبة" */
  meta?: string;
  /** e.g. "يكفي تقريبًا لـ ٤٠ ضيف" */
  servesHint?: string;
}

export interface EventPlan {
  items: EventLineItem[];
  notes: string[];
}

export const DEFAULT_RULES = {
  cakeServingMultiplier: 0.85, // order the centerpiece cake for ~85% of guests (§1.2)
  miniWithCakePerGuest: 1.5,   // mini-desserts when a cake is also served (§1.2)
  miniReplaceCakePerGuest: 3.5, // mini-desserts when the dessert table replaces the cake (§1.2)
  miniVarietyMin: 4,
  miniVarietyMax: 6,           // split the mini total across 4–6 SKUs (§1.2)
  cupcakesPerGuest: 1.5,       // §1.2
  cookiesOrMaamoulPerGuest: 3, // §1.2
  chocolatePerGuest: 2,        // presentation chocolates, configurable (§1.2)
  trayServes: 25,              // pieces a حلا tray covers
  serverPerGuests: 30,         // dessert-station service ratio, looser than seated 1:8–12 (§1.3)
  defaultServiceHours: 3,
};

type Rules = typeof DEFAULT_RULES;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const serveHint = (n: number) => `يكفي تقريبًا لـ ${n} ضيف`;

function fromCatalog(item: CatalogItem, qty: number, extra: Partial<EventLineItem> = {}): EventLineItem {
  return {
    catalogId: item.id,
    name: item.name,
    emoji: item.emoji,
    kind: item.kind,
    unitPrice: item.unitPrice,
    unitLabel: item.unitLabel,
    qty,
    ...extra,
  };
}

/** Pick the cake(s) that cover `servings` — smallest single cake that fits, else the largest + a top-up. */
function pickCakes(servings: number): EventLineItem[] {
  const sorted = [...CAKES].sort((a, b) => (a.serves ?? 0) - (b.serves ?? 0));
  const single = sorted.find((c) => (c.serves ?? 0) >= servings);
  if (single) {
    return [fromCatalog(single, 1, { servesHint: serveHint(single.serves ?? servings) })];
  }
  // Larger than our biggest single cake → biggest cake + enough extra cakes to cover the rest.
  const biggest = sorted[sorted.length - 1];
  const count = Math.max(1, Math.ceil(servings / (biggest.serves ?? 1)));
  return [fromCatalog(biggest, count, { servesHint: serveHint((biggest.serves ?? 0) * count) })];
}

/** Split `totalBoxes` across `varieties` mini SKUs as evenly as possible. */
function splitMinis(totalBoxes: number, rules: Rules): EventLineItem[] {
  const varieties = clamp(Math.min(totalBoxes, rules.miniVarietyMax), 1, Math.min(MINIS.length, rules.miniVarietyMax));
  const chosen = MINIS.slice(0, Math.max(1, varieties));
  const base = Math.floor(totalBoxes / chosen.length);
  const rem = totalBoxes % chosen.length;
  return chosen.map((m, i) => {
    const boxes = base + (i < rem ? 1 : 0);
    const pieces = (m.serves ?? 20) * boxes;
    return fromCatalog(m, Math.max(1, boxes), {
      meta: `${m.serves} قطعة بالعلبة`,
      servesHint: `${pieces} قطعة`,
    });
  }).filter((l) => l.qty > 0);
}

/** Boxes needed to cover `pieces` items packed `per` to a box. */
function boxesFor(pieces: number, per: number): number {
  return Math.max(1, Math.ceil(pieces / per));
}

export function planEvent(cfg: EventConfig, rules: Rules = DEFAULT_RULES): EventPlan {
  const items: EventLineItem[] = [];
  const notes: string[] = [];
  const guests = Math.max(0, Math.floor(cfg.guestCount || 0));
  const styles = new Set(cfg.serveStyles);
  const hasCake = styles.has('centerpiece_cake');

  if (guests <= 0) return { items, notes };

  // 1) Centerpiece cake — for ~85% of guests (§1.2).
  if (hasCake) {
    const servings = Math.ceil(guests * rules.cakeServingMultiplier);
    items.push(...pickCakes(servings));
  }

  // 2) Assorted mini-desserts — 1.5/guest with a cake, 3.5/guest if replacing it (§1.2).
  if (styles.has('assorted_mini')) {
    const perGuest = hasCake ? rules.miniWithCakePerGuest : rules.miniReplaceCakePerGuest;
    const totalPieces = Math.round(guests * perGuest);
    const boxSize = MINIS[0].serves ?? 20;
    const totalBoxes = boxesFor(totalPieces, boxSize);
    items.push(...splitMinis(totalBoxes, rules));
  }

  // 3) Cupcakes — ~1.5/guest (§1.2).
  if (styles.has('cupcake')) {
    const box = OTHER_DESSERTS.find((d) => d.serveStyle === 'cupcake')!;
    const qty = boxesFor(Math.ceil(guests * rules.cupcakesPerGuest), box.serves ?? 12);
    items.push(fromCatalog(box, qty, { meta: `${box.serves} قطعة بالعلبة`, servesHint: serveHint(guests) }));
  }

  // 4) Maamoul / petit four — ~3/guest (§1.2).
  if (styles.has('maamoul')) {
    const box = OTHER_DESSERTS.find((d) => d.serveStyle === 'maamoul')!;
    const qty = boxesFor(Math.ceil(guests * rules.cookiesOrMaamoulPerGuest), box.serves ?? 24);
    items.push(fromCatalog(box, qty, { meta: `${box.serves} قطعة بالعلبة`, servesHint: serveHint(guests) }));
  }

  // 5) Presentation chocolate — ~2 pieces/guest (§1.2).
  if (styles.has('chocolate')) {
    const box = OTHER_DESSERTS.find((d) => d.serveStyle === 'chocolate')!;
    const qty = boxesFor(Math.ceil(guests * rules.chocolatePerGuest), box.serves ?? 30);
    items.push(fromCatalog(box, qty, { meta: `${box.serves} قطعة بالعلبة`, servesHint: serveHint(guests) }));
  }

  // 6) Trays (صواني حلا) — better for big groups; one tray per ~25 guests.
  if (styles.has('trays')) {
    const tray = OTHER_DESSERTS.find((d) => d.serveStyle === 'trays')!;
    const qty = Math.max(1, Math.ceil(guests / rules.trayServes));
    items.push(fromCatalog(tray, qty, { servesHint: serveHint((tray.serves ?? rules.trayServes) * qty) }));
  }

  // 7) Station (branch-capable SKU).
  if (cfg.stationType === 'ready_corner') {
    const s = STATIONS.find((x) => x.id === 'svc-ready-corner')!;
    items.push(fromCatalog(s, 1));
  } else if (cfg.stationType === 'live') {
    const s = catalogItem(cfg.liveStationId ?? '') ?? STATIONS.find((x) => x.id === 'svc-live-kunafa')!;
    items.push(fromCatalog(s, 1));
  }

  // 8) Servers — suggested 1 per ~30 guests, total server-hours = count × hours (§1.3).
  if (cfg.serversNeeded) {
    const count = Math.max(1, cfg.serversCount || Math.ceil(guests / rules.serverPerGuests));
    const hours = Math.max(1, cfg.serviceHours || rules.defaultServiceHours);
    items.push(fromCatalog(SERVER_SKU, count * hours, {
      meta: `${count} مقدّم × ${hours} ساعات`,
      servesHint: `طاقم خدمة في الموقع`,
    }));
  }

  // 9) Occasion bias — sets a helpful note only; the customer can override everything.
  if (cfg.occasion === 'corporate') {
    notes.push('للفعاليات المؤسسية ننصح بتغليف وبطاقة بهوية شركتك — أضيفيها في خانة الملاحظات.');
  }
  if (cfg.occasion === 'wedding') {
    notes.push('نقدّم الحلا على دفعات أثناء الحفل لإبقاء الطاولة ممتلئة ومرتّبة.');
  }

  return { items, notes };
}

export function lineTotal(item: EventLineItem): number {
  return item.qty * item.unitPrice;
}

export function planSubtotal(items: EventLineItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0);
}

/** Suggested server count for a headcount (used by the servers step). */
export function suggestServers(guests: number, rules: Rules = DEFAULT_RULES): number {
  return Math.max(1, Math.ceil(Math.max(0, guests) / rules.serverPerGuests));
}
