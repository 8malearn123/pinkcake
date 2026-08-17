import { describe, it, expect } from 'vitest';
import { sectionRenderers, type SectionRenderContext } from '../sectionRenderers';
import { SECTION_DEFAULTS } from '@/lib/homepage/schema';
import { SECTION_KEYS } from '@/lib/homepage/types';

const noop = () => {};

const ctx: SectionRenderContext = {
  contentOf: (key) => SECTION_DEFAULTS[key],
  listed: [],
  categories: [],
  category: 'الكل',
  onCategoryChange: noop,
  query: '',
  seasonal: [],
  combos: [],
  designCakes: [],
  catalogLoading: false,
  featured: undefined,
  storeName: 'Pink Cake',
  heroIsFirst: true,
  renderCard: () => null,
  onCta: noop,
  onNavigate: noop,
  onPickCake: noop,
  onViewFeatured: noop,
  onAddCombo: noop,
};

/**
 * المتجر ومعاينة لوحة الإدارة يرسمان من هذه الخريطة وحدها. الاختبار يحرس ذلك:
 * قسم في السجلّ بلا دالة رسم هنا يعني بطاقة فارغة في اللوحة، وهو ما يُبطل وعد
 * المعاينة بأن ما يراه المدير هو ما يراه الزبون.
 */
describe('sectionRenderers', () => {
  it('covers every registered section key', () => {
    const renderers = sectionRenderers(ctx);
    expect(Object.keys(renderers).sort()).toEqual([...SECTION_KEYS].sort());
  });

  it('returns something renderable for each key', () => {
    const renderers = sectionRenderers(ctx);
    for (const key of SECTION_KEYS) {
      expect(typeof renderers[key], key).toBe('function');
      expect(() => renderers[key](), key).not.toThrow();
    }
  });
});
