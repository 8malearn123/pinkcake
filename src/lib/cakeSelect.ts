/**
 * Cake studio — the photo-driven selection core, pure and React-free.
 *
 * The central business rule lives here: an option is offered ONLY when the
 * image for `current path + that option` exists and its blob resolves. No
 * photo ⇒ not shown. The stage always shows the deepest photographed match,
 * captioned when the match is shallower than the customer's picks.
 */

import { imagesByNodeKey, nodeKey } from '@/lib/cakeCatalog/catalog';
import type { Catalog, CatalogCake, CatalogImage, CatalogLevel } from '@/lib/cakeCatalog/types';

export type UrlLookup = (imageId: string | null | undefined) => string | undefined;

/** `picks` is dense (`levels.length` slots); the path is its contiguous non-null prefix. */
export function contiguousPath(picks: readonly (string | null)[]): string[] {
  const firstGap = picks.findIndex((p) => p === null);
  return (firstGap === -1 ? [...picks] : picks.slice(0, firstGap)) as string[];
}

/**
 * Positional labels: `path[i]` is by definition a value of `levels[i]`. The
 * prototype collected only truthy picks then sliced by depth — the two indices
 * diverge as soon as a level is skipped and the caption names the wrong
 * options. Indexing by depth cannot drift.
 */
export function pathLabels(levels: readonly CatalogLevel[], path: readonly string[]): string[] {
  return path.map(
    (valueId, depth) => levels[depth]?.values.find((v) => v.id === valueId)?.name ?? '؟',
  );
}

export function seedPicks(levels: readonly CatalogLevel[], path?: readonly string[]): (string | null)[] {
  const picks = new Array<string | null>(levels.length).fill(null);
  path?.forEach((valueId, depth) => {
    if (depth < picks.length) picks[depth] = valueId;
  });
  return picks;
}

/** Re-clicking the current value is a no-op; a real change truncates deeper picks. */
export function applyPick(
  picks: readonly (string | null)[],
  depth: number,
  valueId: string,
): (string | null)[] {
  if (picks[depth] === valueId) return [...picks];
  const next = picks.map((pick, i) => (i < depth ? pick : null));
  next[depth] = valueId;
  return next;
}

export interface GalleryCake {
  cake: CatalogCake;
  previewUrl: string;
}

/**
 * Only cakes a customer can actually start designing: a resolvable preview AND
 * at least one photographed depth-1 option — a preview alone would dead-end
 * them on the first step.
 */
export function galleryCakes(catalog: Catalog, urlFor: UrlLookup): GalleryCake[] {
  return catalog.cakes
    .map((cake) => ({ cake, previewUrl: urlFor(cake.previewImageId) }))
    .filter((entry): entry is GalleryCake => {
      if (!entry.previewUrl) return false;
      return catalog.images.some(
        (img) => img.cakeId === entry.cake.id && img.path.length === 1 && !!urlFor(img.id),
      );
    });
}

export interface AvailableValue {
  id: string;
  name: string;
  priceDelta: number;
  /** Reference photo when the value has one, else that variant's photo. */
  thumbUrl: string;
}

/**
 * The values offered at `prefix.length` for this cake. Both halves of the
 * check matter: a metadata row whose blob was evicted must not be offered,
 * or the customer picks an option whose photo can never load.
 */
export function availableValues(
  catalog: Catalog,
  byKey: ReadonlyMap<string, CatalogImage>,
  urlFor: UrlLookup,
  cakeId: string,
  prefix: readonly string[],
): AvailableValue[] {
  const level = catalog.levels[prefix.length];
  if (!level) return [];
  const out: AvailableValue[] = [];
  for (const value of level.values) {
    const image = byKey.get(nodeKey(cakeId, [...prefix, value.id]));
    const variantUrl = image ? urlFor(image.id) : undefined;
    if (!variantUrl) continue;
    out.push({
      id: value.id,
      name: value.name,
      priceDelta: value.priceDelta,
      thumbUrl: urlFor(value.referenceImageId) ?? variantUrl,
    });
  }
  return out;
}

export interface StageMatch {
  url: string | null;
  imageId: string | null;
  /** How many picks the shown photo covers; 0 = the cake preview, -1 = nothing. */
  depth: number;
}

/** Deepest photographed prefix of the picks, falling back to the cake preview. */
export function deepestMatch(
  catalog: Catalog,
  byKey: ReadonlyMap<string, CatalogImage>,
  urlFor: UrlLookup,
  cake: CatalogCake,
  path: readonly string[],
): StageMatch {
  for (let depth = path.length; depth >= 1; depth--) {
    const image = byKey.get(nodeKey(cake.id, path.slice(0, depth)));
    const url = image ? urlFor(image.id) : undefined;
    if (image && url) return { url, imageId: image.id, depth };
  }
  const previewUrl = urlFor(cake.previewImageId);
  if (cake.previewImageId && previewUrl) {
    return { url: previewUrl, imageId: cake.previewImageId, depth: 0 };
  }
  return { url: null, imageId: null, depth: -1 };
}

/** Caption shown when the photo covers fewer picks than the customer has made. */
export function stageCaption(
  cake: CatalogCake,
  labels: readonly string[],
  match: StageMatch,
): string | null {
  if (match.depth < 0 || match.depth >= labels.length) return null;
  return match.depth === 0 ? cake.name : [cake.name, ...labels.slice(0, match.depth)].join(' · ');
}

export { imagesByNodeKey, nodeKey };
