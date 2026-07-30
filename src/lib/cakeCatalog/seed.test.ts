import { describe, it, expect } from 'vitest';
import { buildSeedCatalog } from './seed';
import { findDuplicateValueName, perCakeTotal, repairCatalog } from './catalog';
import { SCHEMA_VERSION } from './types';

/** Deterministic id factory — the seed must never depend on `newId()` randomness. */
const idFactory = (prefix = 'id') => {
  let n = 0;
  return () => `${prefix}-${n++}`;
};

const FIXED_NOW = 1_700_000_000_000;

const seed = () => buildSeedCatalog(idFactory(), FIXED_NOW);

describe('buildSeedCatalog structure', () => {
  it('builds 4 levels of 3 named, priced values', () => {
    const { catalog } = seed();

    expect(catalog.schemaVersion).toBe(SCHEMA_VERSION);
    expect(catalog.levels).toHaveLength(4);
    for (const level of catalog.levels) {
      expect(level.id).toBeTruthy();
      expect(level.name.trim()).not.toBe('');
      expect(level.values).toHaveLength(3);
      for (const value of level.values) {
        expect(value.id).toBeTruthy();
        expect(value.name.trim()).not.toBe('');
        expect(Number.isFinite(value.priceDelta)).toBe(true);
        expect(value.referenceImageId).toBeNull();
      }
    }
  });

  it('has no duplicate value names inside any level', () => {
    const { catalog } = seed();
    for (const level of catalog.levels) {
      for (const value of level.values) {
        expect(findDuplicateValueName(level, value.name, value.id)).toBe(false);
      }
    }
  });

  it('gives every cake a numeric base price and reassurance copy', () => {
    const { catalog } = seed();
    expect(catalog.cakes).toHaveLength(3);
    for (const cake of catalog.cakes) {
      expect(cake.id).toBeTruthy();
      expect(cake.name.trim()).not.toBe('');
      expect(Number.isFinite(cake.basePrice)).toBe(true);
      expect(cake.basePrice).toBeGreaterThan(0);
      expect(cake.serves.trim()).not.toBe('');
      expect(cake.leadTime.trim()).not.toBe('');
      expect(cake.createdAt).toBeLessThanOrEqual(FIXED_NOW);
    }
  });

  it('mints a unique id for every level, value, cake and image', () => {
    const { catalog } = seed();
    const ids = [
      ...catalog.levels.map((l) => l.id),
      ...catalog.levels.flatMap((l) => l.values.map((v) => v.id)),
      ...catalog.cakes.map((c) => c.id),
      ...catalog.images.map((i) => i.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is deterministic given the same id factory and clock', () => {
    expect(buildSeedCatalog(idFactory(), FIXED_NOW)).toEqual(
      buildSeedCatalog(idFactory(), FIXED_NOW),
    );
  });
});

describe('buildSeedCatalog coverage states', () => {
  it('ships one fully covered cake, one partial cake and one without a preview', () => {
    const { catalog } = seed();
    const total = perCakeTotal(catalog.levels);
    expect(total).toBe(120);

    const counts = catalog.cakes.map(
      (cake) => catalog.images.filter((img) => img.cakeId === cake.id).length,
    );
    const [full, partial, shallow] = counts;

    expect(full).toBe(total);
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(total);
    expect(shallow).toBeGreaterThan(0);
    expect(shallow).toBeLessThan(partial);

    expect(catalog.cakes.filter((c) => c.previewImageId === null)).toHaveLength(1);
    for (const cake of catalog.cakes) {
      if (!cake.previewImageId) continue;
      // A preview reuses a top-level variant photo rather than minting a blob.
      const preview = catalog.images.find((i) => i.id === cake.previewImageId);
      expect(preview?.cakeId).toBe(cake.id);
      expect(preview?.path).toHaveLength(1);
    }
  });

  it('keeps every image path inside the level structure', () => {
    const { catalog } = seed();
    for (const image of catalog.images) {
      expect(catalog.cakes.some((c) => c.id === image.cakeId)).toBe(true);
      expect(image.path.length).toBeGreaterThanOrEqual(1);
      expect(image.path.length).toBeLessThanOrEqual(catalog.levels.length);
      image.path.forEach((valueId, depth) => {
        expect(catalog.levels[depth].values.some((v) => v.id === valueId)).toBe(true);
      });
    }
  });

  it('is self-consistent — repairCatalog finds nothing to fix', () => {
    const { catalog, imagePlan } = seed();
    const report = repairCatalog(catalog, new Set(imagePlan.map((p) => p.imageId)));
    expect(report.changed).toBe(false);
    expect(report.droppedImageIds).toEqual([]);
  });
});

describe('buildSeedCatalog image plan', () => {
  it('plans exactly one placeholder per image, in the same order', () => {
    const { catalog, imagePlan } = seed();
    expect(imagePlan).toHaveLength(catalog.images.length);
    expect(imagePlan.map((p) => p.imageId)).toEqual(catalog.images.map((i) => i.id));
    expect(new Set(imagePlan.map((p) => p.imageId)).size).toBe(imagePlan.length);
  });

  it('gives every placeholder a label, a breadcrumb caption and a tint', () => {
    const { catalog, imagePlan } = seed();
    const byId = new Map(catalog.images.map((i) => [i.id, i]));

    for (const plan of imagePlan) {
      expect(plan.label.trim()).not.toBe('');
      expect(plan.caption.trim()).not.toBe('');
      expect(plan.tint).toMatch(/^#[0-9a-f]{6}$/i);
      // Caption is «اسم الكيكة · قيمة · قيمة …» — one segment per path step, plus the cake.
      expect(plan.caption.split(' · ')).toHaveLength((byId.get(plan.imageId)?.path.length ?? 0) + 1);
    }
  });

  it('labels each placeholder with the deepest value on its path', () => {
    const { catalog, imagePlan } = seed();
    const nameOf = (depth: number, valueId: string) =>
      catalog.levels[depth].values.find((v) => v.id === valueId)?.name;

    imagePlan.forEach((plan, index) => {
      const image = catalog.images[index];
      expect(plan.label).toBe(nameOf(image.path.length - 1, image.path[image.path.length - 1]));
    });
  });
});
