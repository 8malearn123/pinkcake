import { SECTION_DEFAULTS, type SectionContent } from './schema';
import type { SectionKey } from './types';

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * يستبدل الصور الفارغة بصورة نائبة.
 *
 * أثناء الكتابة يمرّ حقل الرابط بحالة فارغة حتماً، و`<img src="">` يجعل المتصفّح
 * يطلب الصفحة نفسها ويرسم أيقونة صورة مكسورة — ضجيج بصريّ في معاينة غرضها أن
 * تُطمئن. البحث عام لا مُعدَّد: كل صور المحتوى تتّخذ الشكل `{ url, alt }`.
 */
function withImageFallbacks(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withImageFallbacks);
  if (!isPlainObject(value)) return value;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = withImageFallbacks(v);
  if (typeof out.url === 'string' && out.url.trim() === '') out.url = '/placeholder.svg';
  return out;
}

/**
 * محتوى قسم كما تعرضه المعاينة الحيّة أثناء الكتابة.
 *
 * لا يمرّ بـ zod عمداً، خلافاً لـ `resolveContent`: التحقّق يعيد المحتوى كلّه
 * إلى نصّه الأصلي عند أول حقل غير صالح، فكانت المعاينة سترتدّ إلى النصّ الأصلي
 * لحظة يمسح المدير عنواناً ليكتب غيره. الحفظ يبقى محروساً بالمخطّط نفسه، أما
 * المعاينة فتُظهر ما كُتب فعلاً — بما فيه العنوان الفارغ.
 */
export function previewContent<K extends SectionKey>(key: K, draft: unknown): SectionContent[K] {
  const merged = isPlainObject(draft) ? { ...SECTION_DEFAULTS[key], ...draft } : SECTION_DEFAULTS[key];
  return withImageFallbacks(merged) as SectionContent[K];
}
