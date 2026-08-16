import { describe, it, expect } from 'vitest';
import { occasionPhrase, renderOccasionReminder } from '../templates';

const base = {
  label: 'ماما',
  occasionType: 'birthday',
  storeName: 'Pink Cake',
  shopUrl: 'https://example.com/shop',
} as const;

describe('occasionPhrase', () => {
  it('prefixes the stored label with the occasion noun', () => {
    expect(occasionPhrase('birthday', 'ماما')).toBe('عيد ميلاد ماما');
    expect(occasionPhrase('anniversary', 'ذكرى زواجنا')).toBe('ذكرى زواج ذكرى زواجنا');
    expect(occasionPhrase('graduation', 'سارة')).toBe('تخرّج سارة');
  });

  it('falls back for an unknown type rather than rendering undefined', () => {
    expect(occasionPhrase('nonsense', 'سارة')).toBe('مناسبة سارة');
  });

  it('trims a sloppy label', () => {
    expect(occasionPhrase('birthday', '  ماما  ')).toBe('عيد ميلاد ماما');
  });
});

describe('renderOccasionReminder — the utility/marketing split', () => {
  /**
   * هذا هو الاختبار الذي يحمي الفصل النظامي. الرسالة المجرّدة تُرسل استناداً
   * إلى التعامل السابق؛ فإن تسرّب إليها عرض أو سعر أو رابط شراء صارت تسويقاً
   * مباشراً بلا موافقة — وهو ما يجب أن يفشل البناء لا أن يُكتشف بعد الإرسال.
   */
  const OFFER_MARKERS = ['خصم', 'مجاني', 'ريال', '٪', '%', 'اطلبي', 'عرض'];

  for (const leadDays of [14, 5, 1]) {
    it(`utility copy at T−${leadDays} carries no offer, price or link`, () => {
      const body = renderOccasionReminder({ ...base, leadDays, kind: 'utility' });
      expect(body).toBeTruthy();
      for (const marker of OFFER_MARKERS) {
        expect(body, `T−${leadDays} contained "${marker}"`).not.toContain(marker);
      }
      expect(body).not.toContain('https://');
    });

    it(`marketing copy at T−${leadDays} may carry the shop link`, () => {
      const body = renderOccasionReminder({ ...base, leadDays, kind: 'marketing' });
      expect(body).toBeTruthy();
      expect(body).toContain('https://example.com/shop');
    });
  }

  it('omits the link when no shop URL is configured', () => {
    const body = renderOccasionReminder({
      ...base,
      shopUrl: null,
      leadDays: 5,
      kind: 'marketing',
    });
    expect(body).not.toContain('https://');
  });

  it('names the occasion in every message', () => {
    for (const kind of ['utility', 'marketing'] as const) {
      for (const leadDays of [14, 5, 1]) {
        expect(renderOccasionReminder({ ...base, leadDays, kind })).toContain('عيد ميلاد ماما');
      }
    }
  });

  it('returns null for a lead window it has no copy for, rather than a generic message', () => {
    expect(renderOccasionReminder({ ...base, leadDays: 0, kind: 'utility' })).toBeNull();
    expect(renderOccasionReminder({ ...base, leadDays: -3, kind: 'marketing' })).toBeNull();
  });

  it('never leaks a third party contact — only the label the customer stored', () => {
    const body = renderOccasionReminder({
      ...base,
      label: 'سارة',
      leadDays: 14,
      kind: 'utility',
    });
    expect(body).toContain('سارة');
    expect(body).not.toMatch(/\+?966\d/);
  });
});
