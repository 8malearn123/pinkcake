/**
 * Cake catalog — the shape of the photo-driven cake taxonomy.
 *
 * The shop photographs real cakes. A cake is customised along a GLOBAL ordered
 * list of levels (الشكل → النكهة → لون الكريمة → الإضافات), and a photo hangs off
 * every node of a per-cake tree: an image belongs to a path `cake → value → value`
 * at ANY depth, so partial paths are first-class nodes with their own photo.
 *
 * This module has zero imports on purpose — it is the vocabulary every other
 * layer (pure logic, persistence, React) agrees on.
 */

/** Bump to invalidate persisted metadata; the store wipes + reseeds on mismatch. */
export const SCHEMA_VERSION = 1;

/** Older metadata keys whose blobs must be cleared on upgrade. */
export const LEGACY_META_KEYS: readonly string[] = [];

export const META_STORAGE_KEY = 'pinkcake:cake-catalog:v1';
export const IDB_NAME = 'pinkcake-cake-catalog';
export const IDB_STORE = 'images';

/** Mirrors the product image upload rules so staff hit one consistent limit. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/** Staff photos are downscaled before storage — IndexedDB quota is the binding constraint. */
export const DOWNSCALE_MAX_EDGE = 1600;
export const DOWNSCALE_QUALITY = 0.85;

/** One option inside a level, e.g. «قلب» inside «الشكل». */
export interface CatalogValue {
  id: string;
  /** Arabic display name. Unique (case-insensitively) within its level. */
  name: string;
  /** Added to the cake's base price when this value is picked. May be 0 or negative. */
  priceDelta: number;
  /** Optional staff reference photo — recognition aid + customer-side chip thumbnail. */
  referenceImageId: string | null;
}

/** A customisation step. The array index IS the depth: `path[i]` is a value of `levels[i]`. */
export interface CatalogLevel {
  id: string;
  name: string;
  values: CatalogValue[];
}

export interface CatalogCake {
  id: string;
  name: string;
  /** Price before any option deltas. */
  basePrice: number;
  /** Purchase-reassurance copy shown in the studio, e.g. «6–8» / «24 ساعة». */
  serves: string;
  leadTime: string;
  /** Cover photo customers see in the gallery. Required before a cake can go live. */
  previewImageId: string | null;
  createdAt: number;
}

export interface CatalogImage {
  /** Also the blob key in IndexedDB. */
  id: string;
  cakeId: string;
  /** One value id per level, length 1..levels.length. A partial path is legal. */
  path: string[];
  fileName: string;
  width: number;
  height: number;
  size: number;
  createdAt: number;
}

export interface Catalog {
  schemaVersion: number;
  levels: CatalogLevel[];
  cakes: CatalogCake[];
  images: CatalogImage[];
}

/**
 * Every mutation returns the new catalog plus the exact deltas, so a future SQL
 * adapter can translate a whole-document change into targeted statements — and
 * so the React layer knows precisely which object URLs to revoke.
 */
export interface CascadeResult {
  catalog: Catalog;
  /** Blobs to delete and object URLs to revoke. */
  deadImageIds: string[];
  /** Cakes whose preview pointed at a deleted image and was nulled. */
  clearedPreviewCakeIds: string[];
}

/** A flattened row of the variant tree, ready to render without recursion. */
export interface TreeRow {
  /** `cakeId>v1>v2` — the node's identity. */
  key: string;
  /** 0-based level index. */
  depth: number;
  path: string[];
  valueId: string;
  valueName: string;
  levelName: string;
  priceDelta: number;
  imageId: string | null;
  /** Images present at or below this node. */
  fill: number;
  /** Images needed at or below this node. */
  total: number;
  hasChildren: boolean;
  expanded: boolean;
}

/** An inline "add a value at this depth" row interleaved into the tree. */
export interface TreeAddRow {
  kind: 'add';
  key: string;
  depth: number;
  levelIndex: number;
  levelName: string;
}

export type TreeItem = ({ kind: 'node' } & TreeRow) | TreeAddRow;

export interface ImageFileMeta {
  fileName: string;
  width: number;
  height: number;
  size: number;
}

export interface CakeCoverage {
  filled: number;
  total: number;
  missing: number;
  pct: number;
  complete: boolean;
}
