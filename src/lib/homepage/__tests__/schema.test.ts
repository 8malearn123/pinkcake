import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ORDER,
  SECTION_DEFAULTS,
  SECTION_REGISTRY,
  SECTION_SCHEMAS,
  resolveContent,
} from '../schema';
import { CTA_TARGETS, SECTION_KEYS, isSectionKey, type SectionKey } from '../types';

describe('registry integrity', () => {
  it('has no duplicate keys', () => {
    expect(new Set(SECTION_KEYS).size).toBe(SECTION_KEYS.length);
  });

  it('gives every key a schema, defaults, an order and a descriptor', () => {
    for (const key of SECTION_KEYS) {
      expect(SECTION_SCHEMAS[key], `${key} schema`).toBeDefined();
      expect(SECTION_DEFAULTS[key], `${key} defaults`).toBeDefined();
      expect(DEFAULT_ORDER[key], `${key} order`).toBeGreaterThan(0);
      expect(SECTION_REGISTRY[key]?.key, `${key} descriptor`).toBe(key);
    }
  });

  it('orders the sections uniquely', () => {
    const orders = SECTION_KEYS.map((k) => DEFAULT_ORDER[k]);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('narrows unknown strings', () => {
    expect(isSectionKey('hero')).toBe(true);
    expect(isSectionKey('nope')).toBe(false);
  });
});

/**
 * الحارس الحقيقي لهذا الملف. القيم الافتراضية هي ما يُعرض على `/` قبل أي تحرير،
 * فلو خالف أحدها مخطّطه لسقط القسم إلى نفسه صامتاً عبر `resolveContent` — وهو
 * فشل لا يُرى إلا على الصفحة نفسها.
 */
describe('defaults satisfy their own schemas', () => {
  it.each(SECTION_KEYS.map((k) => [k]))('%s', (key) => {
    const parsed = SECTION_SCHEMAS[key as SectionKey].safeParse(SECTION_DEFAULTS[key as SectionKey]);
    expect(parsed.success ? null : parsed.error.issues).toBeNull();
  });
});

describe('descriptors point at real fields', () => {
  const rootOf = (path: string) => path.split('.')[0];

  it.each(SECTION_KEYS.map((k) => [k]))('%s', (key) => {
    const defaults = SECTION_DEFAULTS[key as SectionKey] as Record<string, unknown>;
    for (const field of SECTION_REGISTRY[key as SectionKey].fields) {
      expect(defaults, `${key}.${field.name}`).toHaveProperty(rootOf(field.name));
    }
  });

  it('builds new list items that satisfy the section schema', () => {
    for (const key of SECTION_KEYS) {
      for (const field of SECTION_REGISTRY[key].fields) {
        if (field.kind !== 'list' || !field.newItem) continue;
        const item = field.newItem();
        // العنصر الجديد فارغ عمداً (النصوص مطلوبة)، لكن مفاتيحه يجب أن تطابق
        // مفاتيح عنصر افتراضي موجود، وإلا حفظ المدير شكلاً لا يعرفه المخطّط.
        const existing = (SECTION_DEFAULTS[key] as Record<string, unknown>)[field.name] as
          | Record<string, unknown>[]
          | undefined;
        if (existing?.length) {
          expect(Object.keys(item).sort(), `${key}.${field.name}`).toEqual(
            Object.keys(existing[0]).sort(),
          );
        }
      }
    }
  });

  it('only offers CTA targets the schema accepts', () => {
    const allowed = new Set(CTA_TARGETS.map((t) => t.value));
    for (const key of SECTION_KEYS) {
      for (const field of SECTION_REGISTRY[key].fields) {
        const nested = field.itemFields ?? [];
        for (const f of [field, ...nested]) {
          if (f.name !== 'target' || !f.options) continue;
          for (const opt of f.options) expect(allowed).toContain(opt.value);
        }
      }
    }
  });
});

describe('resolveContent', () => {
  it('returns the defaults when the row has no overrides', () => {
    expect(resolveContent('hero', {})).toEqual(SECTION_DEFAULTS.hero);
    expect(resolveContent('faq', null)).toEqual(SECTION_DEFAULTS.faq);
    expect(resolveContent('faq', undefined)).toEqual(SECTION_DEFAULTS.faq);
  });

  it('applies a partial override without losing the untouched keys', () => {
    const out = resolveContent('hero', { title: 'عنوان جديد' });
    expect(out.title).toBe('عنوان جديد');
    expect(out.lede).toBe(SECTION_DEFAULTS.hero.lede);
    expect(out.image.url).toBe(SECTION_DEFAULTS.hero.image.url);
  });

  /**
   * الدمج سطحيّ عن قصد. لو كان عميقاً لعادت العناصر المحذوفة من البذرة في كل
   * قراءة، ولصار حذف سؤال من الأسئلة الشائعة مستحيلاً.
   */
  it('lets a shorter list actually delete items', () => {
    const out = resolveContent('faq', {
      items: [{ q: 'سؤال واحد', a: 'إجابة واحدة', visible: true }],
    });
    expect(out.items).toHaveLength(1);
  });

  it('falls back to the defaults rather than throwing on invalid data', () => {
    expect(resolveContent('hero', { title: '' })).toEqual(SECTION_DEFAULTS.hero);
    expect(resolveContent('hero', { image: { url: 'javascript:alert(1)' } })).toEqual(
      SECTION_DEFAULTS.hero,
    );
    expect(resolveContent('reviews', { items: 'not-an-array' })).toEqual(SECTION_DEFAULTS.reviews);
  });

  it('accepts both absolute and site-relative image URLs', () => {
    const uploaded = resolveContent('hero', {
      image: { url: '/storage/v1/object/public/product-images/homepage/x.webp', alt: '' },
    });
    expect(uploaded.image.url).toContain('/homepage/x.webp');
  });
});
