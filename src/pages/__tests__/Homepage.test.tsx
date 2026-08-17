import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import Homepage from '@/pages/Homepage';
import { SECTION_DEFAULTS } from '@/lib/homepage/schema';
import type { HomepageSectionRow } from '@/lib/homepage/types';

const rows = vi.hoisted(() => ({ value: [] as HomepageSectionRow[] }));
const callHomepageRpc = vi.hoisted(() => vi.fn());

vi.mock('@/lib/homepage/rpc', () => ({ callHomepageRpc }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

// اللوحة نفسها هي موضوع الاختبار، لا الهيكل حولها.
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { storeName: 'Pink Cake' } }),
}));

// المصادر الحيّة فارغة، وهو ما يجب أن تقوله شارة «لا يوجد محتوى».
const products = vi.hoisted(() => ({ value: [] as { id: string; name: string; price: number; season?: string }[] }));
vi.mock('@/hooks/usePublicStore', () => ({
  usePublicStoreProducts: () => ({ data: products.value }),
  isSoldOut: () => false,
}));
vi.mock('@/hooks/useCombos', () => ({ useCombos: () => ({ combos: [], activeCombos: [], urlFor: () => undefined }) }));
vi.mock('@/hooks/useCatalogSession', () => ({
  useCatalogSession: () => ({ status: 'ready', catalog: { levels: [], cakes: [], images: [] }, urlFor: () => undefined }),
}));
vi.mock('@/lib/cakeSelect', () => ({ galleryCakes: () => [] }));

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

/** بطاقة قسم بعينها على سطح التحرير. */
const canvas = (label: string) => screen.getByRole('region', { name: label });

beforeEach(() => {
  rows.value = [];
  products.value = [];
  callHomepageRpc.mockReset();
  callHomepageRpc.mockImplementation(async (fn: string) =>
    fn === 'get_homepage_sections_admin' ? rows.value : undefined,
  );
});

describe('Homepage editing surface', () => {
  it('renders every section as a live preview card, in page order', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
    const labels = screen.getAllByRole('region').map((el) => el.getAttribute('aria-label'));
    expect(labels.slice(0, 4)).toEqual([
      'الشريط المتحرك',
      'الواجهة الرئيسية',
      'استوديو التصميم',
      'التشكيلة الموسمية',
    ]);
  });

  /** جوهر الميزة: البطاقة تعرض القسم الحقيقي، لا وصفاً له. */
  it('shows the real storefront copy inside the card', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
    expect(within(canvas('الواجهة الرئيسية')).getByRole('heading', { level: 1 })).toHaveTextContent(
      SECTION_DEFAULTS.hero.title,
    );
    expect(within(canvas('الأسئلة الشائعة')).getByText('كم يحتاج تجهيز الطلب من وقت؟')).toBeInTheDocument();
  });

  it('opens the editor by clicking the preview itself', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
    fireEvent.click(within(canvas('الواجهة الرئيسية')).getByRole('button', { name: 'تحرير الواجهة الرئيسية' }));

    expect(await screen.findByLabelText('العنوان الرئيسي')).toHaveValue(SECTION_DEFAULTS.hero.title);
  });

  /**
   * الوعد الذي طُلبت هذه الواجهة من أجله: الكتابة في النموذج تُغيّر القسم
   * المعروض فوراً، قبل الحفظ.
   */
  it('updates the preview as the admin types, before saving', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
    fireEvent.click(within(canvas('الواجهة الرئيسية')).getByRole('button', { name: 'تحرير الواجهة الرئيسية' }));

    fireEvent.change(await screen.findByLabelText('العنوان الرئيسي'), {
      target: { value: 'عنوان يظهر فوراً' },
    });

    await waitFor(() =>
      expect(within(canvas('الواجهة الرئيسية')).getByRole('heading', { level: 1 })).toHaveTextContent(
        'عنوان يظهر فوراً',
      ),
    );
    // ولم يُحفظ شيء بعد.
    expect(callHomepageRpc.mock.calls.some(([fn]) => fn === 'update_homepage_section')).toBe(false);
  });

  it('keeps the other sections on their saved copy while one is being edited', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الأسئلة الشائعة')).toBeInTheDocument());
    fireEvent.click(within(canvas('الواجهة الرئيسية')).getByRole('button', { name: 'تحرير الواجهة الرئيسية' }));
    fireEvent.change(await screen.findByLabelText('العنوان الرئيسي'), { target: { value: 'مسودّة' } });

    await waitFor(() =>
      expect(within(canvas('الواجهة الرئيسية')).getByRole('heading', { level: 1 })).toHaveTextContent('مسودّة'),
    );
    expect(within(canvas('الأسئلة الشائعة')).getByText('كم يحتاج تجهيز الطلب من وقت؟')).toBeInTheDocument();
  });

  it('saves the edited section through the update RPC', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
    fireEvent.click(within(canvas('الواجهة الرئيسية')).getByRole('button', { name: 'تحرير الواجهة الرئيسية' }));
    fireEvent.change(await screen.findByLabelText('العنوان الرئيسي'), { target: { value: 'عنوان جديد' } });
    fireEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/ }));

    await waitFor(() => {
      const call = callHomepageRpc.mock.calls.find(([fn]) => fn === 'update_homepage_section');
      expect(call).toBeDefined();
      expect(call![1]._key).toBe('hero');
      expect((call![1]._content as { title: string }).title).toBe('عنوان جديد');
    });
  });

  it('hides a section from its own toolbar without touching its content', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الأسئلة الشائعة')).toBeInTheDocument());
    fireEvent.click(within(canvas('الأسئلة الشائعة')).getByLabelText('إظهار الأسئلة الشائعة'));

    await waitFor(() =>
      expect(callHomepageRpc).toHaveBeenCalledWith('update_homepage_section', {
        _key: 'faq',
        _content: null,
        _is_visible: false,
      }),
    );
  });

  /**
   * السهمان بدل السحب: بطاقات المعاينة ترتفع إلى مئات البكسلات، وسحبها عبر
   * قائمة يعني إمساكها وتمرير الصفحة في آن.
   */
  it('reorders with the arrow buttons and sends the whole new order', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
    fireEvent.click(within(canvas('الواجهة الرئيسية')).getByLabelText('تحريك الواجهة الرئيسية لأعلى'));

    await waitFor(() => {
      const call = callHomepageRpc.mock.calls.find(([fn]) => fn === 'reorder_homepage_sections');
      expect(call).toBeDefined();
      expect((call![1]._keys as string[]).slice(0, 2)).toEqual(['hero', 'marquee']);
    });
  });

  it('disables the arrow that would push a section off either end', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الشريط المتحرك')).toBeInTheDocument());
    expect(within(canvas('الشريط المتحرك')).getByLabelText('تحريك الشريط المتحرك لأعلى')).toBeDisabled();
    expect(within(canvas('صندوق الهدية')).getByLabelText('تحريك صندوق الهدية لأسفل')).toBeDisabled();
  });

  it('warns that an enabled section still will not show when its data source is empty', async () => {
    renderPage();

    await waitFor(() => expect(canvas('التشكيلة الموسمية')).toBeInTheDocument());
    expect(within(canvas('التشكيلة الموسمية')).getByText(/لا توجد منتجات معلَّمة بموسم/)).toBeInTheDocument();
    expect(screen.getAllByText('لا يوجد محتوى')).toHaveLength(3);
  });

  it('drops the warning once the data source has something in it', async () => {
    products.value = [{ id: 'p1', name: 'تورتة المنجا', price: 120, season: 'صيف' }];
    renderPage();

    await waitFor(() => expect(canvas('التشكيلة الموسمية')).toBeInTheDocument());
    expect(screen.getAllByText('لا يوجد محتوى')).toHaveLength(2);
    // والمعاينة ترسم بالمنتج الحقيقي، لا ببيانات عرض.
    expect(within(canvas('التشكيلة الموسمية')).getByText('تورتة المنجا')).toBeInTheDocument();
  });

  describe('unsaved-changes guard', () => {
    const startEditingHero = async () => {
      await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
      fireEvent.click(within(canvas('الواجهة الرئيسية')).getByRole('button', { name: 'تحرير الواجهة الرئيسية' }));
      fireEvent.change(await screen.findByLabelText('العنوان الرئيسي'), { target: { value: 'مسودّة' } });
    };

    it('blocks the switch and keeps the edit when the admin backs out', async () => {
      renderPage();
      await startEditingHero();

      fireEvent.click(within(canvas('الأسئلة الشائعة')).getByRole('button', { name: 'تحرير الأسئلة الشائعة' }));
      fireEvent.click(await screen.findByRole('button', { name: 'البقاء هنا' }));

      expect(screen.getByLabelText('العنوان الرئيسي')).toHaveValue('مسودّة');
    });

    it('switches and drops the draft once the admin confirms', async () => {
      renderPage();
      await startEditingHero();

      fireEvent.click(within(canvas('الأسئلة الشائعة')).getByRole('button', { name: 'تحرير الأسئلة الشائعة' }));
      fireEvent.click(await screen.findByRole('button', { name: 'تجاهل التغييرات' }));

      await waitFor(() => expect(screen.queryByLabelText('العنوان الرئيسي')).toBeNull());
      // والمعاينة عادت إلى النصّ المحفوظ، لا إلى المسودّة المتروكة.
      expect(within(canvas('الواجهة الرئيسية')).getByRole('heading', { level: 1 })).toHaveTextContent(
        SECTION_DEFAULTS.hero.title,
      );
    });

    it('does not warn after a successful save', async () => {
      renderPage();
      await startEditingHero();
      fireEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/ }));

      await waitFor(() => expect(screen.queryByText('لديك تغييرات غير محفوظة.')).toBeNull());
      fireEvent.click(within(canvas('الأسئلة الشائعة')).getByRole('button', { name: 'تحرير الأسئلة الشائعة' }));

      // انتقل بلا حوار تحذير — محرِّر الأسئلة مفتوح الآن.
      await waitFor(() => expect(screen.getByRole('button', { name: /إضافة سؤال/ })).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: 'تجاهل التغييرات' })).toBeNull();
    });
  });

  it('lets an item be removed from a list section', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الأسئلة الشائعة')).toBeInTheDocument());
    fireEvent.click(within(canvas('الأسئلة الشائعة')).getByRole('button', { name: 'تحرير الأسئلة الشائعة' }));

    const row = await screen.findByRole('button', { name: 'حذف كم يحتاج تجهيز الطلب من وقت؟' });
    fireEvent.click(row);
    fireEvent.click(await screen.findByRole('button', { name: 'حذف' }));

    // اختفى من المعاينة أيضاً، لا من النموذج فقط.
    await waitFor(() =>
      expect(within(canvas('الأسئلة الشائعة')).queryByText('كم يحتاج تجهيز الطلب من وقت؟')).toBeNull(),
    );
  });

  it('offers a mobile viewport', async () => {
    renderPage();

    await waitFor(() => expect(canvas('الواجهة الرئيسية')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'جوال' }));
    expect(screen.getByRole('button', { name: 'جوال' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/المعاينة بعرض 390 بكسل/)).toBeInTheDocument();
  });
});
