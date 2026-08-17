import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import {
  useHomepageSections,
  useReorderHomepageSections,
  useResetHomepageSection,
  useUpdateHomepageSection,
} from '../useHomepageAdmin';
import { SECTION_DEFAULTS } from '@/lib/homepage/schema';
import { SECTION_KEYS } from '@/lib/homepage/types';

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

const callHomepageRpc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/homepage/rpc', () => ({ callHomepageRpc }));

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

beforeEach(() => {
  callHomepageRpc.mockReset();
});

describe('useHomepageSections', () => {
  it('lists every section even when the table has no rows yet', async () => {
    callHomepageRpc.mockResolvedValue([]);
    const { result } = renderHook(() => useHomepageSections(), { wrapper: wrap(newClient()) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sections.map((s) => s.key)).toEqual([...SECTION_KEYS]);
    expect(result.current.sections.every((s) => s.isVisible)).toBe(true);
    // بلا تجاوزات محفوظة، فزرّ «إعادة للأصل» يجب أن يكون معطّلاً.
    expect(result.current.sections.every((s) => s.isPristine)).toBe(true);
  });

  it('merges saved overrides over the shipped copy and marks the row edited', async () => {
    callHomepageRpc.mockResolvedValue([
      { key: 'hero', is_visible: false, display_order: 2, content: { title: 'محرَّر' } },
    ]);
    const { result } = renderHook(() => useHomepageSections(), { wrapper: wrap(newClient()) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const hero = result.current.sections.find((s) => s.key === 'hero');
    expect(hero?.isVisible).toBe(false);
    expect(hero?.isPristine).toBe(false);
    // `key === 'hero'` يُضيّق النوع، فالوصول إلى الحقول مُنمَّط لا مُحوَّل بالقوّة.
    if (hero?.key !== 'hero') throw new Error('hero section missing');
    expect(hero.content.title).toBe('محرَّر');
    expect(hero.content.lede).toBe(SECTION_DEFAULTS.hero.lede);
  });

  it('orders by display_order, not by the registry order', async () => {
    callHomepageRpc.mockResolvedValue([{ key: 'faq', is_visible: true, display_order: 0, content: {} }]);
    const { result } = renderHook(() => useHomepageSections(), { wrapper: wrap(newClient()) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sections[0].key).toBe('faq');
  });
});

/**
 * كل طفرة تُبطل `['homepage']` كاملاً — لا مفتاح اللوحة وحده. المفتاحان فرعان
 * منه، فلو أُبطل مفتاح اللوحة فقط لبقيت `/` على النسخة القديمة حتى انتهاء
 * صلاحيّتها بعد خمس دقائق، وهو بالضبط شكل «حفظتُ ولم يتغيّر شيء».
 */
describe('mutations invalidate both the admin and the storefront caches', () => {
  async function expectInvalidation(run: () => { mutate: () => void }) {
    callHomepageRpc.mockResolvedValue(undefined);
    const client = newClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(run, { wrapper: wrap(client) });
    result.current.mutate();

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['homepage'] }));
  }

  it('update', async () => {
    await expectInvalidation(() => {
      const m = useUpdateHomepageSection();
      return { mutate: () => m.mutate({ key: 'hero', content: {} }) };
    });
  });

  it('reorder', async () => {
    await expectInvalidation(() => {
      const m = useReorderHomepageSections();
      return { mutate: () => m.mutate(['hero']) };
    });
  });

  it('reset', async () => {
    await expectInvalidation(() => {
      const m = useResetHomepageSection();
      return { mutate: () => m.mutate('hero') };
    });
  });
});

describe('useUpdateHomepageSection', () => {
  it('sends nulls for the fields it is not changing, so a toggle cannot wipe content', async () => {
    callHomepageRpc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUpdateHomepageSection(), { wrapper: wrap(newClient()) });

    result.current.mutate({ key: 'faq', isVisible: false });

    await waitFor(() =>
      expect(callHomepageRpc).toHaveBeenCalledWith('update_homepage_section', {
        _key: 'faq',
        _content: null,
        _is_visible: false,
      }),
    );
  });
});
