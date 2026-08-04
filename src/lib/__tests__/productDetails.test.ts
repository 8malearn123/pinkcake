import { describe, it, expect } from 'vitest';
import { discountPercent, savingsAmount, ratingDistribution, pickRelated, rowGridClass } from '@/lib/productDetails';
import type { StoreProduct } from '@/hooks/useCustomerStore';

const product = (id: string, over: Partial<StoreProduct> = {}): StoreProduct => ({
  id,
  name: id,
  description: null,
  price: 100,
  category: 'كيكات',
  image_url: null,
  ...over,
});

describe('discountPercent / savingsAmount', () => {
  it('reports a real discount', () => {
    expect(discountPercent(145, 175)).toBe(17);
    expect(savingsAmount(145, 175)).toBe(30);
  });

  it('stays at zero without a compare-at price', () => {
    expect(discountPercent(145, null)).toBe(0);
    expect(savingsAmount(145, undefined)).toBe(0);
  });

  it('never invents a discount from a lower or equal compare-at price', () => {
    expect(discountPercent(145, 145)).toBe(0);
    expect(discountPercent(145, 120)).toBe(0);
    expect(savingsAmount(145, 120)).toBe(0);
  });
});

describe('ratingDistribution', () => {
  it('buckets 5 → 1 with shares that cover every review', () => {
    const dist = ratingDistribution([{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 1 }]);
    expect(dist.map((b) => b.stars)).toEqual([5, 4, 3, 2, 1]);
    expect(dist.map((b) => b.count)).toEqual([2, 1, 0, 0, 1]);
    expect(dist[0].pct).toBe(50);
    expect(dist.reduce((s, b) => s + b.count, 0)).toBe(4);
  });

  it('clamps out-of-range ratings instead of dropping them', () => {
    const dist = ratingDistribution([{ rating: 9 }, { rating: 0 }, { rating: 4.6 }]);
    expect(dist.reduce((s, b) => s + b.count, 0)).toBe(3);
    expect(dist.find((b) => b.stars === 5)?.count).toBe(2); // 9 clamped, 4.6 rounded
    expect(dist.find((b) => b.stars === 1)?.count).toBe(1);
  });

  it('returns zeroed buckets for no reviews', () => {
    expect(ratingDistribution([]).every((b) => b.count === 0 && b.pct === 0)).toBe(true);
  });
});

describe('pickRelated', () => {
  const never = () => false;
  const catalogue = [
    product('a', { category: 'كيكات' }),
    product('b', { category: 'حلويات' }),
    product('c', { category: 'كيكات' }),
    product('d', { category: 'كب كيك' }),
    product('e', { category: 'حلويات' }),
  ];

  it('excludes the current product', () => {
    expect(pickRelated(catalogue, 'a', 'كيكات', never).map((p) => p.id)).not.toContain('a');
  });

  it('leads with the same category, then fills the row from the rest', () => {
    const picks = pickRelated(catalogue, 'a', 'كيكات', never, 4);
    expect(picks[0].id).toBe('c');
    // A thin category must still fill four slots — that hole is what used to
    // leave empty columns in the "you may also like" grid.
    expect(picks).toHaveLength(4);
  });

  it('sinks sold-out products below available ones', () => {
    const soldOut = (p: StoreProduct) => p.id === 'c';
    const picks = pickRelated(catalogue, 'a', 'كيكات', soldOut, 4);
    expect(picks.map((p) => p.id).indexOf('c')).toBeGreaterThan(0);
  });

  it('tolerates a missing catalogue', () => {
    expect(pickRelated(undefined, 'a', 'كيكات', never)).toEqual([]);
  });
});

describe('rowGridClass', () => {
  it('never asks for more columns than there are cards', () => {
    expect(rowGridClass(1)).toContain('grid-cols-1');
    expect(rowGridClass(2)).toContain('grid-cols-2');
    expect(rowGridClass(2)).not.toContain('grid-cols-4');
    expect(rowGridClass(3)).toContain('lg:grid-cols-3');
    expect(rowGridClass(4)).toContain('lg:grid-cols-4');
  });
});
