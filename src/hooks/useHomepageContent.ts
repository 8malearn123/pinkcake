import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callHomepageRpc } from '@/lib/homepage/rpc';
import { DEFAULT_ORDER, resolveContent, type SectionContent } from '@/lib/homepage/schema';
import { SECTION_KEYS, isSectionKey, type HomepageSectionRow, type SectionKey } from '@/lib/homepage/types';

export interface VisibleSection {
  key: SectionKey;
  order: number;
}

/**
 * محتوى الصفحة الرئيسية كما يقرأه المتجر.
 *
 * القائمة تُبنى من `SECTION_KEYS` — لا من صفوف القاعدة — ثم تُغطّى بها. فقسم
 * أُضيف في الشفرة قبل أن تُطبَّق هجرته يَظهر فوراً بترتيبه ونصّه الأصليين، بدل
 * أن يختفي حتى يلحق به صفّ. هذا مع `resolveContent` يجعل الصفحة الرئيسية غير
 * قابلة لأن تُفرَّغ بسبب بيانات ناقصة.
 *
 * وأثناء التحميل نعرض الافتراضي لا فراغاً: الواجهة أول ما يُرسم على الصفحة،
 * وومضة إعادة ترتيب لقسم أسفل الطيّة أهون من صفحة بيضاء.
 */
export function useHomepageContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['homepage', 'content'],
    queryFn: async () => {
      const rows = await callHomepageRpc<HomepageSectionRow[]>('get_homepage_sections');
      return (rows ?? []).filter((r) => isSectionKey(r.key));
    },
    staleTime: 5 * 60_000,
  });

  return useMemo(() => {
    const byKey = new Map((data ?? []).map((r) => [r.key as SectionKey, r]));

    const sections: VisibleSection[] = SECTION_KEYS.map((key) => ({
      key,
      order: byKey.get(key)?.display_order ?? DEFAULT_ORDER[key],
      visible: byKey.get(key)?.is_visible ?? true,
    }))
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
      .map(({ key, order }) => ({ key, order }));

    const content = SECTION_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: resolveContent(key, byKey.get(key)?.content) }),
      {} as SectionContent,
    );

    const visibleKeys = new Set(sections.map((s) => s.key));

    return {
      sections,
      /** محتوى قسم بعينه، مدموجاً فوق نصّه الأصلي ومتحقَّقاً منه. */
      contentOf: <K extends SectionKey>(key: K): SectionContent[K] => content[key],
      /** هل يعرض المتجر هذا القسم أصلاً — يستخدمه شريط التنقّل والتذييل. */
      isSectionVisible: (key: SectionKey) => visibleKeys.has(key),
      isLoading,
    };
  }, [data, isLoading]);
}

/** عناصر القوائم كلها تحمل مفتاح إظهار خاصاً بها. */
export const visibleItems = <T extends { visible?: boolean }>(items: readonly T[]): T[] =>
  items.filter((i) => i.visible !== false);
