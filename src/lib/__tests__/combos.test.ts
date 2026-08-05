/**
 * resolveCombos — the bridge between what staff authored and what the shop shows.
 *
 * The money assertions matter most: the price on the card is derived, so a combo
 * whose members changed price must reprice rather than advertise a stale saving.
 * The rest guard the ways a combo is meant to disappear quietly (hidden, sold
 * out, gutted) — each of which the dashboard flags separately.
 */

import { describe, expect, it } from 'vitest';
import { priceCombo, resolvableMembers, resolveCombos } from '@/lib/combos';
import type { StoreProduct } from '@/hooks/useCustomerStore';
import type { ComboItem } from '@/lib/combosCatalog/types';

const product = (id: string, price: number, extra: Partial<StoreProduct> = {}): StoreProduct => ({
  id,
  name: `منتج ${id}`,
  description: null,
  price,
  category: 'كيكات',
  image_url: null,
  ...extra,
});

const combo = (overrides: Partial<ComboItem> = {}): ComboItem => ({
  id: 'c1',
  name: 'كومبو',
  tagline: 'وصف',
  items: ['p1', 'p2'],
  discountPct: 15,
  accent: '#9e3a5c',
  heroImageId: null,
  heroImageUrl: null,
  best: false,
  isActive: true,
  displayOrder: 0,
  createdAt: 0,
  ...overrides,
});

/** The storefront's real rule, mirrored so these tests don't import the hook. */
const isSoldOut = (p: StoreProduct) => p.is_available === false || p.stock === 0;
const noUrls = () => undefined;

const CATALOGUE = [product('p1', 100), product('p2', 100)];

describe('priceCombo', () => {
  it('derives price, saving and percentage from the members', () => {
    expect(priceCombo([{ price: 100 }, { price: 60 }], 15)).toEqual({
      original: 160,
      price: 136,
      save: 24,
      pct: 15,
    });
  });

  it('rounds to whole riyals', () => {
    // 145 × 0.85 = 123.25 → 123, so the saving is the honest 22.
    expect(priceCombo([{ price: 145 }], 15)).toEqual({
      original: 145,
      price: 123,
      save: 22,
      pct: 15,
    });
  });

  it('treats a zero discount as full price with no saving', () => {
    expect(priceCombo([{ price: 50 }, { price: 50 }], 0)).toEqual({
      original: 100,
      price: 100,
      save: 0,
      pct: 0,
    });
  });

  it('does not divide by zero when every member is free', () => {
    expect(priceCombo([{ price: 0 }, { price: 0 }], 20)).toEqual({
      original: 0,
      price: 0,
      save: 0,
      pct: 0,
    });
  });
});

describe('resolveCombos', () => {
  it('prices a combo from its members and its own discount', () => {
    const [resolved] = resolveCombos([combo({ discountPct: 25 })], CATALOGUE, isSoldOut, noUrls);

    expect(resolved.original).toBe(200);
    expect(resolved.price).toBe(150);
    expect(resolved.save).toBe(50);
    expect(resolved.pct).toBe(25);
  });

  it('gives each combo its own discount rather than a shared rate', () => {
    const resolved = resolveCombos(
      [
        combo({ id: 'a', discountPct: 10, displayOrder: 0 }),
        combo({ id: 'b', discountPct: 40, displayOrder: 1 }),
      ],
      CATALOGUE,
      isSoldOut,
      noUrls,
    );

    expect(resolved.map((c) => c.price)).toEqual([180, 120]);
  });

  it('reprices when a member product changes price', () => {
    const cheaper = [product('p1', 50), product('p2', 50)];

    const [resolved] = resolveCombos([combo({ discountPct: 20 })], cheaper, isSoldOut, noUrls);

    expect(resolved.original).toBe(100);
    expect(resolved.price).toBe(80);
  });

  it('skips hidden combos', () => {
    expect(resolveCombos([combo({ isActive: false })], CATALOGUE, isSoldOut, noUrls)).toEqual([]);
  });

  it('returns combos in display order regardless of array order', () => {
    const resolved = resolveCombos(
      [
        combo({ id: 'c', displayOrder: 2 }),
        combo({ id: 'a', displayOrder: 0 }),
        combo({ id: 'b', displayOrder: 1 }),
      ],
      CATALOGUE,
      isSoldOut,
      noUrls,
    );

    expect(resolved.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('drops sold-out members from the card', () => {
    const catalogue = [
      product('p1', 100),
      product('p2', 100),
      product('p3', 100, { stock: 0 }),
    ];

    const [resolved] = resolveCombos(
      [combo({ items: ['p1', 'p2', 'p3'] })],
      catalogue,
      isSoldOut,
      noUrls,
    );

    expect(resolved.members.map((m) => m.id)).toEqual(['p1', 'p2']);
    expect(resolved.original).toBe(200);
  });

  it('also drops members flagged unavailable', () => {
    const catalogue = [
      product('p1', 100),
      product('p2', 100),
      product('p3', 100, { is_available: false }),
    ];

    const [resolved] = resolveCombos(
      [combo({ items: ['p1', 'p2', 'p3'] })],
      catalogue,
      isSoldOut,
      noUrls,
    );

    expect(resolved.members).toHaveLength(2);
  });

  it('skips a combo left with fewer than two members', () => {
    const catalogue = [product('p1', 100), product('p2', 100, { stock: 0 })];

    expect(resolveCombos([combo()], catalogue, isSoldOut, noUrls)).toEqual([]);
  });

  it('skips a combo whose member ids are not in the catalogue at all', () => {
    // The seeded demo ids against a real (UUID) catalogue — the case the
    // dashboard flags as «لن يظهر في المتجر».
    expect(resolveCombos([combo()], [product('uuid-1', 100)], isSoldOut, noUrls)).toEqual([]);
  });

  it('handles an undefined catalogue while products are loading', () => {
    expect(resolveCombos([combo()], undefined, isSoldOut, noUrls)).toEqual([]);
  });

  it('prefers the uploaded hero over the pasted url', () => {
    const [resolved] = resolveCombos(
      [combo({ heroImageId: 'img-1', heroImageUrl: 'https://x/y.jpg' })],
      CATALOGUE,
      isSoldOut,
      (id) => (id === 'img-1' ? 'blob:live' : undefined),
    );

    expect(resolved.heroImage).toBe('blob:live');
  });

  it('falls back to the url when the blob has not hydrated', () => {
    const [resolved] = resolveCombos(
      [combo({ heroImageId: 'img-1', heroImageUrl: 'https://x/y.jpg' })],
      CATALOGUE,
      isSoldOut,
      noUrls,
    );

    expect(resolved.heroImage).toBe('https://x/y.jpg');
  });

  it('carries the members in the authored order', () => {
    const catalogue = [product('p1', 10), product('p2', 20), product('p3', 30)];

    const [resolved] = resolveCombos(
      [combo({ items: ['p3', 'p1', 'p2'] })],
      catalogue,
      isSoldOut,
      noUrls,
    );

    expect(resolved.members.map((m) => m.id)).toEqual(['p3', 'p1', 'p2']);
  });
});

describe('resolvableMembers', () => {
  it('counts members the catalogue still has', () => {
    expect(resolvableMembers(combo({ items: ['p1', 'p2', 'gone'] }), CATALOGUE)).toBe(2);
  });

  it('counts sold-out members — stock comes back, a deleted product does not', () => {
    const catalogue = [product('p1', 100), product('p2', 100, { stock: 0 })];

    expect(resolvableMembers(combo(), catalogue)).toBe(2);
  });

  it('is zero while the catalogue is still loading', () => {
    expect(resolvableMembers(combo(), undefined)).toBe(0);
  });
});
