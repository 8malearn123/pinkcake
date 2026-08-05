/**
 * Combos catalog — the shape of the storefront's «الكومبوهات» band.
 *
 * A combo is a merchandising bundle: a name, a hero photo, an accent colour and
 * a handful of member products drawn from the live catalogue. Its price is never
 * stored — it is DERIVED from the members' real prices and the combo's own
 * discount, so the «وفّر» badge on the storefront can't drift away from what the
 * customer is actually charged.
 *
 * This module has no imports on purpose — it is the vocabulary every other layer
 * (pure logic, persistence, React) agrees on.
 */

/** Bump to invalidate persisted docs; the store wipes + reseeds on mismatch. */
export const COMBOS_SCHEMA_VERSION = 1;

export const COMBOS_META_KEY = 'pinkcake:combos:v1';

/**
 * Combos own their OWN IndexedDB database. Never point this at the cake
 * catalog's: each store garbage-collects blobs its own document doesn't
 * reference, so sharing one would make a `/cake-design` boot silently delete
 * every combo hero photo.
 */
export const COMBOS_IDB_NAME = 'pinkcake-combos';
export const COMBOS_IDB_STORE = 'images';

/** A combo needs at least this many members to be a bundle at all. */
export const MIN_COMBO_MEMBERS = 2;
/** Beyond this the storefront card's thumbnail row stops reading as a set. */
export const MAX_COMBO_MEMBERS = 6;

/** Ceiling on the discount, so a typo can't hand the shop away. */
export const MAX_DISCOUNT_PCT = 90;

export interface ComboItem {
  id: string;
  name: string;
  tagline: string;
  /** Product ids from the live catalogue, in display order. */
  items: string[];
  /** 0–90. price = round(sum(member prices) × (1 − discountPct / 100)). */
  discountPct: number;
  /** Hex colour driving the card's badge and button. */
  accent: string;
  /** Uploaded hero blob (IndexedDB). Wins over `heroImageUrl` when both are set. */
  heroImageId: string | null;
  /** Hero as a plain URL — how the seed ships, and the escape hatch for a CDN asset. */
  heroImageUrl: string | null;
  /** «الأكثر توفيراً» — the big featured card. At most one combo holds it. */
  best: boolean;
  /** Hidden combos stay in the dashboard but never render on the storefront. */
  isActive: boolean;
  displayOrder: number;
  createdAt: number;
}

export interface CombosDoc {
  schemaVersion: number;
  combos: ComboItem[];
}

/**
 * Every mutation returns the new doc plus the blobs it orphaned, so the session
 * knows exactly which object URLs to revoke — and so a future SQL adapter has
 * the deltas instead of a whole-document write.
 */
export interface ComboCascade {
  doc: CombosDoc;
  /** Blobs to delete and object URLs to revoke. */
  deadImageIds: string[];
}

/** The fields a form edits; identity, order and hero are managed separately. */
export type ComboDraft = Pick<
  ComboItem,
  'name' | 'tagline' | 'items' | 'discountPct' | 'accent' | 'best' | 'isActive'
> & {
  heroImageUrl?: string | null;
};
