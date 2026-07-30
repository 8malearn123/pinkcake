/**
 * Cake catalog — the pure logic core.
 *
 * Deliberately free of `window`, `localStorage`, `indexedDB` and `URL`, so the
 * coverage math, cascade rules and self-repair are unit-testable in jsdom (which
 * has neither IndexedDB nor createObjectURL). Every mutation is a pure
 * `(catalog, args) => CascadeResult` — it never writes anything itself; the
 * store persists and the React layer revokes the returned `deadImageIds`.
 */

import type {
  Catalog,
  CakeCoverage,
  CascadeResult,
  CatalogCake,
  CatalogImage,
  CatalogLevel,
  TreeItem,
} from './types';
import { SCHEMA_VERSION } from './types';

/* ------------------------------------------------------------------ ids + keys */

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** In-memory node identity: `cakeId>v1>v2`. Never used as a storage key. */
export function nodeKey(cakeId: string, path: readonly string[]): string {
  return [cakeId, ...path].join('>');
}

export function parseNodeKey(key: string): { cakeId: string; path: string[] } {
  const [cakeId, ...path] = key.split('>');
  return { cakeId, path };
}

/**
 * Durable, traceable asset key: `cake-<cakeId>--<valueId>--<valueId>`.
 * Derived on demand, never stored, so it can never drift from the path.
 *
 * Ids rather than slugged names because names here are Arabic: the prototype's
 * slug lowercases then strips everything outside [a-z0-9], which collapses an
 * Arabic name to the empty string and every image to `--`.
 */
export function imageStorageKey(cakeId: string, path: readonly string[]): string {
  return ['cake-' + cakeId, ...path].join('--');
}

/* ---------------------------------------------------------------- empty state */

export function emptyCatalog(): Catalog {
  return { schemaVersion: SCHEMA_VERSION, levels: [], cakes: [], images: [] };
}

/* -------------------------------------------------------------- coverage math */

/**
 * Number of nodes in a subtree rooted at a depth-`d` node, counting that node.
 * `below[L-1] = 1`; `below[d] = 1 + counts[d+1] * below[d+1]`.
 */
export function subtreeTotals(levels: readonly CatalogLevel[]): number[] {
  const L = levels.length;
  if (L === 0) return [];
  const counts = levels.map((l) => l.values.length);
  const below = new Array<number>(L);
  below[L - 1] = 1;
  for (let d = L - 2; d >= 0; d--) below[d] = 1 + counts[d + 1] * below[d + 1];
  return below;
}

/** Total images needed to fully cover one cake: every node at every depth. */
export function perCakeTotal(levels: readonly CatalogLevel[]): number {
  if (levels.length === 0) return 0;
  return levels[0].values.length * subtreeTotals(levels)[0];
}

/**
 * Images at or below every node, keyed by nodeKey. Each image bumps *every*
 * prefix of `[cakeId, ...path]`, so `hist[cakeId]` is the cake's total fill and
 * `hist[nodeKey]` is that subtree's fill.
 */
export function prefixFillHistogram(images: readonly CatalogImage[]): Record<string, number> {
  const hist: Record<string, number> = {};
  for (const img of images) {
    const ids = [img.cakeId, ...img.path];
    for (let k = 1; k <= ids.length; k++) {
      const key = ids.slice(0, k).join('>');
      hist[key] = (hist[key] ?? 0) + 1;
    }
  }
  return hist;
}

export function cakeCoverage(
  catalog: Catalog,
  cakeId: string,
  hist = prefixFillHistogram(catalog.images),
): CakeCoverage {
  const total = perCakeTotal(catalog.levels);
  const filled = hist[cakeId] ?? 0;
  return {
    filled,
    total,
    missing: Math.max(0, total - filled),
    pct: total > 0 ? Math.round((filled / total) * 100) : 0,
    complete: total > 0 && filled >= total,
  };
}

/** Full variant coverage AND a preview whose blob actually resolves. */
export function isReadyForCustomers(
  catalog: Catalog,
  cake: CatalogCake,
  hist: Record<string, number>,
  hasUrl: (imageId: string) => boolean,
): boolean {
  if (!cake.previewImageId || !hasUrl(cake.previewImageId)) return false;
  return cakeCoverage(catalog, cake.id, hist).complete;
}

/* ------------------------------------------------------------------ image index */

export function imagesByNodeKey(images: readonly CatalogImage[]): Map<string, CatalogImage> {
  const map = new Map<string, CatalogImage>();
  for (const img of images) map.set(nodeKey(img.cakeId, img.path), img);
  return map;
}

export function imageAt(
  catalog: Catalog,
  cakeId: string,
  path: readonly string[],
): CatalogImage | null {
  const key = nodeKey(cakeId, path);
  return catalog.images.find((i) => nodeKey(i.cakeId, i.path) === key) ?? null;
}

/* ---------------------------------------------------------------------- the tree */

/**
 * Flatten the variant tree into a linear list. Children are produced only for
 * expanded nodes, so a 120-node tree renders 3 rows when collapsed — and the
 * whole walk stays pure and testable.
 */
export function buildTreeRows(
  catalog: Catalog,
  cakeId: string,
  opts: {
    expanded: ReadonlySet<string>;
    missingOnly?: boolean;
    /** Pass the caller's memoised histogram — rebuilding it scans every image. */
    hist?: Record<string, number>;
  },
): TreeItem[] {
  const { levels } = catalog;
  if (levels.length === 0) return [];

  const missingOnly = opts.missingOnly ?? false;
  const below = subtreeTotals(levels);
  const hist = opts.hist ?? prefixFillHistogram(catalog.images);
  const byKey = imagesByNodeKey(catalog.images.filter((i) => i.cakeId === cakeId));
  const items: TreeItem[] = [];

  const walk = (depth: number, prefixPath: string[], prefixKey: string) => {
    const level = levels[depth];
    if (!level) return;

    for (const value of level.values) {
      const path = [...prefixPath, value.id];
      const key = `${prefixKey}>${value.id}`;
      const fill = hist[key] ?? 0;
      const total = below[depth];
      // A completed subtree is hidden wholesale — that is the point of the filter.
      if (missingOnly && fill >= total) continue;

      const hasChildren = depth < levels.length - 1;
      const expanded = hasChildren && opts.expanded.has(key);

      items.push({
        kind: 'node',
        key,
        depth,
        path,
        valueId: value.id,
        valueName: value.name,
        levelName: level.name,
        priceDelta: value.priceDelta,
        imageId: byKey.get(key)?.id ?? null,
        fill,
        total,
        hasChildren,
        expanded,
      });

      if (expanded) walk(depth + 1, path, key);
    }

    // Inline "add a value to this level" affordance; suppressed while filtering.
    if (!missingOnly) {
      items.push({
        kind: 'add',
        key: `add:${prefixKey}`,
        depth,
        levelIndex: depth,
        levelName: level.name,
      });
    }
  };

  walk(0, [], cakeId);
  return items;
}

/** A selection can be invalidated by any cascade — re-check before trusting it. */
export function isValidNodePath(catalog: Catalog, cakeId: string, path: readonly string[]): boolean {
  if (!catalog.cakes.some((c) => c.id === cakeId)) return false;
  if (path.length < 1 || path.length > catalog.levels.length) return false;
  return path.every((valueId, i) => catalog.levels[i]?.values.some((v) => v.id === valueId));
}

/* ------------------------------------------------------------------- uniqueness */

export function normalizeValueName(name: string): string {
  return name.trim().normalize('NFKC').replace(/\s+/g, ' ').toLocaleLowerCase();
}

/**
 * Case-insensitive uniqueness within a level only — the same name may exist in
 * a different level. `exceptId` lets a rename keep its own current name.
 */
export function findDuplicateValueName(
  level: CatalogLevel | undefined,
  name: string,
  exceptId?: string,
): boolean {
  if (!level) return false;
  const target = normalizeValueName(name);
  if (!target) return false;
  return level.values.some((v) => v.id !== exceptId && normalizeValueName(v.name) === target);
}

/* ---------------------------------------------------------------------- pricing */

export function pathPriceDelta(levels: readonly CatalogLevel[], path: readonly string[]): number {
  return path.reduce((sum, valueId, depth) => {
    const value = levels[depth]?.values.find((v) => v.id === valueId);
    return sum + (value?.priceDelta ?? 0);
  }, 0);
}

export function cakePriceForPath(catalog: Catalog, cakeId: string, path: readonly string[]): number {
  const cake = catalog.cakes.find((c) => c.id === cakeId);
  if (!cake) return 0;
  return cake.basePrice + pathPriceDelta(catalog.levels, path);
}

/* ------------------------------------------------------------------- cascades */

function result(
  catalog: Catalog,
  deadImageIds: string[] = [],
  clearedPreviewCakeIds: string[] = [],
): CascadeResult {
  return { catalog, deadImageIds, clearedPreviewCakeIds };
}

/**
 * Delete every image matching `pred` (plus any `extraDeadIds` such as reference
 * photos), optionally reshape the levels, and null every cake preview left
 * pointing at a deleted blob. The one place cascade semantics live.
 */
function purge(
  catalog: Catalog,
  pred: (image: CatalogImage) => boolean,
  opts: { extraDeadIds?: string[]; levels?: CatalogLevel[]; cakes?: CatalogCake[] } = {},
): CascadeResult {
  const dead = new Set<string>(opts.extraDeadIds ?? []);
  const images: CatalogImage[] = [];
  for (const img of catalog.images) {
    if (pred(img)) dead.add(img.id);
    else images.push(img);
  }

  const cleared: string[] = [];
  const cakes = (opts.cakes ?? catalog.cakes).map((cake) => {
    if (cake.previewImageId && dead.has(cake.previewImageId)) {
      cleared.push(cake.id);
      return { ...cake, previewImageId: null };
    }
    return cake;
  });

  return result(
    { ...catalog, levels: opts.levels ?? catalog.levels, cakes, images },
    [...dead],
    cleared,
  );
}

/* -- levels ------------------------------------------------------------------ */

/**
 * Append-only. Appending a level can never invalidate an existing path, so it
 * costs nothing; inserting mid-list would have the same unsolvable problem as
 * `moveLevel` below.
 */
export function addLevel(catalog: Catalog, name: string, id = newId()): CascadeResult {
  const trimmed = name.trim();
  if (!trimmed) return result(catalog);
  return result({ ...catalog, levels: [...catalog.levels, { id, name: trimmed, values: [] }] });
}

export function renameLevel(catalog: Catalog, index: number, name: string): CascadeResult {
  const trimmed = name.trim();
  if (!catalog.levels[index] || !trimmed) return result(catalog);
  const levels = catalog.levels.map((l, i) => (i === index ? { ...l, name: trimmed } : l));
  return result({ ...catalog, levels });
}

/**
 * An image of length `index` only references levels `0..index-1`, so it
 * survives; anything of length `index + 1` or deeper references this level and
 * dies with it. That predicate also sidesteps having to reindex deeper paths.
 */
export function deleteLevel(catalog: Catalog, index: number): CascadeResult {
  const level = catalog.levels[index];
  if (!level) return result(catalog);
  const extraDeadIds = level.values
    .map((v) => v.referenceImageId)
    .filter((id): id is string => !!id);
  return purge(catalog, (img) => img.path.length > index, {
    extraDeadIds,
    levels: catalog.levels.filter((_, i) => i !== index),
  });
}

/**
 * Reordering invalidates paths, because `path[i]` is by definition a value of
 * `levels[i]`. Full paths could be remapped, but a PARTIAL path has no correct
 * answer — a depth-1 «قلب» photo moved to position 3 no longer means anything.
 * So every image deeper than the shallowest touched level is destroyed, and the
 * count is surfaced so the UI can confirm before doing it.
 */
export function deletedByMoveLevel(catalog: Catalog, from: number, to: number): number {
  if (from === to || !catalog.levels[from] || !catalog.levels[to]) return 0;
  const floor = Math.min(from, to);
  return catalog.images.filter((img) => img.path.length > floor).length;
}

export function moveLevel(catalog: Catalog, from: number, to: number): CascadeResult {
  if (from === to || !catalog.levels[from] || !catalog.levels[to]) return result(catalog);
  const floor = Math.min(from, to);
  const levels = [...catalog.levels];
  const [moved] = levels.splice(from, 1);
  levels.splice(to, 0, moved);
  return purge(catalog, (img) => img.path.length > floor, { levels });
}

/* -- values ------------------------------------------------------------------ */

export function addValue(
  catalog: Catalog,
  levelIndex: number,
  name: string,
  id = newId(),
): CascadeResult {
  const level = catalog.levels[levelIndex];
  const trimmed = name.trim();
  if (!level || !trimmed || findDuplicateValueName(level, trimmed)) return result(catalog);
  const levels = catalog.levels.map((l, i) =>
    i === levelIndex
      ? { ...l, values: [...l.values, { id, name: trimmed, priceDelta: 0, referenceImageId: null }] }
      : l,
  );
  return result({ ...catalog, levels });
}

function patchValue(
  catalog: Catalog,
  levelIndex: number,
  valueId: string,
  patch: (value: CatalogLevel['values'][number]) => CatalogLevel['values'][number],
): Catalog {
  const levels = catalog.levels.map((l, i) =>
    i === levelIndex ? { ...l, values: l.values.map((v) => (v.id === valueId ? patch(v) : v)) } : l,
  );
  return { ...catalog, levels };
}

export function renameValue(
  catalog: Catalog,
  levelIndex: number,
  valueId: string,
  name: string,
): CascadeResult {
  const trimmed = name.trim();
  const level = catalog.levels[levelIndex];
  if (!level || !trimmed || findDuplicateValueName(level, trimmed, valueId)) return result(catalog);
  return result(patchValue(catalog, levelIndex, valueId, (v) => ({ ...v, name: trimmed })));
}

export function setValuePriceDelta(
  catalog: Catalog,
  levelIndex: number,
  valueId: string,
  priceDelta: number,
): CascadeResult {
  const safe = Number.isFinite(priceDelta) ? priceDelta : 0;
  return result(patchValue(catalog, levelIndex, valueId, (v) => ({ ...v, priceDelta: safe })));
}

/** Swapping a reference photo frees the previous blob. */
export function setValueReferenceImage(
  catalog: Catalog,
  levelIndex: number,
  valueId: string,
  imageId: string | null,
): CascadeResult {
  const previous = catalog.levels[levelIndex]?.values.find((v) => v.id === valueId)?.referenceImageId;
  const dead = previous && previous !== imageId ? [previous] : [];
  return result(
    patchValue(catalog, levelIndex, valueId, (v) => ({ ...v, referenceImageId: imageId })),
    dead,
  );
}

/** Removes the value from EVERY cake — levels and values are global. */
export function deleteValue(catalog: Catalog, levelIndex: number, valueId: string): CascadeResult {
  const level = catalog.levels[levelIndex];
  const value = level?.values.find((v) => v.id === valueId);
  if (!level || !value) return result(catalog);
  return purge(catalog, (img) => img.path[levelIndex] === valueId, {
    extraDeadIds: value.referenceImageId ? [value.referenceImageId] : [],
    levels: catalog.levels.map((l, i) =>
      i === levelIndex ? { ...l, values: l.values.filter((v) => v.id !== valueId) } : l,
    ),
  });
}

export function imagesUnderValue(
  catalog: Catalog,
  levelIndex: number,
  valueId: string,
): number {
  return catalog.images.filter((img) => img.path[levelIndex] === valueId).length;
}

export function imagesAtOrBelowLevel(catalog: Catalog, levelIndex: number): number {
  return catalog.images.filter((img) => img.path.length > levelIndex).length;
}

/* -- cakes ------------------------------------------------------------------- */

export function addCake(
  catalog: Catalog,
  cake: Omit<CatalogCake, 'id' | 'createdAt'>,
  id = newId(),
  createdAt = Date.now(),
): CascadeResult {
  return result({ ...catalog, cakes: [...catalog.cakes, { ...cake, id, createdAt }] });
}

export function updateCake(
  catalog: Catalog,
  cakeId: string,
  patch: Partial<Omit<CatalogCake, 'id' | 'createdAt'>>,
): CascadeResult {
  const cakes = catalog.cakes.map((c) => (c.id === cakeId ? { ...c, ...patch } : c));
  return result({ ...catalog, cakes });
}

export function deleteCake(catalog: Catalog, cakeId: string): CascadeResult {
  const cake = catalog.cakes.find((c) => c.id === cakeId);
  if (!cake) return result(catalog);
  return purge(catalog, (img) => img.cakeId === cakeId, {
    extraDeadIds: cake.previewImageId ? [cake.previewImageId] : [],
    cakes: catalog.cakes.filter((c) => c.id !== cakeId),
  });
}

/**
 * Point a cake at a new cover photo. The old preview blob is freed only when no
 * image row references it — so promoting a variant to preview and then changing
 * your mind never destroys that variant's photo.
 */
export function setPreview(catalog: Catalog, cakeId: string, imageId: string | null): CascadeResult {
  const cake = catalog.cakes.find((c) => c.id === cakeId);
  if (!cake || cake.previewImageId === imageId) return result(catalog);
  const previous = cake.previewImageId;
  const stillReferenced = previous ? catalog.images.some((i) => i.id === previous) : true;
  const dead = previous && !stillReferenced ? [previous] : [];
  return result(
    { ...catalog, cakes: catalog.cakes.map((c) => (c.id === cakeId ? { ...c, previewImageId: imageId } : c)) },
    dead,
  );
}

/* -- images ------------------------------------------------------------------ */

/**
 * Save (or replace) the photo at one node. On replace the old blob dies, and
 * any cake preview pointing at it FOLLOWS the replacement rather than breaking.
 */
export function upsertImage(
  catalog: Catalog,
  image: CatalogImage,
): CascadeResult {
  const key = nodeKey(image.cakeId, image.path);
  const existing = catalog.images.find((i) => nodeKey(i.cakeId, i.path) === key);
  const images = existing
    ? catalog.images.map((i) => (i.id === existing.id ? image : i))
    : [...catalog.images, image];

  const cakes = existing
    ? catalog.cakes.map((c) =>
        c.previewImageId === existing.id ? { ...c, previewImageId: image.id } : c,
      )
    : catalog.cakes;

  return result({ ...catalog, cakes, images }, existing ? [existing.id] : []);
}

export function removeImage(catalog: Catalog, imageId: string): CascadeResult {
  if (!catalog.images.some((i) => i.id === imageId)) return result(catalog);
  return purge(catalog, (img) => img.id === imageId);
}

/* ---------------------------------------------------------------- self-repair */

/** Every blob id the catalog still needs. Anything else in the blob store is garbage. */
export function referencedBlobIds(catalog: Catalog): Set<string> {
  const ids = new Set<string>();
  for (const img of catalog.images) ids.add(img.id);
  for (const cake of catalog.cakes) if (cake.previewImageId) ids.add(cake.previewImageId);
  for (const level of catalog.levels) {
    for (const value of level.values) if (value.referenceImageId) ids.add(value.referenceImageId);
  }
  return ids;
}

export interface RepairReport {
  catalog: Catalog;
  changed: boolean;
  droppedImageIds: string[];
}

/**
 * Reconcile persisted metadata against the blobs that actually survived, and
 * against the current level structure. Runs on every boot: a user can clear
 * IndexedDB without clearing localStorage, Safari evicts IndexedDB after ~7 idle
 * days, and a crash mid-cascade can leave metadata referencing a deleted value.
 */
export function repairCatalog(catalog: Catalog, existingBlobIds: ReadonlySet<string>): RepairReport {
  const cakeIds = new Set(catalog.cakes.map((c) => c.id));
  const valueIdsByDepth = catalog.levels.map((l) => new Set(l.values.map((v) => v.id)));

  const droppedImageIds: string[] = [];
  const images = catalog.images.filter((img) => {
    const structurallyValid =
      cakeIds.has(img.cakeId) &&
      img.path.length >= 1 &&
      img.path.length <= catalog.levels.length &&
      img.path.every((valueId, depth) => valueIdsByDepth[depth]?.has(valueId));
    if (structurallyValid && existingBlobIds.has(img.id)) return true;
    droppedImageIds.push(img.id);
    return false;
  });

  // A preview may point at a standalone blob (a cake created before any variant
  // was uploaded), so blob existence is the test — plus the ids just dropped.
  const dropped = new Set(droppedImageIds);
  const cakes = catalog.cakes.map((cake) => {
    const alive =
      cake.previewImageId && existingBlobIds.has(cake.previewImageId) && !dropped.has(cake.previewImageId);
    return alive ? cake : { ...cake, previewImageId: null };
  });

  const levels = catalog.levels.map((level) => ({
    ...level,
    values: level.values.map((value) => {
      const alive = value.referenceImageId && existingBlobIds.has(value.referenceImageId);
      return alive ? value : { ...value, referenceImageId: null };
    }),
  }));

  const changed =
    droppedImageIds.length > 0 ||
    cakes.some((c, i) => c.previewImageId !== catalog.cakes[i].previewImageId) ||
    levels.some((l, i) =>
      l.values.some((v, j) => v.referenceImageId !== catalog.levels[i].values[j].referenceImageId),
    );

  return {
    catalog: changed ? { ...catalog, levels, cakes, images } : catalog,
    changed,
    droppedImageIds,
  };
}

/**
 * Structural sanity check used when parsing persisted JSON. Deliberately shallow —
 * `repairCatalog` handles everything a type guard cannot.
 */
export function isCatalogShape(value: unknown): value is Catalog {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<Catalog>;
  return (
    c.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(c.levels) &&
    Array.isArray(c.cakes) &&
    Array.isArray(c.images)
  );
}
