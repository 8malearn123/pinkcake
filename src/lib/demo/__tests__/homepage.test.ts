import { describe, it, expect, beforeEach } from 'vitest';
import { homepageRpc, __resetDemoHomepage } from '../homepage';
import { resolveRpc } from '../rpc';
import { SECTION_KEYS } from '@/lib/homepage/types';

/** الرد العام الذي تعود به أي دالة غير مُسجّلة — أي «زرّ ميت». */
const GENERIC = { success: true, message: 'تم تنفيذ العملية (وضع تجريبي)' };

/**
 * كل دوال الصفحة الرئيسية التي تناديها الواجهة. القائمة تفشل عمداً إن أُضيفت
 * دالة جديدة ونُسي تسجيلها هنا — وهي الحالة التي تُنتج لوحة تقول «تم الحفظ»
 * ولا تغيّر حرفاً على `/`، في الوضع الذي تعمل به كل معاينات المشروع.
 */
const HOMEPAGE_RPCS = [
  'get_homepage_sections',
  'get_homepage_sections_admin',
  'update_homepage_section',
  'reorder_homepage_sections',
  'reset_homepage_section',
];

type Row = { key: string; is_visible: boolean; display_order: number; content: Record<string, unknown> };

const admin = () => homepageRpc.get_homepage_sections_admin() as Row[];
const publicRows = () => homepageRpc.get_homepage_sections() as Row[];

beforeEach(() => {
  __resetDemoHomepage();
});

describe('demo mode wiring', () => {
  it('maps every homepage RPC — an unmapped one is a dead button, not an error', () => {
    for (const name of HOMEPAGE_RPCS) {
      expect(resolveRpc(name, {}), `${name} falls through to the generic success`).not.toEqual(
        GENERIC,
      );
    }
  });

  it('seeds one row per section key, in order', () => {
    const rows = admin();
    expect(rows.map((r) => r.key)).toEqual([...SECTION_KEYS]);
    expect(rows.every((r) => r.is_visible)).toBe(true);
    expect(rows.every((r) => Object.keys(r.content).length === 0)).toBe(true);
  });
});

describe('update_homepage_section', () => {
  it('persists content so the storefront actually changes', () => {
    homepageRpc.update_homepage_section({ _key: 'hero', _content: { title: 'عنوان محرَّر' } });
    expect(admin().find((r) => r.key === 'hero')?.content).toEqual({ title: 'عنوان محرَّر' });
  });

  it('toggles visibility independently of content', () => {
    homepageRpc.update_homepage_section({ _key: 'faq', _content: { title: 'أسئلة' } });
    homepageRpc.update_homepage_section({ _key: 'faq', _is_visible: false });

    const row = admin().find((r) => r.key === 'faq');
    expect(row?.is_visible).toBe(false);
    expect(row?.content).toEqual({ title: 'أسئلة' });
  });

  it('rejects an unknown key instead of silently succeeding', () => {
    expect(homepageRpc.update_homepage_section({ _key: 'nope', _content: {} })).toMatchObject({
      success: false,
    });
  });
});

describe('get_homepage_sections (public)', () => {
  it('blanks the content of hidden sections but still reports them', () => {
    homepageRpc.update_homepage_section({ _key: 'faq', _content: { title: 'سرّي' } });
    homepageRpc.update_homepage_section({ _key: 'faq', _is_visible: false });

    const row = publicRows().find((r) => r.key === 'faq');
    // مذكور — كي تميّز الواجهة «مخفيّ» عن «غير موجود» — لكن بلا محتواه.
    expect(row).toBeDefined();
    expect(row?.is_visible).toBe(false);
    expect(row?.content).toEqual({});
  });
});

describe('reorder_homepage_sections', () => {
  it('rewrites display_order from the array position', () => {
    const reversed = [...SECTION_KEYS].reverse();
    homepageRpc.reorder_homepage_sections({ _keys: reversed });
    expect(admin().map((r) => r.key)).toEqual(reversed);
  });

  /**
   * اللوحة تبني القائمة من `SECTION_KEYS` في الشفرة، فقسم أُضيف قبل هجرته يجعل
   * القائمة أطول من الجدول. رفضها عندها كان سيُعطّل ترتيب الأقسام كلّها.
   */
  it('ignores a key that has no row instead of failing the whole reorder', () => {
    expect(homepageRpc.reorder_homepage_sections({ _keys: ['faq', 'nope', 'hero'] })).toMatchObject({
      success: true,
    });
    // المفاتيح المعروفة أُعيد ترتيبها بمواضعها، والمجهول لم يمنع ذلك.
    const order = admin().map((r) => r.key);
    expect(order[0]).toBe('faq');
    expect(order.indexOf('faq')).toBeLessThan(order.indexOf('hero'));
  });
});

describe('reset_homepage_section', () => {
  it('clears the overrides and re-shows the section', () => {
    homepageRpc.update_homepage_section({ _key: 'hero', _content: { title: 'x' }, _is_visible: false });
    homepageRpc.reset_homepage_section({ _key: 'hero' });

    const row = admin().find((r) => r.key === 'hero');
    expect(row?.content).toEqual({});
    expect(row?.is_visible).toBe(true);
  });
});
