import { describe, it, expect } from 'vitest';
import {
  addLevel,
  buildTreeRows,
  cakeCoverage,
  cakePriceForPath,
  deleteCake,
  deleteLevel,
  deleteValue,
  deletedByMoveLevel,
  emptyCatalog,
  findDuplicateValueName,
  imageStorageKey,
  imagesAtOrBelowLevel,
  imagesUnderValue,
  isReadyForCustomers,
  isValidNodePath,
  moveLevel,
  nodeKey,
  parseNodeKey,
  pathPriceDelta,
  perCakeTotal,
  prefixFillHistogram,
  referencedBlobIds,
  removeImage,
  repairCatalog,
  setPreview,
  subtreeTotals,
  upsertImage,
} from './catalog';
import { SCHEMA_VERSION } from './types';
import type { Catalog, CatalogCake, CatalogImage, CatalogLevel, CatalogValue, TreeItem } from './types';

/* ------------------------------------------------------------------ fixtures */

const val = (
  id: string,
  name: string,
  priceDelta = 0,
  referenceImageId: string | null = null,
): CatalogValue => ({ id, name, priceDelta, referenceImageId });

const lvl = (id: string, name: string, values: CatalogValue[]): CatalogLevel => ({ id, name, values });

const cake = (id: string, patch: Partial<CatalogCake> = {}): CatalogCake => ({
  id,
  name: `كيكة ${id}`,
  basePrice: 100,
  serves: '6–8',
  leadTime: '24 ساعة',
  previewImageId: null,
  createdAt: 0,
  ...patch,
});

const img = (id: string, cakeId: string, path: string[]): CatalogImage => ({
  id,
  cakeId,
  path,
  fileName: `${id}.jpg`,
  width: 480,
  height: 360,
  size: 1024,
  createdAt: 0,
});

const catalogOf = (parts: Partial<Catalog>): Catalog => ({
  schemaVersion: SCHEMA_VERSION,
  levels: [],
  cakes: [],
  images: [],
  ...parts,
});

/** Levels with `counts[d]` generated values each, ids `v<d>-<i>` — for the pure math. */
const levelsOf = (counts: number[]): CatalogLevel[] =>
  counts.map((count, d) =>
    lvl(
      `L${d}`,
      `المستوى ${d}`,
      Array.from({ length: count }, (_, i) => val(`v${d}-${i}`, `قيمة ${d}-${i}`)),
    ),
  );

/**
 * المستويان: الشكل (a1, a2) ثم النكهة (b1, b2)، وكيكتان بصور على أعماق مختلفة.
 * كل المعرّفات صريحة حتى تبقى كل التوقعات حتمية.
 */
const fixture = (): Catalog =>
  catalogOf({
    levels: [
      lvl('L0', 'الشكل', [val('a1', 'قلب', 10, 'refA1'), val('a2', 'دائرية', 0)]),
      lvl('L1', 'النكهة', [val('b1', 'شوكولاتة', 5, 'refB1'), val('b2', 'فانيليا', -3)]),
    ],
    cakes: [cake('c1', { basePrice: 100 }), cake('c2', { basePrice: 200 })],
    images: [
      img('i1', 'c1', ['a1']),
      img('i2', 'c1', ['a1', 'b1']),
      img('i3', 'c1', ['a1', 'b2']),
      img('i4', 'c1', ['a2']),
      img('i5', 'c1', ['a2', 'b1']),
      img('i6', 'c2', ['a1']),
      img('i7', 'c2', ['a1', 'b1']),
    ],
  });

/** ثلاثة مستويات — إعادة الترتيب تحتاج أكثر من مستويين لتكون ذات معنى. */
const moveFixture = (): Catalog =>
  catalogOf({
    levels: [
      lvl('L0', 'الشكل', [val('a1', 'قلب'), val('a2', 'دائرية')]),
      lvl('L1', 'النكهة', [val('b1', 'شوكولاتة'), val('b2', 'فانيليا')]),
      lvl('L2', 'الإضافات', [val('d1', 'فراولة'), val('d2', 'رشّات')]),
    ],
    cakes: [cake('c1'), cake('c2')],
    images: [
      img('m1', 'c1', ['a1']),
      img('m2', 'c1', ['a1', 'b1']),
      img('m3', 'c1', ['a1', 'b1', 'd1']),
      img('m4', 'c1', ['a2']),
      img('m5', 'c2', ['a1', 'b2']),
    ],
  });

const withPreview = (catalog: Catalog, cakeId: string, imageId: string | null): Catalog => ({
  ...catalog,
  cakes: catalog.cakes.map((c) => (c.id === cakeId ? { ...c, previewImageId: imageId } : c)),
});

const previewOf = (catalog: Catalog, cakeId: string): string | null =>
  catalog.cakes.find((c) => c.id === cakeId)?.previewImageId ?? null;

const imageIds = (catalog: Catalog): string[] => catalog.images.map((i) => i.id);
const sorted = (ids: readonly string[]): string[] => [...ids].sort();
type TreeNodeRow = Extract<TreeItem, { kind: 'node' }>;
const nodeRows = (items: TreeItem[]): TreeNodeRow[] =>
  items.filter((i): i is TreeNodeRow => i.kind === 'node');

/* ------------------------------------------------------------- coverage math */

describe('subtreeTotals / perCakeTotal', () => {
  it('counts 40/13/4/1 nodes below each depth of a 4×3 tree, 120 per cake', () => {
    const levels = levelsOf([3, 3, 3, 3]);
    expect(subtreeTotals(levels)).toEqual([40, 13, 4, 1]);
    expect(perCakeTotal(levels)).toBe(120);
    expect(perCakeTotal(levels)).toBe(3 + 9 + 27 + 81);
  });

  it('handles a shallow 2×3 tree', () => {
    const levels = levelsOf([2, 3]);
    expect(subtreeTotals(levels)).toEqual([4, 1]);
    expect(perCakeTotal(levels)).toBe(8);
    expect(perCakeTotal(levels)).toBe(2 + 6);
  });

  it('is zero with no levels at all', () => {
    expect(subtreeTotals([])).toEqual([]);
    expect(perCakeTotal([])).toBe(0);
    expect(perCakeTotal(emptyCatalog().levels)).toBe(0);
  });

  it('an empty level 0 makes the whole cake unreachable', () => {
    const levels = levelsOf([0, 3]);
    expect(subtreeTotals(levels)).toEqual([4, 1]);
    expect(perCakeTotal(levels)).toBe(0);

    const rows = buildTreeRows(catalogOf({ levels, cakes: [cake('c1')] }), 'c1', {
      expanded: new Set(),
    });
    expect(nodeRows(rows)).toHaveLength(0);
    expect(rows.map((r) => r.kind)).toEqual(['add']);
  });

  it('an empty middle level truncates the tree at the level above it', () => {
    const levels = levelsOf([3, 0, 3]);
    expect(subtreeTotals(levels)).toEqual([1, 4, 1]);
    expect(perCakeTotal(levels)).toBe(3);

    const catalog = catalogOf({ levels, cakes: [cake('c1')] });
    const rows = buildTreeRows(catalog, 'c1', {
      expanded: new Set(['c1>v0-0', 'c1>v0-1', 'c1>v0-2']),
    });
    expect(nodeRows(rows)).toHaveLength(3);
    expect(nodeRows(rows).every((r) => r.depth === 0)).toBe(true);
  });
});

describe('prefixFillHistogram', () => {
  it('bumps exactly every prefix of the image path and nothing else', () => {
    const hist = prefixFillHistogram([img('x', 'cake', ['a', 'b', 'c'])]);
    expect(hist).toEqual({
      cake: 1,
      'cake>a': 1,
      'cake>a>b': 1,
      'cake>a>b>c': 1,
    });
  });

  it('accumulates across images that share a prefix', () => {
    const hist = prefixFillHistogram([
      img('x', 'cake', ['a']),
      img('y', 'cake', ['a', 'b']),
      img('z', 'cake', ['a', 'c']),
    ]);
    expect(hist['cake']).toBe(3);
    expect(hist['cake>a']).toBe(3);
    expect(hist['cake>a>b']).toBe(1);
  });
});

describe('cakeCoverage', () => {
  it('reports filled/total/missing/pct against the per-cake total', () => {
    const catalog = fixture();
    expect(perCakeTotal(catalog.levels)).toBe(6);

    expect(cakeCoverage(catalog, 'c1')).toEqual({
      filled: 5,
      total: 6,
      missing: 1,
      pct: 83,
      complete: false,
    });
    expect(cakeCoverage(catalog, 'c2')).toEqual({
      filled: 2,
      total: 6,
      missing: 4,
      pct: 33,
      complete: false,
    });
  });

  it('is complete only once filled reaches the total', () => {
    const base = fixture();
    const full = { ...base, images: [...base.images, img('i8', 'c1', ['a2', 'b2'])] };
    expect(cakeCoverage(full, 'c1')).toEqual({
      filled: 6,
      total: 6,
      missing: 0,
      pct: 100,
      complete: true,
    });
  });

  it('never reports complete when the total is zero', () => {
    const catalog = catalogOf({ cakes: [cake('c1')], images: [img('z', 'c1', ['ghost'])] });
    expect(cakeCoverage(catalog, 'c1')).toEqual({
      filled: 1,
      total: 0,
      missing: 0,
      pct: 0,
      complete: false,
    });
  });
});

describe('isReadyForCustomers', () => {
  const ready = (): Catalog =>
    catalogOf({
      levels: [lvl('L0', 'الشكل', [val('a1', 'قلب')]), lvl('L1', 'النكهة', [val('b1', 'شوكولاتة')])],
      cakes: [cake('c1')],
      images: [img('r1', 'c1', ['a1']), img('r2', 'c1', ['a1', 'b1'])],
    });

  it('needs a preview even with full coverage', () => {
    const catalog = ready();
    expect(cakeCoverage(catalog, 'c1').complete).toBe(true);
    const hist = prefixFillHistogram(catalog.images);
    expect(isReadyForCustomers(catalog, catalog.cakes[0], hist, () => true)).toBe(false);
  });

  it('needs the preview blob to actually resolve', () => {
    const catalog = withPreview(ready(), 'c1', 'r1');
    const hist = prefixFillHistogram(catalog.images);
    expect(isReadyForCustomers(catalog, catalog.cakes[0], hist, () => false)).toBe(false);
    expect(isReadyForCustomers(catalog, catalog.cakes[0], hist, (id) => id === 'r1')).toBe(true);
  });

  it('is false while coverage is incomplete', () => {
    const base = ready();
    const partial = withPreview({ ...base, images: [base.images[0]] }, 'c1', 'r1');
    const hist = prefixFillHistogram(partial.images);
    expect(isReadyForCustomers(partial, partial.cakes[0], hist, () => true)).toBe(false);
  });
});

/* --------------------------------------------------------------- uniqueness */

describe('findDuplicateValueName', () => {
  const level = lvl('L0', 'الشكل', [
    val('a1', 'قلب'),
    val('a2', 'ريد فيلفِت'),
    val('a3', 'Vanilla'),
    val('a4', 'لامسة'),
  ]);

  it('ignores surrounding whitespace', () => {
    expect(findDuplicateValueName(level, '  قلب  ')).toBe(true);
  });

  it('collapses inner whitespace', () => {
    expect(findDuplicateValueName(level, 'ريد   فيلفِت')).toBe(true);
  });

  it('is case-insensitive for Latin names', () => {
    expect(findDuplicateValueName(level, 'vANILLA')).toBe(true);
  });

  it('folds NFKC-equivalent forms (the lam-alef ligature)', () => {
    expect(findDuplicateValueName(level, 'ﻻمسة')).toBe(true);
  });

  it('allows a genuinely different name', () => {
    expect(findDuplicateValueName(level, 'مربعة')).toBe(false);
  });

  it('allows the same name in a different level', () => {
    const other = lvl('L1', 'النكهة', [val('b1', 'شوكولاتة')]);
    expect(findDuplicateValueName(other, 'قلب')).toBe(false);
    expect(findDuplicateValueName(undefined, 'قلب')).toBe(false);
  });

  it('lets a value keep its own name via exceptId', () => {
    expect(findDuplicateValueName(level, 'قلب', 'a1')).toBe(false);
    expect(findDuplicateValueName(level, ' قلب ', 'a2')).toBe(true);
  });

  it('treats an all-whitespace candidate as no clash', () => {
    expect(findDuplicateValueName(level, '   ')).toBe(false);
  });
});

/* ------------------------------------------------------------------ cascades */

describe('deleteValue', () => {
  it('kills that value everywhere, across every cake, and frees its reference photo', () => {
    const start = withPreview(withPreview(fixture(), 'c1', 'i2'), 'c2', 'i6');
    const { catalog, deadImageIds, clearedPreviewCakeIds } = deleteValue(start, 0, 'a1');

    expect(sorted(deadImageIds)).toEqual(sorted(['i1', 'i2', 'i3', 'i6', 'i7', 'refA1']));
    expect(imageIds(catalog)).toEqual(['i4', 'i5']);
    expect(catalog.levels[0].values.map((v) => v.id)).toEqual(['a2']);
    expect(catalog.levels[1].values.map((v) => v.id)).toEqual(['b1', 'b2']);
    expect(sorted(clearedPreviewCakeIds)).toEqual(['c1', 'c2']);
    expect(previewOf(catalog, 'c1')).toBeNull();
    expect(previewOf(catalog, 'c2')).toBeNull();
  });

  it('keeps shallower images and only clears the previews that actually died', () => {
    const start = withPreview(withPreview(fixture(), 'c1', 'i2'), 'c2', 'i6');
    const { catalog, deadImageIds, clearedPreviewCakeIds } = deleteValue(start, 1, 'b1');

    expect(sorted(deadImageIds)).toEqual(sorted(['i2', 'i5', 'i7', 'refB1']));
    expect(imageIds(catalog)).toEqual(['i1', 'i3', 'i4', 'i6']);
    expect(clearedPreviewCakeIds).toEqual(['c1']);
    expect(previewOf(catalog, 'c1')).toBeNull();
    expect(previewOf(catalog, 'c2')).toBe('i6');
  });

  it('is a no-op for an unknown value', () => {
    const start = fixture();
    const res = deleteValue(start, 0, 'ghost');
    expect(res.catalog).toBe(start);
    expect(res.deadImageIds).toEqual([]);
  });

  it('imagesUnderValue counts exactly what the confirmation must warn about', () => {
    expect(imagesUnderValue(fixture(), 0, 'a1')).toBe(5);
    expect(imagesUnderValue(fixture(), 1, 'b1')).toBe(3);
  });
});

describe('deleteLevel', () => {
  it('kills only paths deeper than the level and splices it out', () => {
    const start = withPreview(withPreview(fixture(), 'c1', 'i2'), 'c2', 'i6');
    const { catalog, deadImageIds, clearedPreviewCakeIds } = deleteLevel(start, 1);

    expect(sorted(deadImageIds)).toEqual(sorted(['i2', 'i3', 'i5', 'i7', 'refB1']));
    expect(imageIds(catalog)).toEqual(['i1', 'i4', 'i6']);
    expect(catalog.images.every((i) => i.path.length <= 1)).toBe(true);
    expect(catalog.levels.map((l) => l.id)).toEqual(['L0']);
    expect(clearedPreviewCakeIds).toEqual(['c1']);
  });

  it('deleting level 0 destroys every image and frees its reference photos', () => {
    const { catalog, deadImageIds } = deleteLevel(fixture(), 0);
    expect(catalog.images).toEqual([]);
    expect(sorted(deadImageIds)).toEqual(sorted(['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'refA1']));
    expect(catalog.levels.map((l) => l.id)).toEqual(['L1']);
  });

  it('imagesAtOrBelowLevel matches what deleteLevel will destroy', () => {
    expect(imagesAtOrBelowLevel(fixture(), 1)).toBe(4);
    expect(imagesAtOrBelowLevel(fixture(), 0)).toBe(7);
  });

  it('is a no-op for an out-of-range index', () => {
    const start = fixture();
    const res = deleteLevel(start, 9);
    expect(res.catalog).toBe(start);
    expect(res.deadImageIds).toEqual([]);
  });
});

describe('deleteCake', () => {
  it('destroys that cake, its images and its preview blob, and nothing else', () => {
    const start = withPreview(withPreview(fixture(), 'c1', 'pv1'), 'c2', 'i6');
    const { catalog, deadImageIds, clearedPreviewCakeIds } = deleteCake(start, 'c1');

    expect(sorted(deadImageIds)).toEqual(sorted(['i1', 'i2', 'i3', 'i4', 'i5', 'pv1']));
    expect(catalog.cakes.map((c) => c.id)).toEqual(['c2']);
    expect(imageIds(catalog)).toEqual(['i6', 'i7']);
    expect(previewOf(catalog, 'c2')).toBe('i6');
    expect(clearedPreviewCakeIds).toEqual([]);
    expect(catalog.levels).toEqual(start.levels);
  });

  it('is a no-op for an unknown cake', () => {
    const start = fixture();
    const res = deleteCake(start, 'ghost');
    expect(res.catalog).toBe(start);
    expect(res.deadImageIds).toEqual([]);
  });
});

describe('moveLevel / deletedByMoveLevel', () => {
  it('permutes the levels and destroys everything below the shallowest touched level', () => {
    const start = moveFixture();
    expect(deletedByMoveLevel(start, 1, 2)).toBe(3);

    const { catalog, deadImageIds } = moveLevel(start, 1, 2);
    expect(catalog.levels.map((l) => l.id)).toEqual(['L0', 'L2', 'L1']);
    expect(sorted(deadImageIds)).toEqual(sorted(['m2', 'm3', 'm5']));
    expect(deadImageIds).toHaveLength(deletedByMoveLevel(start, 1, 2));
    expect(imageIds(catalog)).toEqual(['m1', 'm4']);
  });

  it('moving a level to the front wipes every image', () => {
    const start = moveFixture();
    expect(deletedByMoveLevel(start, 2, 0)).toBe(5);

    const { catalog, deadImageIds } = moveLevel(start, 2, 0);
    expect(catalog.levels.map((l) => l.id)).toEqual(['L2', 'L0', 'L1']);
    expect(catalog.images).toEqual([]);
    expect(deadImageIds).toHaveLength(5);
  });

  it('from === to is a no-op with no dead ids', () => {
    const start = moveFixture();
    expect(deletedByMoveLevel(start, 1, 1)).toBe(0);
    const res = moveLevel(start, 1, 1);
    expect(res.catalog).toBe(start);
    expect(res.deadImageIds).toEqual([]);
    expect(res.clearedPreviewCakeIds).toEqual([]);
  });

  it('an out-of-range index changes nothing', () => {
    const start = moveFixture();
    expect(deletedByMoveLevel(start, 0, 9)).toBe(0);
    expect(moveLevel(start, 0, 9).catalog).toBe(start);
  });
});

describe('addLevel', () => {
  it('appends without touching any image', () => {
    const start = fixture();
    const { catalog, deadImageIds, clearedPreviewCakeIds } = addLevel(start, '  التغليف  ', 'L2');

    expect(catalog.levels.map((l) => l.id)).toEqual(['L0', 'L1', 'L2']);
    expect(catalog.levels[2]).toEqual({ id: 'L2', name: 'التغليف', values: [] });
    expect(catalog.images).toEqual(start.images);
    expect(deadImageIds).toEqual([]);
    expect(clearedPreviewCakeIds).toEqual([]);
  });

  it('rejects a blank name', () => {
    const start = fixture();
    expect(addLevel(start, '   ', 'L2').catalog).toBe(start);
  });
});

describe('upsertImage', () => {
  it('inserting at a fresh node adds one image and kills nothing', () => {
    const start = fixture();
    const { catalog, deadImageIds, clearedPreviewCakeIds } = upsertImage(
      start,
      img('i8', 'c1', ['a2', 'b2']),
    );

    expect(catalog.images).toHaveLength(start.images.length + 1);
    expect(imageIds(catalog)).toContain('i8');
    expect(deadImageIds).toEqual([]);
    expect(clearedPreviewCakeIds).toEqual([]);
  });

  it('replacing a node frees the old blob and keeps the image count', () => {
    const start = fixture();
    const { catalog, deadImageIds } = upsertImage(start, img('i2b', 'c1', ['a1', 'b1']));

    expect(deadImageIds).toEqual(['i2']);
    expect(catalog.images).toHaveLength(start.images.length);
    expect(imageIds(catalog)).toContain('i2b');
    expect(imageIds(catalog)).not.toContain('i2');
  });

  it('a preview pointing at the replaced image follows the replacement', () => {
    const start = withPreview(fixture(), 'c1', 'i2');
    const { catalog, deadImageIds, clearedPreviewCakeIds } = upsertImage(
      start,
      img('i2b', 'c1', ['a1', 'b1']),
    );

    expect(previewOf(catalog, 'c1')).toBe('i2b');
    expect(clearedPreviewCakeIds).toEqual([]);
    expect(deadImageIds).toEqual(['i2']);
  });

  it('the same node on another cake is a separate image', () => {
    const start = fixture();
    const { catalog, deadImageIds } = upsertImage(start, img('i9', 'c2', ['a2']));
    expect(deadImageIds).toEqual([]);
    expect(catalog.images).toHaveLength(start.images.length + 1);
  });
});

describe('removeImage', () => {
  it('nulls a preview that pointed at it and reports the cake', () => {
    const start = withPreview(withPreview(fixture(), 'c1', 'i3'), 'c2', 'i6');
    const { catalog, deadImageIds, clearedPreviewCakeIds } = removeImage(start, 'i3');

    expect(deadImageIds).toEqual(['i3']);
    expect(clearedPreviewCakeIds).toEqual(['c1']);
    expect(previewOf(catalog, 'c1')).toBeNull();
    expect(previewOf(catalog, 'c2')).toBe('i6');
    expect(imageIds(catalog)).not.toContain('i3');
  });

  it('is a no-op for an unknown image', () => {
    const start = fixture();
    const res = removeImage(start, 'ghost');
    expect(res.catalog).toBe(start);
    expect(res.deadImageIds).toEqual([]);
  });
});

describe('setPreview', () => {
  it('never destroys a variant photo that is still an image row', () => {
    const promoted = setPreview(fixture(), 'c1', 'i1');
    expect(promoted.deadImageIds).toEqual([]);
    expect(previewOf(promoted.catalog, 'c1')).toBe('i1');

    const changed = setPreview(promoted.catalog, 'c1', 'i4');
    expect(changed.deadImageIds).toEqual([]);
    expect(imageIds(changed.catalog)).toContain('i1');
    expect(previewOf(changed.catalog, 'c1')).toBe('i4');
  });

  it('frees a standalone preview blob that no image row references', () => {
    const start = withPreview(fixture(), 'c1', 'pv1');
    expect(setPreview(start, 'c1', 'i1').deadImageIds).toEqual(['pv1']);
    expect(setPreview(start, 'c1', null).deadImageIds).toEqual(['pv1']);
  });

  it('is a no-op when the preview is already that image', () => {
    const start = withPreview(fixture(), 'c1', 'i1');
    const res = setPreview(start, 'c1', 'i1');
    expect(res.catalog).toBe(start);
    expect(res.deadImageIds).toEqual([]);
  });

  it('is a no-op for an unknown cake', () => {
    const start = fixture();
    expect(setPreview(start, 'ghost', 'i1').catalog).toBe(start);
  });
});

/* -------------------------------------------------------------- self-repair */

describe('repairCatalog', () => {
  const healthy = (): Catalog =>
    withPreview(
      catalogOf({
        levels: [
          lvl('L0', 'الشكل', [val('a1', 'قلب', 0, 'ref1'), val('a2', 'دائرية')]),
          lvl('L1', 'النكهة', [val('b1', 'شوكولاتة'), val('b2', 'فانيليا')]),
        ],
        cakes: [cake('c1')],
        images: [img('i1', 'c1', ['a1']), img('i2', 'c1', ['a1', 'b1'])],
      }),
      'c1',
      'pv1',
    );

  const allBlobs = new Set(['i1', 'i2', 'pv1', 'ref1']);

  it('leaves a healthy catalog untouched', () => {
    const catalog = healthy();
    const report = repairCatalog(catalog, allBlobs);
    expect(report.changed).toBe(false);
    expect(report.droppedImageIds).toEqual([]);
    expect(report.catalog).toBe(catalog);
  });

  it('drops an image whose blob is gone', () => {
    const report = repairCatalog(healthy(), new Set(['i2', 'pv1', 'ref1']));
    expect(report.changed).toBe(true);
    expect(report.droppedImageIds).toEqual(['i1']);
    expect(imageIds(report.catalog)).toEqual(['i2']);
  });

  it('drops an image whose cake no longer exists', () => {
    const base = healthy();
    const broken = { ...base, images: [...base.images, img('orphan', 'ghost', ['a1'])] };
    const report = repairCatalog(broken, new Set([...allBlobs, 'orphan']));
    expect(report.changed).toBe(true);
    expect(report.droppedImageIds).toEqual(['orphan']);
    expect(imageIds(report.catalog)).toEqual(['i1', 'i2']);
  });

  it('drops an image whose path is deeper than the level list', () => {
    const base = healthy();
    const broken = { ...base, images: [...base.images, img('deep', 'c1', ['a1', 'b1', 'x'])] };
    const report = repairCatalog(broken, new Set([...allBlobs, 'deep']));
    expect(report.changed).toBe(true);
    expect(report.droppedImageIds).toEqual(['deep']);
  });

  it('drops an image whose value id does not belong to that depth', () => {
    const base = healthy();
    const broken = { ...base, images: [...base.images, img('misplaced', 'c1', ['b1'])] };
    const report = repairCatalog(broken, new Set([...allBlobs, 'misplaced']));
    expect(report.changed).toBe(true);
    expect(report.droppedImageIds).toEqual(['misplaced']);
  });

  it('drops an image with an empty path', () => {
    const base = healthy();
    const broken = { ...base, images: [...base.images, img('rootless', 'c1', [])] };
    const report = repairCatalog(broken, new Set([...allBlobs, 'rootless']));
    expect(report.changed).toBe(true);
    expect(report.droppedImageIds).toEqual(['rootless']);
  });

  it('nulls a preview whose blob is gone', () => {
    const report = repairCatalog(healthy(), new Set(['i1', 'i2', 'ref1']));
    expect(report.changed).toBe(true);
    expect(report.droppedImageIds).toEqual([]);
    expect(previewOf(report.catalog, 'c1')).toBeNull();
  });

  it('nulls a reference photo whose blob is gone', () => {
    const report = repairCatalog(healthy(), new Set(['i1', 'i2', 'pv1']));
    expect(report.changed).toBe(true);
    expect(report.catalog.levels[0].values[0].referenceImageId).toBeNull();
    expect(imageIds(report.catalog)).toEqual(['i1', 'i2']);
  });

  it('clears a preview whose image was dropped structurally even though its blob survives', () => {
    const base = healthy();
    const broken = withPreview(
      { ...base, images: [base.images[0], img('i2', 'c1', ['a1', 'ghost'])] },
      'c1',
      'i2',
    );
    const report = repairCatalog(broken, allBlobs);
    expect(report.changed).toBe(true);
    expect(report.droppedImageIds).toEqual(['i2']);
    expect(previewOf(report.catalog, 'c1')).toBeNull();
  });
});

describe('referencedBlobIds', () => {
  it('covers image ids, preview ids and reference photos', () => {
    const catalog = withPreview(fixture(), 'c1', 'pv1');
    expect(referencedBlobIds(catalog)).toEqual(
      new Set(['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'pv1', 'refA1', 'refB1']),
    );
  });

  it('is empty for an empty catalog', () => {
    expect(referencedBlobIds(emptyCatalog())).toEqual(new Set());
  });
});

/* --------------------------------------------------------------------- tree */

describe('buildTreeRows', () => {
  it('renders one row per level-0 value plus a single add row when collapsed', () => {
    const rows = buildTreeRows(fixture(), 'c1', { expanded: new Set() });
    expect(rows.map((r) => r.kind)).toEqual(['node', 'node', 'add']);

    const [first] = nodeRows(rows);
    expect(first.key).toBe('c1>a1');
    expect(first.depth).toBe(0);
    expect(first.path).toEqual(['a1']);
    expect(first.valueName).toBe('قلب');
    expect(first.levelName).toBe('الشكل');
    expect(first.priceDelta).toBe(10);
    expect(first.imageId).toBe('i1');
    expect(first.fill).toBe(3);
    expect(first.total).toBe(3);
    expect(first.hasChildren).toBe(true);
    expect(first.expanded).toBe(false);
  });

  it('inserts an expanded node children immediately after it at depth + 1', () => {
    const rows = buildTreeRows(fixture(), 'c1', { expanded: new Set(['c1>a1']) });
    expect(rows.map((r) => r.key)).toEqual([
      'c1>a1',
      'c1>a1>b1',
      'c1>a1>b2',
      'add:c1>a1',
      'c1>a2',
      'add:c1',
    ]);

    const children = nodeRows(rows).filter((r) => r.depth === 1);
    expect(children.map((r) => r.path)).toEqual([
      ['a1', 'b1'],
      ['a1', 'b2'],
    ]);
    expect(children.map((r) => r.imageId)).toEqual(['i2', 'i3']);
    expect(children.every((r) => r.hasChildren === false)).toBe(true);
    expect(children.every((r) => r.total === 1)).toBe(true);
    expect(nodeRows(rows)[0].expanded).toBe(true);
  });

  it('missingOnly hides fully covered subtrees and every add row', () => {
    const rows = buildTreeRows(fixture(), 'c1', {
      expanded: new Set(['c1>a1', 'c1>a2']),
      missingOnly: true,
    });
    expect(rows.every((r) => r.kind === 'node')).toBe(true);
    expect(rows.map((r) => r.key)).toEqual(['c1>a2', 'c1>a2>b2']);
  });

  it('returns nothing when there are no levels', () => {
    expect(buildTreeRows(catalogOf({ cakes: [cake('c1')] }), 'c1', { expanded: new Set() })).toEqual(
      [],
    );
  });
});

describe('isValidNodePath', () => {
  const catalog = fixture();

  it('rejects an unknown cake', () => {
    expect(isValidNodePath(catalog, 'ghost', ['a1'])).toBe(false);
  });

  it('rejects an empty path', () => {
    expect(isValidNodePath(catalog, 'c1', [])).toBe(false);
  });

  it('rejects a path deeper than the level list', () => {
    expect(isValidNodePath(catalog, 'c1', ['a1', 'b1', 'x'])).toBe(false);
  });

  it('rejects a value that does not belong to its depth', () => {
    expect(isValidNodePath(catalog, 'c1', ['b1'])).toBe(false);
    expect(isValidNodePath(catalog, 'c1', ['a1', 'a2'])).toBe(false);
  });

  it('accepts full and partial valid paths', () => {
    expect(isValidNodePath(catalog, 'c1', ['a1'])).toBe(true);
    expect(isValidNodePath(catalog, 'c1', ['a1', 'b2'])).toBe(true);
  });
});

/* ------------------------------------------------------------------ pricing */

describe('pathPriceDelta / cakePriceForPath', () => {
  const catalog = fixture();

  it('sums the deltas of every picked value on top of the base price', () => {
    expect(pathPriceDelta(catalog.levels, ['a1', 'b1'])).toBe(15);
    expect(cakePriceForPath(catalog, 'c1', ['a1', 'b1'])).toBe(115);
    expect(cakePriceForPath(catalog, 'c2', ['a1', 'b2'])).toBe(207);
  });

  it('a partial path sums only the levels already picked', () => {
    expect(pathPriceDelta(catalog.levels, ['a1'])).toBe(10);
    expect(cakePriceForPath(catalog, 'c1', ['a1'])).toBe(110);
    expect(cakePriceForPath(catalog, 'c1', [])).toBe(100);
  });

  it('an unknown value contributes zero and never NaN', () => {
    const price = cakePriceForPath(catalog, 'c1', ['ghost', 'b1']);
    expect(price).toBe(105);
    expect(Number.isNaN(price)).toBe(false);
    expect(pathPriceDelta(catalog.levels, ['a1', 'b1', 'deeper'])).toBe(15);
  });

  it('an unknown cake prices at zero', () => {
    expect(cakePriceForPath(catalog, 'ghost', ['a1'])).toBe(0);
  });
});

/* ------------------------------------------------------------------ ids/keys */

describe('nodeKey / parseNodeKey / imageStorageKey', () => {
  it('round-trips a node key', () => {
    const key = nodeKey('c1', ['a1', 'b1']);
    expect(key).toBe('c1>a1>b1');
    expect(parseNodeKey(key)).toEqual({ cakeId: 'c1', path: ['a1', 'b1'] });
  });

  it('round-trips the cake-root key', () => {
    expect(nodeKey('c1', [])).toBe('c1');
    expect(parseNodeKey('c1')).toEqual({ cakeId: 'c1', path: [] });
  });

  it('builds a traceable storage key', () => {
    expect(imageStorageKey('c1', ['a1', 'b1'])).toBe('cake-c1--a1--b1');
    expect(imageStorageKey('c1', [])).toBe('cake-c1');
  });
});
