import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { callHomepageRpc } from '@/lib/homepage/rpc';
import { DEFAULT_ORDER, resolveContent, type SectionContent } from '@/lib/homepage/schema';
import { SECTION_KEYS, isSectionKey, type HomepageSectionRow, type SectionKey } from '@/lib/homepage/types';

/**
 * اتحاد مُميَّز بالمفتاح لا واجهة واحدة: هكذا يُضيّق `s.key === 'hero'` نوعَ
 * `s.content` إلى محتوى الواجهة بالذات، بدل اتحاد كل الأقسام الاثني عشر.
 */
export type AdminSection = {
  [K in SectionKey]: {
    key: K;
    isVisible: boolean;
    order: number;
    /** المحتوى بعد الدمج فوق النصّ الأصلي — ما يُملأ به النموذج. */
    content: SectionContent[K];
    /** لا تجاوزات محفوظة بعد؛ يعرضه الجدول كـ«النصّ الأصلي». */
    isPristine: boolean;
  };
}[SectionKey];

/**
 * كل الأقسام كما يراها المدير — بما فيها المُطفأة، وبمحتواها كاملاً.
 *
 * تُبنى من `SECTION_KEYS` وتُغطّى بصفوف القاعدة، تماماً كما تفعل
 * `useHomepageContent`: قسم أُضيف في الشفرة قبل هجرته يجب أن يظهر في اللوحة
 * قابلاً للتحرير، لا أن يغيب حتى يلحق به صفّ.
 */
export function useHomepageSections() {
  const query = useQuery({
    queryKey: ['homepage', 'admin'],
    queryFn: async () => {
      const rows = await callHomepageRpc<HomepageSectionRow[]>('get_homepage_sections_admin');
      return (rows ?? []).filter((r) => isSectionKey(r.key));
    },
  });

  const sections = useMemo(() => {
    const byKey = new Map((query.data ?? []).map((r) => [r.key as SectionKey, r]));
    return SECTION_KEYS.map((key) => {
      const row = byKey.get(key);
      const overrides = (row?.content ?? {}) as Record<string, unknown>;
      return {
        key,
        isVisible: row?.is_visible ?? true,
        order: row?.display_order ?? DEFAULT_ORDER[key],
        content: resolveContent(key, overrides),
        isPristine: Object.keys(overrides).length === 0,
      } as AdminSection;
    }).sort((a, b) => a.order - b.order);
  }, [query.data]);

  return { ...query, sections };
}

/** تُبطِل مفتاح اللوحة ومفتاح المتجر معاً — وإلا بقيت `/` على النسخة القديمة. */
function useInvalidateHomepage() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['homepage'] });
}

export function useUpdateHomepageSection() {
  const invalidate = useInvalidateHomepage();

  return useMutation({
    mutationFn: async (input: { key: SectionKey; content?: unknown; isVisible?: boolean }) => {
      await callHomepageRpc<void>('update_homepage_section', {
        _key: input.key,
        _content: input.content ?? null,
        _is_visible: input.isVisible ?? null,
      });
    },
    onSuccess: (_data, input) => {
      invalidate();
      toast({
        title: input.content ? 'تم حفظ القسم' : input.isVisible ? 'تم إظهار القسم' : 'تم إخفاء القسم',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'تعذّر حفظ القسم', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReorderHomepageSections() {
  const invalidate = useInvalidateHomepage();

  return useMutation({
    mutationFn: async (keys: SectionKey[]) => {
      await callHomepageRpc<void>('reorder_homepage_sections', { _keys: keys });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'تم حفظ الترتيب' });
    },
    onError: (error: Error) => {
      toast({ title: 'تعذّر حفظ الترتيب', description: error.message, variant: 'destructive' });
    },
  });
}

export function useResetHomepageSection() {
  const invalidate = useInvalidateHomepage();

  return useMutation({
    mutationFn: async (key: SectionKey) => {
      await callHomepageRpc<void>('reset_homepage_section', { _key: key });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'تمت إعادة القسم إلى نصّه الأصلي' });
    },
    onError: (error: Error) => {
      toast({ title: 'تعذّرت إعادة القسم', description: error.message, variant: 'destructive' });
    },
  });
}
