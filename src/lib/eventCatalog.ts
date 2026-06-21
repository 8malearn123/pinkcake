/**
 * Demo hospitality catalogue for the event/ضيافة builder.
 *
 * In production these become real catalogue products (with a `serves_count`)
 * plus hidden service SKUs gated by branch capability (spec file 09 §3.3). They
 * live here so the frontend slice works on demo data with no backend — the
 * backend colleague swaps the source for real products + RPCs later.
 *
 * Each item carries a lucide icon for a refined, dependency-free visual.
 */
import {
  Cake, CakeSlice, Cookie, Croissant, Cherry, Candy, UtensilsCrossed, Utensils,
  Flame, Grid2x2, Coffee, ConciergeBell, type LucideIcon,
} from 'lucide-react';

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
  icon: LucideIcon;
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
  { id: 'cake-classic', name: 'كيكة كلاسيكية', icon: Cake, kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 180, unitLabel: 'كيكة', serves: 10 },
  { id: 'cake-two', name: 'كيكة دورين', icon: Cake, kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 340, unitLabel: 'كيكة', serves: 22 },
  { id: 'cake-three', name: 'كيكة ثلاث طوابق', icon: Cake, kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 620, unitLabel: 'كيكة', serves: 45 },
  { id: 'cake-four', name: 'كيكة أربع طوابق', icon: Cake, kind: 'cake', serveStyle: 'centerpiece_cake', unitPrice: 980, unitLabel: 'كيكة', serves: 75 },
];

// Assorted mini-desserts (the dessert-table staple) — boxes of ~20 pieces, split
// across several varieties by the planner.
export const MINIS: CatalogItem[] = [
  { id: 'mini-cheesecake', name: 'ميني تشيز كيك', icon: CakeSlice, kind: 'box', serveStyle: 'assorted_mini', unitPrice: 130, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-brownie', name: 'ميني براوني', icon: Cookie, kind: 'box', serveStyle: 'assorted_mini', unitPrice: 120, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-eclair', name: 'ميني إكلير', icon: Croissant, kind: 'box', serveStyle: 'assorted_mini', unitPrice: 140, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-tart', name: 'ميني تارت فواكه', icon: Cherry, kind: 'box', serveStyle: 'assorted_mini', unitPrice: 150, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-cake', name: 'ميني كيك متنوّع', icon: Cake, kind: 'box', serveStyle: 'assorted_mini', unitPrice: 135, unitLabel: 'علبة', serves: 20 },
  { id: 'mini-macaron', name: 'ماكرون فرنسي', icon: Candy, kind: 'box', serveStyle: 'assorted_mini', unitPrice: 160, unitLabel: 'علبة', serves: 24 },
];

// Other serve styles.
export const OTHER_DESSERTS: CatalogItem[] = [
  { id: 'cupcake-box', name: 'كب كيك متنوّع', icon: CakeSlice, kind: 'box', serveStyle: 'cupcake', unitPrice: 95, unitLabel: 'علبة', serves: 12 },
  { id: 'maamoul-box', name: 'معمول وبيتفور', icon: Cookie, kind: 'box', serveStyle: 'maamoul', unitPrice: 110, unitLabel: 'علبة', serves: 24 },
  { id: 'choc-box', name: 'شوكولاتة ضيافة فاخرة', icon: Candy, kind: 'box', serveStyle: 'chocolate', unitPrice: 185, unitLabel: 'علبة', serves: 30 },
  { id: 'tray-mixed', name: 'صينية حلا مشكّل', icon: UtensilsCrossed, kind: 'tray', serveStyle: 'trays', unitPrice: 240, unitLabel: 'صينية', serves: 25 },
];

// Hospitality stations (gated by branch capability in production).
export const STATIONS: CatalogItem[] = [
  { id: 'svc-ready-corner', name: 'ركن حلا جاهز', icon: Utensils, kind: 'station', unitPrice: 850, unitLabel: 'محطة' },
  { id: 'svc-live-kunafa', name: 'محطة حية — كنافة', icon: Flame, kind: 'station', unitPrice: 1200, unitLabel: 'محطة' },
  { id: 'svc-live-waffle', name: 'محطة حية — وافل', icon: Grid2x2, kind: 'station', unitPrice: 1100, unitLabel: 'محطة' },
  { id: 'svc-live-coffee', name: 'محطة حية — قهوة مختصة', icon: Coffee, kind: 'station', unitPrice: 1000, unitLabel: 'محطة' },
];

// Per-hour hospitality server.
export const SERVER_SKU: CatalogItem = {
  id: 'svc-server-hour', name: 'مقدّم ضيافة', icon: ConciergeBell, kind: 'server', unitPrice: 60, unitLabel: 'ساعة',
};

export const LIVE_STATIONS = STATIONS.filter((s) => s.id !== 'svc-ready-corner');
export const EVENT_CATALOG: CatalogItem[] = [...CAKES, ...MINIS, ...OTHER_DESSERTS, ...STATIONS, SERVER_SKU];

export function catalogItem(id: string): CatalogItem | undefined {
  return EVENT_CATALOG.find((c) => c.id === id);
}
