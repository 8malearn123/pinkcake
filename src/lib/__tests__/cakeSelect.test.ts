import { describe, it, expect } from 'vitest';
import {
  applyPick,
  availableValues,
  contiguousPath,
  deepestMatch,
  galleryCakes,
  imagesByNodeKey,
  pathLabels,
  seedPicks,
  stageCaption,
} from '../cakeSelect';
import type { Catalog, CatalogCake, CatalogImage, CatalogLevel } from '../cakeCatalog/types';

/* ------------------------------------------------------------------ fixtures */

const levels: CatalogLevel[] = [
  {
    id: 'lv-shape',
    name: 'الشكل',
    values: [
      { id: 'heart', name: 'قلب', priceDelta: 10, referenceImageId: null },
      { id: 'round', name: 'دائري', priceDelta: 0, referenceImageId: 'ref-round' },
    ],
  },
  {
    id: 'lv-flavor',
    name: 'النكهة',
    values: [
      { id: 'choco', name: 'شوكولاتة', priceDelta: 15, referenceImageId: null },
      { id: 'vanilla', name: 'فانيليا', priceDelta: 0, referenceImageId: null },
    ],
  },
  {
    id: 'lv-color',
    name: 'لون الكريمة',
    values: [{ id: 'pink', name: 'وردي', priceDelta: 5, referenceImageId: null }],
  },
];

const mkCake = (id: string, name: string, previewImageId: string | null): CatalogCake => ({
  id,
  name,
  basePrice: 120,
  serves: '6–8',
  leadTime: '24 ساعة',
  previewImageId,
  createdAt: 1,
});

const bareCake = mkCake('bare', 'كيكة بلا صورة', null);
const deadPreviewCake = mkCake('dead', 'كيكة معاينة ميتة', 'img-dead');
const poCake = mkCake('po', 'كيكة معاينة فقط', 'img-po');
const goodCake = mkCake('good', 'كيكة الفراولة', 'img-good-prev');

const mkImg = (id: string, cakeId: string, path: string[]): CatalogImage => ({
  id,
  cakeId,
  path,
  fileName: `${id}.jpg`,
  width: 800,
  height: 600,
  size: 1000,
  createdAt: 1,
});

const images: CatalogImage[] = [
  mkImg('img-good-h', 'good', ['heart']),
  mkImg('img-good-r', 'good', ['round']),
  mkImg('img-good-hc', 'good', ['heart', 'choco']),
  mkImg('img-good-hv', 'good', ['heart', 'vanilla']), // row exists, blob url missing
  mkImg('img-good-rc', 'good', ['round', 'choco']),
  mkImg('img-good-hcp', 'good', ['heart', 'choco', 'pink']),
  mkImg('img-po-h', 'po', ['heart']), // row exists, blob url missing
  mkImg('img-po-deep', 'po', ['heart', 'choco']),
];

const catalog: Catalog = {
  schemaVersion: 1,
  levels,
  cakes: [bareCake, deadPreviewCake, poCake, goodCake],
  images,
};

const byKey = imagesByNodeKey(images);

const URLS: Record<string, string> = {
  'ref-round': 'blob:ref-round',
  'img-good-prev': 'blob:good-prev',
  'img-good-h': 'blob:good-h',
  'img-good-r': 'blob:good-r',
  'img-good-hc': 'blob:good-hc',
  'img-good-rc': 'blob:good-rc',
  'img-good-hcp': 'blob:good-hcp',
  'img-po': 'blob:po-prev',
  'img-po-deep': 'blob:po-deep',
  // absent on purpose: img-dead, img-good-hv, img-po-h
};

const urlOver =
  (urls: Record<string, string>) =>
  (imageId: string | null | undefined): string | undefined =>
    imageId ? urls[imageId] : undefined;

const urlFor = urlOver(URLS);

const without = (...ids: string[]) => {
  const next = { ...URLS };
  for (const id of ids) delete next[id];
  return urlOver(next);
};

/* --------------------------------------------------------------------- picks */

describe('contiguousPath', () => {
  it('all-null picks yield an empty path', () => {
    expect(contiguousPath([null, null, null])).toEqual([]);
  });

  it('a gap stops the path even when deeper picks exist', () => {
    expect(contiguousPath(['heart', null, 'pink'])).toEqual(['heart']);
  });

  it('full picks yield the full path', () => {
    expect(contiguousPath(['heart', 'choco', 'pink'])).toEqual(['heart', 'choco', 'pink']);
  });
});

describe('applyPick', () => {
  it('re-picking the current value is a no-op that keeps deeper picks', () => {
    const next = applyPick(['heart', 'choco', 'pink'], 1, 'choco');
    expect(next).toEqual(['heart', 'choco', 'pink']);
    expect(next).not.toBe(['heart', 'choco', 'pink']);
  });

  it('a new value at depth 1 nulls indices ≥ 2', () => {
    expect(applyPick(['heart', 'choco', 'pink'], 1, 'vanilla')).toEqual(['heart', 'vanilla', null]);
  });

  it('a pick at depth 0 nulls everything after', () => {
    expect(applyPick(['heart', 'choco', 'pink'], 0, 'round')).toEqual(['round', null, null]);
  });
});

describe('seedPicks', () => {
  it('pads a short path to levels.length', () => {
    expect(seedPicks(levels)).toEqual([null, null, null]);
    expect(seedPicks(levels, ['heart'])).toEqual(['heart', null, null]);
  });

  it('truncates a path longer than levels.length', () => {
    expect(seedPicks(levels, ['heart', 'choco', 'pink', 'extra'])).toEqual(['heart', 'choco', 'pink']);
  });
});

describe('pathLabels', () => {
  it('resolves labels positionally from levels[depth]', () => {
    expect(pathLabels(levels, ['heart', 'choco', 'pink'])).toEqual(['قلب', 'شوكولاتة', 'وردي']);
  });

  it('marks an unknown id with ؟ at its position', () => {
    expect(pathLabels(levels, ['heart', 'ghost'])).toEqual(['قلب', '؟']);
  });
});

/* ------------------------------------------------------------------- gallery */

describe('galleryCakes', () => {
  it('offers only cakes with a resolvable preview AND a photographed first step', () => {
    const result = galleryCakes(catalog, urlFor);
    // bare: no preview id; dead: preview blob gone; po: preview ok but its only
    // depth-1 photo has no url (a deeper photo does not rescue it).
    expect(result).toEqual([{ cake: goodCake, previewUrl: 'blob:good-prev' }]);
  });
});

/* ----------------------------------------------------------- availableValues */

describe('availableValues', () => {
  it('empty prefix offers level-0 values in level order, photo-backed only', () => {
    const result = availableValues(catalog, byKey, urlFor, 'good', []);
    expect(result.map((v) => v.id)).toEqual(['heart', 'round']);
    expect(result.map((v) => v.priceDelta)).toEqual([10, 0]);
  });

  it('thumbUrl prefers the value reference photo over the variant photo', () => {
    const result = availableValues(catalog, byKey, urlFor, 'good', []);
    expect(result.find((v) => v.id === 'heart')?.thumbUrl).toBe('blob:good-h');
    expect(result.find((v) => v.id === 'round')?.thumbUrl).toBe('blob:ref-round');
  });

  it('excludes a value whose image row exists but whose blob url is missing', () => {
    // good>heart>vanilla has a metadata row but no url.
    const result = availableValues(catalog, byKey, urlFor, 'good', ['heart']);
    expect(result.map((v) => v.id)).toEqual(['choco']);
  });

  it('excludes a value with no image row at all', () => {
    // good>round>vanilla has no row; good>round>choco does.
    const result = availableValues(catalog, byKey, urlFor, 'good', ['round']);
    expect(result.map((v) => v.id)).toEqual(['choco']);
  });

  it('returns [] for a prefix at or beyond levels.length', () => {
    expect(availableValues(catalog, byKey, urlFor, 'good', ['heart', 'choco', 'pink'])).toEqual([]);
  });
});

/* -------------------------------------------------------------- deepestMatch */

describe('deepestMatch', () => {
  it('a full-depth photo matches at depth === path.length', () => {
    expect(deepestMatch(catalog, byKey, urlFor, goodCake, ['heart', 'choco', 'pink'])).toEqual({
      url: 'blob:good-hcp',
      imageId: 'img-good-hcp',
      depth: 3,
    });
  });

  it('a missing deep row falls back to the depth-2 photo', () => {
    expect(deepestMatch(catalog, byKey, urlFor, goodCake, ['round', 'choco', 'pink'])).toEqual({
      url: 'blob:good-rc',
      imageId: 'img-good-rc',
      depth: 2,
    });
  });

  it('a row whose blob url is missing is skipped on the way down', () => {
    expect(
      deepestMatch(catalog, byKey, without('img-good-hcp'), goodCake, ['heart', 'choco', 'pink']),
    ).toEqual({ url: 'blob:good-hc', imageId: 'img-good-hc', depth: 2 });
  });

  it('with no variant photo it falls back to the cake preview at depth 0', () => {
    expect(deepestMatch(catalog, byKey, urlFor, poCake, ['heart'])).toEqual({
      url: 'blob:po-prev',
      imageId: 'img-po',
      depth: 0,
    });
  });

  it('with no preview either it reports depth -1', () => {
    expect(deepestMatch(catalog, byKey, urlFor, bareCake, ['heart'])).toEqual({
      url: null,
      imageId: null,
      depth: -1,
    });
  });
});

/* -------------------------------------------------------------- stageCaption */

describe('stageCaption', () => {
  const labels = ['قلب', 'شوكولاتة', 'وردي'];

  it('is null on an exact match and when nothing is shown', () => {
    expect(stageCaption(goodCake, labels, { url: 'x', imageId: 'y', depth: 3 })).toBeNull();
    expect(stageCaption(goodCake, labels, { url: null, imageId: null, depth: -1 })).toBeNull();
  });

  it('names the cake alone at depth 0', () => {
    expect(stageCaption(goodCake, labels, { url: 'x', imageId: 'y', depth: 0 })).toBe('كيكة الفراولة');
  });

  it('names the cake plus the first covered labels at a partial depth', () => {
    expect(stageCaption(goodCake, labels, { url: 'x', imageId: 'y', depth: 2 })).toBe(
      'كيكة الفراولة · قلب · شوكولاتة',
    );
  });
});
