/**
 * Cake catalog — the first-run demo catalog.
 *
 * Pure: it returns metadata plus a *plan* of placeholder images to render, so
 * the whole seed is unit-testable without a canvas. The store renders the plan
 * and writes every blob in one transaction.
 *
 * Deliberately small — 4 levels × 3 values = 120 nodes per cake (3 + 9 + 27 +
 * 81). Adding a fourth value to each level would make it 340, at which point
 * "fully covered" stops being achievable for a real bakery.
 */

import { newId } from './catalog';
import { SCHEMA_VERSION, type Catalog, type CatalogImage, type CatalogLevel } from './types';

/** One placeholder to draw: the store turns each of these into a JPEG blob. */
export interface PlaceholderPlan {
  imageId: string;
  /** Big centred word — the value this node represents. */
  label: string;
  /** Small breadcrumb caption, e.g. «قلب حلو · قلب · شوكولاتة». */
  caption: string;
  tint: string;
}

export interface SeedResult {
  catalog: Catalog;
  imagePlan: PlaceholderPlan[];
}

interface SeedValue {
  name: string;
  priceDelta: number;
  tint: string;
}

const SEED_LEVELS: { name: string; values: SeedValue[] }[] = [
  {
    name: 'الشكل',
    values: [
      { name: 'قلب', priceDelta: 10, tint: '#eed3da' },
      { name: 'دائرية', priceDelta: 0, tint: '#e6ddcd' },
      { name: 'مربعة', priceDelta: 5, tint: '#d5dee4' },
    ],
  },
  {
    name: 'النكهة',
    values: [
      { name: 'شوكولاتة', priceDelta: 15, tint: '#e2cfb9' },
      { name: 'فانيليا', priceDelta: 0, tint: '#f2e8d2' },
      { name: 'ريد فيلفِت', priceDelta: 20, tint: '#ecc9cd' },
    ],
  },
  {
    name: 'لون الكريمة',
    values: [
      { name: 'وردي', priceDelta: 0, tint: '#f3d9e2' },
      { name: 'أبيض', priceDelta: 0, tint: '#f4f1ea' },
      { name: 'أزرق', priceDelta: 0, tint: '#d8e2ea' },
    ],
  },
  {
    name: 'الإضافات',
    values: [
      { name: 'فراولة', priceDelta: 28, tint: '#f0cdd2' },
      { name: 'رشّات ملوّنة', priceDelta: 12, tint: '#e9dcef' },
      { name: 'رقائق شوكولاتة', priceDelta: 18, tint: '#ddccbe' },
    ],
  },
];

/**
 * `maxDepth` is what makes each cake demo a different state: fully covered,
 * partially covered, and "no preview chosen yet".
 */
const SEED_CAKES: {
  name: string;
  basePrice: number;
  serves: string;
  leadTime: string;
  maxDepth: number;
  withPreview: boolean;
  ageMinutes: number;
}[] = [
  { name: 'احتفال كلاسيكي', basePrice: 85, serves: '6–8', leadTime: '24 ساعة', maxDepth: 4, withPreview: true, ageMinutes: 180 },
  { name: 'قلب حلو', basePrice: 60, serves: '2–3', leadTime: '24 ساعة', maxDepth: 2, withPreview: true, ageMinutes: 120 },
  { name: 'زفاف ملكي', basePrice: 320, serves: '20–25', leadTime: '48 ساعة', maxDepth: 1, withPreview: false, ageMinutes: 60 },
];

export function buildSeedCatalog(makeId: () => string = newId, now: number = Date.now()): SeedResult {
  const levels: CatalogLevel[] = SEED_LEVELS.map((level) => ({
    id: makeId(),
    name: level.name,
    values: level.values.map((value) => ({
      id: makeId(),
      name: value.name,
      priceDelta: value.priceDelta,
      referenceImageId: null,
    })),
  }));

  const catalog: Catalog = { schemaVersion: SCHEMA_VERSION, levels, cakes: [], images: [] };
  const imagePlan: PlaceholderPlan[] = [];
  let stamp = now;

  for (const seed of SEED_CAKES) {
    const cakeId = makeId();
    const cakeImages: CatalogImage[] = [];

    // Eagerly enumerate every node down to maxDepth: 3 + 9 + 27 + 81 for a full cake.
    const walk = (depth: number, path: string[], names: string[]) => {
      if (depth >= seed.maxDepth) return;
      // `levels[depth].values` is index-aligned with SEED_LEVELS[depth].values.
      levels[depth].values.forEach((value, valueIndex) => {
        const nextPath = [...path, value.id];
        const nextNames = [...names, value.name];
        const imageId = makeId();
        // Walk timestamps backwards so the library ordering looks organic.
        stamp -= 60_000;
        cakeImages.push({
          id: imageId,
          cakeId,
          path: nextPath,
          fileName: 'placeholder.svg',
          width: 480,
          height: 360,
          size: 0,
          createdAt: stamp,
        });
        imagePlan.push({
          imageId,
          label: value.name,
          caption: [seed.name, ...nextNames].join(' · '),
          tint: SEED_LEVELS[depth].values[valueIndex].tint,
        });
        walk(depth + 1, nextPath, nextNames);
      });
    };
    walk(0, [], []);

    catalog.cakes.push({
      id: cakeId,
      name: seed.name,
      basePrice: seed.basePrice,
      serves: seed.serves,
      leadTime: seed.leadTime,
      // Reuse a top-level variant photo rather than minting an extra blob.
      previewImageId: seed.withPreview
        ? cakeImages.find((i) => i.path.length === 1)?.id ?? null
        : null,
      createdAt: now - seed.ageMinutes * 60_000,
    });
    catalog.images.push(...cakeImages);
  }

  return { catalog, imagePlan };
}
