import { describe, it, expect } from 'vitest';
import { previewContent } from '../preview';
import { SECTION_DEFAULTS } from '../schema';

describe('previewContent', () => {
  it('falls back to the shipped copy when there is no draft', () => {
    expect(previewContent('hero', null)).toEqual(SECTION_DEFAULTS.hero);
  });

  it('applies the draft over the shipped copy', () => {
    const out = previewContent('hero', { title: 'قيد الكتابة' });
    expect(out.title).toBe('قيد الكتابة');
    expect(out.lede).toBe(SECTION_DEFAULTS.hero.lede);
  });

  /**
   * الفرق الجوهري عن `resolveContent`: ذاك يتحقّق بـ zod ويرتدّ إلى النصّ
   * الأصلي كلّه عند أول حقل غير صالح. لو استُخدم في المعاينة لعادت الواجهة إلى
   * عنوانها الأصلي لحظة يمسح المدير العنوان ليكتب غيره — وهو أسوأ ما يمكن أن
   * تفعله معاينة حيّة.
   */
  it('shows an emptied field as empty instead of snapping back to the default', () => {
    expect(previewContent('hero', { ...SECTION_DEFAULTS.hero, title: '' }).title).toBe('');
  });

  it('swaps an emptied image URL for the placeholder, at any depth', () => {
    const hero = previewContent('hero', {
      ...SECTION_DEFAULTS.hero,
      image: { url: '   ', alt: 'وصف' },
    });
    expect(hero.image.url).toBe('/placeholder.svg');
    expect(hero.image.alt).toBe('وصف');

    // داخل مصفوفة عناصر أيضاً — البلاطات والبطاقات كلّها تحمل صوراً.
    const events = previewContent('events', {
      ...SECTION_DEFAULTS.events,
      items: [{ ...SECTION_DEFAULTS.events.items[0], image: { url: '', alt: '' } }],
    });
    expect(events.items[0].image.url).toBe('/placeholder.svg');
  });

  it('leaves a real URL alone', () => {
    const out = previewContent('hero', {
      ...SECTION_DEFAULTS.hero,
      image: { url: 'https://example.com/a.jpg', alt: '' },
    });
    expect(out.image.url).toBe('https://example.com/a.jpg');
  });

  it('keeps a shortened list short', () => {
    const out = previewContent('faq', {
      ...SECTION_DEFAULTS.faq,
      items: [{ q: 'واحد', a: 'إجابة', visible: true }],
    });
    expect(out.items).toHaveLength(1);
  });
});
