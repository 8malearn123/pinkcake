import { describe, it, expect } from 'vitest';
import {
  daysInMonth,
  daysUntilLabel,
  normalizeMsisdn,
  occasionsToUnlock,
  pluralAr,
  stampProgress,
  type LoyaltySummary,
} from '../program';

describe('normalizeMsisdn', () => {
  it('accepts every shape staff and customers actually type', () => {
    const expected = '+966501234567';
    for (const input of [
      '0501234567',
      '501234567',
      '966501234567',
      '+966501234567',
      '00966501234567',
      '+966 50 123 4567',
      '(050) 123-4567',
      '050-123-4567',
    ]) {
      expect(normalizeMsisdn(input), input).toBe(expected);
    }
  });

  /**
   * الحالة التي تُنشئ عميلاً مكرّراً صامتاً: رقم مُلصق من واتساب بأرقام
   * عربية-هندية. لو فشلت هذه، انقسم رصيد الولاء بين حسابين.
   */
  it('folds Arabic-Indic and Eastern-Arabic digits to the same identity', () => {
    expect(normalizeMsisdn('٠٥٠١٢٣٤٥٦٧')).toBe('+966501234567');
    expect(normalizeMsisdn('۰۵۰۱۲۳۴۵۶۷')).toBe('+966501234567');
    expect(normalizeMsisdn('٠٥٠١٢٣٤٥٦٧')).toBe(normalizeMsisdn('0501234567'));
  });

  it('strips bidi control characters that ride along with pasted text', () => {
    expect(normalizeMsisdn('‏0501234567‎')).toBe('+966501234567');
  });

  it('rejects anything that is not a Saudi mobile', () => {
    expect(normalizeMsisdn('0126543210')).toBeNull(); // landline
    expect(normalizeMsisdn('05012345')).toBeNull(); // too short
    expect(normalizeMsisdn('')).toBeNull();
    expect(normalizeMsisdn(null)).toBeNull();
    expect(normalizeMsisdn(undefined)).toBeNull();
    expect(normalizeMsisdn('not a phone')).toBeNull();
  });
});

describe('stampProgress', () => {
  it('reports a partly filled card', () => {
    const p = stampProgress(3, 5);
    expect(p.filled).toBe(3);
    expect(p.remaining).toBe(2);
    expect(p.slots).toEqual([true, true, true, false, false]);
    expect(p.pct).toBe(60);
    expect(p.complete).toBe(false);
  });

  it('clamps the display when the balance runs ahead of the card', () => {
    const p = stampProgress(9, 5);
    expect(p.filled).toBe(5);
    expect(p.remaining).toBe(0);
    expect(p.complete).toBe(true);
  });

  it('never divides by zero on a misconfigured card', () => {
    expect(() => stampProgress(0, 0)).not.toThrow();
    expect(stampProgress(0, 0).slots).toHaveLength(1);
  });
});

describe('occasionsToUnlock', () => {
  const base: LoyaltySummary = {
    enabled: true,
    program_name: 'دائرة المناسبات',
    tier: 'member',
    stamp_balance: 0,
    stamps_required: 5,
    stamps_to_next: 5,
    lifetime_stamps: 0,
    window_spend: 0,
    tier_threshold: 3000,
    occasions_count: 1,
    registry_unlock_occasions: 3,
    registry_unlocked: false,
    available_rewards: 0,
    referral_code: 'PC123456',
    consent_marketing: false,
  };

  it('counts down to the unlock', () => {
    expect(occasionsToUnlock(base)).toBe(2);
  });

  it('stops nagging once the reward is unlocked', () => {
    expect(occasionsToUnlock({ ...base, registry_unlocked: true })).toBe(0);
  });

  it('never goes negative when the customer stored more than required', () => {
    expect(occasionsToUnlock({ ...base, occasions_count: 9 })).toBe(0);
  });

  it('is safe on a missing summary', () => {
    expect(occasionsToUnlock(null)).toBe(0);
  });
});

describe('daysUntilLabel', () => {
  it('reads naturally across the ranges', () => {
    expect(daysUntilLabel(0)).toBe('اليوم');
    expect(daysUntilLabel(1)).toBe('غداً');
    expect(daysUntilLabel(2)).toBe('بعد يومين');
    expect(daysUntilLabel(5)).toContain('أيام');
    expect(daysUntilLabel(20)).toContain('يوماً');
    expect(daysUntilLabel(30)).toContain('يوماً');
    expect(daysUntilLabel(31)).toBe('بعد شهر تقريباً');
    expect(daysUntilLabel(120)).toContain('أشهر');
  });
});

describe('pluralAr', () => {
  it('follows Arabic number agreement', () => {
    expect(pluralAr(1, 'طلب', 'طلبان', 'طلبات', 'طلباً')).toBe('طلب');
    expect(pluralAr(2, 'طلب', 'طلبان', 'طلبات', 'طلباً')).toBe('طلبان');
    expect(pluralAr(5, 'طلب', 'طلبان', 'طلبات', 'طلباً')).toBe('طلبات');
    expect(pluralAr(15, 'طلب', 'طلبان', 'طلبات', 'طلباً')).toBe('طلباً');
  });
});

describe('daysInMonth', () => {
  it('offers 29 days in February so a stored 29/2 survives non-leap years', () => {
    expect(daysInMonth(2)).toBe(29);
  });

  it('is right for the rest and clamps out-of-range input', () => {
    expect(daysInMonth(1)).toBe(31);
    expect(daysInMonth(4)).toBe(30);
    expect(daysInMonth(12)).toBe(31);
    expect(daysInMonth(0)).toBe(31);
    expect(daysInMonth(99)).toBe(31);
  });
});
