import { describe, it, expect } from 'vitest';
import { priceStudio } from '../cakePricing';
import { ADDONS, PHOTO_PRINT_PRICE } from '../cakeStudio';
import type { CatalogCake, CatalogLevel } from '../cakeCatalog/types';

const levels: CatalogLevel[] = [
  {
    id: 'lv-shape',
    name: 'الشكل',
    values: [
      { id: 'heart', name: 'قلب', priceDelta: 10, referenceImageId: null },
      { id: 'round', name: 'دائري', priceDelta: 0, referenceImageId: null },
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
];

const cake: CatalogCake = {
  id: 'straw',
  name: 'كيكة الفراولة',
  basePrice: 120,
  serves: '6–8',
  leadTime: '24 ساعة',
  previewImageId: 'img-prev',
  createdAt: 1,
};

const ADDONS_TOTAL = ADDONS.reduce((sum, a) => sum + a.add, 0);
const ALL_ADDONS = Object.fromEntries(ADDONS.map((a) => [a.id, true]));

interface Scenario {
  name: string;
  input: {
    cake: CatalogCake | null;
    levels: readonly CatalogLevel[];
    path: readonly string[];
    addons: Record<string, boolean>;
    hasPhoto: boolean;
  };
}

const scenarios: Scenario[] = [
  { name: 'base only', input: { cake, levels, path: [], addons: {}, hasPhoto: false } },
  { name: 'partial path', input: { cake, levels, path: ['heart', 'choco'], addons: {}, hasPhoto: false } },
  { name: 'unknown value id', input: { cake, levels, path: ['heart', 'ghost'], addons: {}, hasPhoto: false } },
  { name: 'zero-delta picks', input: { cake, levels, path: ['round', 'vanilla'], addons: {}, hasPhoto: false } },
  { name: 'addons', input: { cake, levels, path: [], addons: ALL_ADDONS, hasPhoto: false } },
  { name: 'photo', input: { cake, levels, path: [], addons: {}, hasPhoto: true } },
  { name: 'everything', input: { cake, levels, path: ['heart', 'choco'], addons: ALL_ADDONS, hasPhoto: true } },
  { name: 'null cake', input: { cake: null, levels, path: [], addons: {}, hasPhoto: false } },
];

describe('priceStudio', () => {
  it('charges the base alone with no picks, addons or photo', () => {
    const r = priceStudio(scenarios[0].input);
    expect(r).toMatchObject({ base: 120, options: 0, addons: 0, photo: 0, total: 120 });
    expect(r.lines).toEqual([{ key: 'base', label: 'كيكة الفراولة', amount: 120 }]);
  });

  it('sums only the picked levels of a partial path', () => {
    const r = priceStudio(scenarios[1].input);
    expect(r.options).toBe(25);
    expect(r.total).toBe(145);
  });

  it('an unknown value id contributes 0 and never NaN', () => {
    const r = priceStudio(scenarios[2].input);
    expect(r.options).toBe(10);
    expect(r.total).toBe(130);
    expect(Number.isNaN(r.total)).toBe(false);
    expect(r.lines.some((l) => l.key === 'option:ghost')).toBe(false);
  });

  it('addons add the ADDONS entries as lines', () => {
    const r = priceStudio(scenarios[4].input);
    expect(r.addons).toBe(ADDONS_TOTAL);
    expect(r.total).toBe(120 + ADDONS_TOTAL);
    for (const addon of ADDONS) {
      expect(r.lines).toContainEqual({ key: `addon:${addon.id}`, label: addon.name, amount: addon.add });
    }
  });

  it('an attached photo adds PHOTO_PRINT_PRICE', () => {
    const r = priceStudio(scenarios[5].input);
    expect(r.photo).toBe(PHOTO_PRINT_PRICE);
    expect(r.total).toBe(120 + PHOTO_PRINT_PRICE);
    expect(r.lines.some((l) => l.key === 'photo' && l.amount === PHOTO_PRINT_PRICE)).toBe(true);
  });

  it('a null cake prices to 0 with no lines', () => {
    const r = priceStudio(scenarios[7].input);
    expect(r.total).toBe(0);
    expect(r.lines).toEqual([]);
  });

  it('sum(lines.amount) === total in every scenario', () => {
    for (const scenario of scenarios) {
      const r = priceStudio(scenario.input);
      const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
      expect(sum, scenario.name).toBe(r.total);
    }
  });

  it('lines never contain zero-delta option rows', () => {
    for (const scenario of scenarios) {
      const r = priceStudio(scenario.input);
      expect(
        r.lines.filter((l) => l.key.startsWith('option:') && l.amount === 0),
        scenario.name,
      ).toEqual([]);
    }
    // The dedicated zero-delta scenario prices as base-only.
    const zero = priceStudio(scenarios[3].input);
    expect(zero.options).toBe(0);
    expect(zero.lines.map((l) => l.key)).toEqual(['base']);
  });
});
