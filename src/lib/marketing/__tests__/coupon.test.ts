import { describe, it, expect } from 'vitest';
import {
  MAX_PERCENT,
  couponDiscount,
  couponState,
  couponSummary,
  evaluateCoupon,
  isValidCodeShape,
  normalizeCode,
  scopeMatches,
  validateDraft,
} from '../coupon';
import type { Coupon, CouponContext, CouponDraft } from '../types';

const NOW = new Date('2026-08-17T09:00:00Z');

function coupon(partial: Partial<Coupon> = {}): Coupon {
  return {
    id: 'c1',
    code: 'TEST20',
    kind: 'percent',
    value: 20,
    maxDiscount: null,
    minOrder: 0,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    perCustomerLimit: null,
    firstOrderOnly: false,
    scope: 'all',
    scopeValues: [],
    stackableWithLoyalty: false,
    isActive: true,
    note: '',
    createdAt: 0,
    redemptions: 0,
    discountGiven: 0,
    revenue: 0,
    ...partial,
  };
}

function ctx(partial: Partial<CouponContext> = {}): CouponContext {
  return {
    subtotal: 200,
    categories: ['كيكات'],
    productIds: ['p1'],
    isFirstOrder: true,
    customerRedemptions: 0,
    now: NOW,
    ...partial,
  };
}

describe('normalizeCode', () => {
  it('trims, upper-cases, and folds Arabic-Indic digits', () => {
    // العميلة تنسخ الرمز من رسالة قد تحمل أرقاماً عربية-هندية.
    expect(normalizeCode('  cake١٥ ')).toBe('CAKE15');
    expect(normalizeCode(null)).toBe('');
  });

  it('accepts only sane code shapes', () => {
    expect(isValidCodeShape('CAKE15')).toBe(true);
    expect(isValidCodeShape('AB')).toBe(false);
    expect(isValidCodeShape('حسم15')).toBe(false);
    expect(isValidCodeShape('-LEAD')).toBe(false);
  });
});

describe('couponDiscount', () => {
  it('applies a percentage', () => {
    expect(couponDiscount(coupon({ kind: 'percent', value: 15 }), 200)).toBe(30);
  });

  it('honours the cap', () => {
    expect(couponDiscount(coupon({ kind: 'percent', value: 20, maxDiscount: 30 }), 400)).toBe(30);
  });

  it('never exceeds the basket', () => {
    expect(couponDiscount(coupon({ kind: 'fixed', value: 500 }), 120)).toBe(120);
  });

  it('is zero for a free-delivery coupon — the fee is not a discount', () => {
    expect(couponDiscount(coupon({ kind: 'free_delivery', value: 0 }), 200)).toBe(0);
  });

  it('clamps a percentage above the ceiling', () => {
    expect(couponDiscount(coupon({ kind: 'percent', value: 500 }), 100)).toBe(MAX_PERCENT);
  });
});

describe('evaluateCoupon', () => {
  it('accepts a plain active coupon', () => {
    const outcome = evaluateCoupon(coupon(), ctx());
    expect(outcome.ok).toBe(true);
    expect(outcome.discount).toBe(40);
    expect(outcome.freeDelivery).toBe(false);
  });

  it('rejects an unknown code', () => {
    expect(evaluateCoupon(null, ctx()).ok).toBe(false);
    expect(evaluateCoupon(undefined, ctx()).message).toMatch(/غير صالح/);
  });

  it('rejects a paused coupon', () => {
    expect(evaluateCoupon(coupon({ isActive: false }), ctx()).message).toMatch(/موقوف/);
  });

  it('rejects before the start date and accepts on it', () => {
    expect(evaluateCoupon(coupon({ startsAt: '2026-09-01' }), ctx()).ok).toBe(false);
    expect(evaluateCoupon(coupon({ startsAt: '2026-08-17' }), ctx()).ok).toBe(true);
  });

  it('accepts on the last day and rejects after it', () => {
    // بالتاريخ لا باللحظة — وإلا انتهى العرض في صباح يومه الأخير.
    expect(evaluateCoupon(coupon({ endsAt: '2026-08-17' }), ctx()).ok).toBe(true);
    expect(evaluateCoupon(coupon({ endsAt: '2026-08-16' }), ctx()).message).toMatch(/انتهت/);
  });

  it('enforces the total usage limit', () => {
    const outcome = evaluateCoupon(coupon({ usageLimit: 5, redemptions: 5 }), ctx());
    expect(outcome.message).toMatch(/اكتمل/);
  });

  it('enforces the per-customer limit', () => {
    const outcome = evaluateCoupon(
      coupon({ perCustomerLimit: 1 }),
      ctx({ customerRedemptions: 1 }),
    );
    expect(outcome.message).toMatch(/من قبل/);
  });

  it('enforces first-order-only', () => {
    const outcome = evaluateCoupon(coupon({ firstOrderOnly: true }), ctx({ isFirstOrder: false }));
    expect(outcome.message).toMatch(/أوّل طلب/);
  });

  it('enforces the minimum order and names the figure', () => {
    const outcome = evaluateCoupon(coupon({ minOrder: 300 }), ctx({ subtotal: 200 }));
    expect(outcome.ok).toBe(false);
    expect(outcome.message).toContain('300');
  });

  it('rejects when the scope matches nothing in the basket', () => {
    const outcome = evaluateCoupon(
      coupon({ scope: 'category', scopeValues: ['ماكرون'] }),
      ctx({ categories: ['كيكات'] }),
    );
    expect(outcome.message).toMatch(/لا ينطبق/);
  });

  it('accepts when one basket line matches the scope', () => {
    const outcome = evaluateCoupon(
      coupon({ scope: 'product', scopeValues: ['p9', 'p1'] }),
      ctx({ productIds: ['p1', 'p2'] }),
    );
    expect(outcome.ok).toBe(true);
  });

  it('returns freeDelivery with a zero discount', () => {
    const outcome = evaluateCoupon(coupon({ kind: 'free_delivery', value: 0 }), ctx());
    expect(outcome.ok).toBe(true);
    expect(outcome.freeDelivery).toBe(true);
    expect(outcome.discount).toBe(0);
  });

  it('rejects a percentage coupon that rounds to nothing', () => {
    const outcome = evaluateCoupon(coupon({ kind: 'percent', value: 1 }), ctx({ subtotal: 0 }));
    expect(outcome.ok).toBe(false);
  });

  it('reports the first real reason, not the last', () => {
    // موقوف ومنتهٍ ودون الحد معاً — الرسالة الأنفع هي «موقوف».
    const outcome = evaluateCoupon(
      coupon({ isActive: false, endsAt: '2020-01-01', minOrder: 999 }),
      ctx(),
    );
    expect(outcome.message).toMatch(/موقوف/);
  });
});

describe('scopeMatches', () => {
  it('treats an empty value list as no narrowing', () => {
    expect(scopeMatches(coupon({ scope: 'category', scopeValues: [] }), ctx())).toBe(true);
  });
});

describe('couponState', () => {
  it('separates paused, scheduled, expired and exhausted from active', () => {
    expect(couponState(coupon(), NOW)).toBe('active');
    expect(couponState(coupon({ isActive: false }), NOW)).toBe('paused');
    expect(couponState(coupon({ startsAt: '2026-12-01' }), NOW)).toBe('scheduled');
    expect(couponState(coupon({ endsAt: '2026-01-01' }), NOW)).toBe('expired');
    expect(couponState(coupon({ usageLimit: 2, redemptions: 2 }), NOW)).toBe('exhausted');
  });

  it('reports expiry before exhaustion when both apply', () => {
    const row = coupon({ endsAt: '2026-01-01', usageLimit: 1, redemptions: 1 });
    expect(couponState(row, NOW)).toBe('expired');
  });
});

describe('couponSummary', () => {
  it('describes each kind in one line', () => {
    expect(couponSummary(coupon({ kind: 'percent', value: 15 }))).toBe('خصم 15٪');
    expect(couponSummary(coupon({ kind: 'percent', value: 15, maxDiscount: 40 }))).toBe(
      'خصم 15٪ حتى 40 ريال',
    );
    expect(couponSummary(coupon({ kind: 'fixed', value: 25 }))).toBe('خصم 25 ريال');
    expect(couponSummary(coupon({ kind: 'free_delivery', value: 0 }))).toBe('توصيل مجاني');
  });
});

describe('validateDraft', () => {
  const draft = (partial: Partial<CouponDraft> = {}): CouponDraft => ({
    code: 'NEW10',
    kind: 'percent',
    value: 10,
    maxDiscount: null,
    minOrder: 0,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    perCustomerLimit: null,
    firstOrderOnly: false,
    scope: 'all',
    scopeValues: [],
    stackableWithLoyalty: false,
    isActive: true,
    note: '',
    ...partial,
  });

  it('passes a sane draft', () => {
    expect(validateDraft(draft())).toBeNull();
  });

  it('rejects a duplicate code regardless of case', () => {
    expect(validateDraft(draft({ code: 'new10' }), ['NEW10'])).toMatch(/مستخدم/);
  });

  it('rejects an out-of-range percentage', () => {
    expect(validateDraft(draft({ value: 95 }))).toMatch(/بين/);
    expect(validateDraft(draft({ value: 0 }))).toMatch(/بين/);
  });

  it('rejects an end date before the start date', () => {
    expect(validateDraft(draft({ startsAt: '2026-09-10', endsAt: '2026-09-01' }))).toMatch(/قبل/);
  });

  it('requires values when the scope narrows', () => {
    expect(validateDraft(draft({ scope: 'category', scopeValues: [] }))).toMatch(/تصنيفاً/);
    expect(validateDraft(draft({ scope: 'product', scopeValues: [] }))).toMatch(/منتجاً/);
  });

  it('allows a zero-value free-delivery coupon', () => {
    expect(validateDraft(draft({ kind: 'free_delivery', value: 0 }))).toBeNull();
  });
});
