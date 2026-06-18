/**
 * Demo hospitality catalogue for the event/ضيافة builder.
 *
 * In production these become real catalogue products (with a `serves_count`)
 * plus hidden service SKUs gated by branch capability (spec file 09 §3.3). They
 * live here so the frontend slice works on demo data with no backend — the
 * backend colleague swaps the source for real products + RPCs later.
 *
 * No external imagery (sandbox blocks it / handoff-clean): each item carries an
 * emoji glyph for a lightweight, dependency-free visual.
 */

export type ServeStyle =
  | 'centerpiece_cake'
  | 'assorted_mini'
  | 'chocolate'
  | 'cupcake'
  | 'maamoul'
  | 'trays';

export type ItemKind = 'cake' | 'box' | 'tray' | 'station' | 'server';

export interface CatalogItem {
  id: string;
  name: string;
  emoji: string;
  kind: ItemKind;
  /** Which serve-style bucket this item satisfies (undefined for services). */
  serveStyle?: ServeStyle;
  unitPrice: number;
  /** Unit shown next to the quantity: كيكة / علبة / صينية / محطة / ساعة. */
  unitLabel: string;
  /** For a cake: guests it serves. For a box/tray: pieces inside. */
  serves?: number;
}

// Centerpiece cakes, ascending by servings — the planner picks the smallest that
// covers the needed servings (or combines).
export const CAKES: CatalogItem[] = [
  { id: 'cake-classic', name: 'كيكة كلاسيكية', emoji: '🎂', kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 180, unitLabel: 'كيكة', serves: 10 },
  { id: 'cake-two', name: 'كيكة دورين', emoji: '🍰', kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 340, unitLabel: 'كيكة', serves: 22 },
  { id: 'cake-three', name: 'كيكة ثلاث طوابق', emoji: '🎂', kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 620, unitLabel: 'كيكة', serves: 45 },
  { id: 'cake-four', name: 'كيكة أربع طوابق', emoji: '🎂', kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 980, unitLabel: 'كيكة', serves: 75 },
];

// Assorted mini-desserts (the dessert-table staple) — boxes of ~20 pieces, split
// across several varieties by the planner.
export const MINIS: CatalogItem[] = [
  { id: 'mini-cheesecake', name: 'ميني تشيز كيك', emoji: '🧀', kind: 'box', serveStyle: 'assorted_mini', unitPrice: 130, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-brownie', name: 'ميني براوني', emoji: '🍫', kind: 'box', serveStyle: 'assorted_mini', unitPrice: 120, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-eclair', name: 'ميني إكلير', emoji: '🥐', kind: 'box', serveStyle: 'assorted_mini', unitPrice: 140, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-tart', name: 'ميني تارت فواكه', emoji: '🍓', kind: 'box', serveStyle: 'assorted_mini', unitPrice: 150, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-cake', name: 'ميني كيك متنوّع', emoji: '🍰', kind: 'box', serveStyle: 'assorted_mini', unitPrice: 135, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-macaron', name: 'ماكرون فرنسي', emoji: '🌈', kind: 'box', serveStyle: 'assorted_mini', unitPrice: 160, unitLabel: 'علبة', serves: 24 },
];

// Other serve styles.
export const OTHER_DESSERTS: CatalogItem[] = [
  { id: 'cupcake-box', name: 'كب كيك متنوّع', emoji: '🧁', kind: 'box', serveStyle: 'cupcake', unitPrice: 95, unitLabel: 'علبة', serves: 12 },
  { id: 'maamoul-box', name: 'معمول وبيتفور', emoji: '🍪', kind: 'box', serveStyle: 'maamoul', unitPrice: 110, unitLabel: 'علبة', serves: 24 },
  { id: 'choc-box', name: 'شوكولاتة ضيافة فاخرة', emoji: '🍬', kind: 'box', serveStyle: 'chocolate', unitPrice: 185, unitLabel: 'علبة', serves: 30 },
  { id: 'tray-mixed', name: 'صينية حلا مشكّل', emoji: '🍮', kind: 'tray', serveStyle: 'trays', unitPrice: 240, unitLabel: 'صينية', serves: 25 },
];

// Hospitality stations (gated by branch capability in production).
export const STATIONS: CatalogItem[] = [
  { id: 'svc-ready-corner', name: 'ركن حلا جاهز', emoji: '🍽️', kind: 'station', unitPrice: 850, unitLabel: 'محطة' },
  { id: 'svc-live-kunafa', name: 'محطة حية — كنافة', emoji: '🔥', kind: 'station', unitPrice: 1200, unitLabel: 'محطة' },
  { id: 'svc-live-waffle', name: 'محطة حية — وافل', emoji: '🧇', kind: 'station', unitPrice: 1100, unitLabel: 'محطة' },
  { id: 'svc-live-coffee', name: 'محطة حية — قهوة مختصة', emoji: '☕', kind: 'station', unitPrice: 1000, unitLabel: 'محطة' },
];

// Per-hour hospitality server.
export const SERVER_SKU: CatalogItem = {
  id: 'svc-server-hour', name: 'مقدّم ضيافة', emoji: '🤵', kind: 'server', unitPrice: 60, unitLabel: 'ساعة',
};

export const LIVE_STATIONS = STATIONS.filter((s) => s.id !== 'svc-ready-corner');
export const EVENT_CATALOG: CatalogItem[] = [...CAKES, ...MINIS, ...OTHER_DESSERTS, ...STATIONS, SERVER_SKU];

export function catalogItem(id: string): CatalogItem | undefined {
  return EVENT_CATALOG.find((c) => c.id === id);
}
