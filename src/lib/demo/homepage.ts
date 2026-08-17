/**
 * الطبقة التجريبية لإدارة الصفحة الرئيسية.
 *
 * وجودها ليس رفاهية: `resolveRpc` يعيد `{ success: true }` لأي دالة غير مُسجَّلة
 * **بلا أن تغيّر شيئاً** — أي أن لوحة المدير كاملةً كانت ستبدو وكأنها تعمل،
 * وتُظهر رسالة «تم الحفظ»، ولا تحرّك حرفاً على الصفحة.
 *
 * الحالة في localStorage لا sessionStorage (خلافاً لـ `./loyalty.ts`): المصمّم
 * يحرّر في تبويب اللوحة ويريد أن يرى الأثر في تبويب المتجر، وتبديل الدور يعيد
 * تحميل الصفحة كاملةً.
 */
import { DEFAULT_ORDER } from '@/lib/homepage/schema';
import { SECTION_KEYS, type SectionKey } from '@/lib/homepage/types';

const STORAGE_KEY = 'pinkcake:demo-homepage:v1';

interface DemoSection {
  key: SectionKey;
  is_visible: boolean;
  display_order: number;
  content: Record<string, unknown>;
}

type DemoHomepageState = Record<string, DemoSection>;

/**
 * البذرة تطابق بذرة الهجرة: مفاتيح وترتيب، و`content` فارغ يعني «استخدم النصّ
 * الأصلي من الشفرة». لا نسخة ثانية من النصوص هنا.
 */
function seed(): DemoHomepageState {
  const out: DemoHomepageState = {};
  for (const key of SECTION_KEYS) {
    out[key] = { key, is_visible: true, display_order: DEFAULT_ORDER[key], content: {} };
  }
  return out;
}

let state: DemoHomepageState | null = null;

function load(): DemoHomepageState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as DemoHomepageState) : null;
    // الدمج فوق البذرة، لا استبدالها: قسم أُضيف في الشفرة بعد آخر حفظ يجب أن
    // يَظهر، لا أن يختفي لأن الحالة المحفوظة لا تعرفه.
    state = saved ? { ...seed(), ...saved } : seed();
  } catch {
    state = seed();
  }
  return state;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* الوضع الخاص أو التخزين ممتلئ — الحالة تبقى في الذاكرة فقط */
  }
}

/** يُستخدم في الاختبارات لإعادة الحالة إلى بذرتها. */
export function __resetDemoHomepage() {
  state = seed();
  save();
}

const ordered = (s: DemoHomepageState) =>
  Object.values(s).sort((a, b) => a.display_order - b.display_order || a.key.localeCompare(b.key));

export const homepageRpc: Record<string, (args?: Record<string, unknown>) => unknown> = {
  // يطابق الدالة الحقيقية: كل الصفوف، ومحتوى المخفيّ مُفرَّغ.
  get_homepage_sections: () =>
    ordered(load()).map((s) => ({ ...s, content: s.is_visible ? s.content : {} })),

  get_homepage_sections_admin: () => ordered(load()).map((s) => ({ ...s })),

  update_homepage_section: (a) => {
    const s = load();
    const key = String(a?.['_key'] ?? '');
    const row = s[key];
    if (!row) return { success: false, message: `قسم غير معروف: ${key}` };

    const content = a?.['_content'];
    const isVisible = a?.['_is_visible'];
    if (content !== undefined && content !== null) row.content = content as Record<string, unknown>;
    if (typeof isVisible === 'boolean') row.is_visible = isVisible;

    save();
    return { success: true };
  },

  // تتجاهل المفاتيح التي لا صفّ لها، تماماً كالدالة الحقيقية.
  reorder_homepage_sections: (a) => {
    const s = load();
    const keys = (a?.['_keys'] ?? []) as string[];
    keys.forEach((k, i) => {
      if (s[k]) s[k].display_order = i + 1;
    });
    save();
    return { success: true };
  },

  reset_homepage_section: (a) => {
    const s = load();
    const key = String(a?.['_key'] ?? '');
    const row = s[key];
    if (!row) return { success: false, message: `قسم غير معروف: ${key}` };
    row.content = {};
    row.is_visible = true;
    save();
    return { success: true };
  },
};
