import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Store from '@/pages/Store';
import { DEFAULT_ORDER } from '@/lib/homepage/schema';
import type { HomepageSectionRow } from '@/lib/homepage/types';

/**
 * الوعد الأساسي للميزة: ما يرتّبه المدير ويُخفيه في `/homepage` هو ما يراه
 * الزبون على `/`. الاختبار يقود الصفحة من صفوف الأقسام مباشرة.
 */
const rows = vi.hoisted(() => ({ value: [] as HomepageSectionRow[] }));

vi.mock('@/lib/homepage/rpc', () => ({
  callHomepageRpc: vi.fn(async () => rows.value),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { storeName: 'Pink Cake' } }),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));

const cartStub = {
  cart: [],
  count: 0,
  isOpen: false,
  addToCart: vi.fn(),
  updateQuantity: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
};
vi.mock('@/contexts/StoreCartContext', () => ({
  useStoreCart: () => cartStub,
  useStoreCartOptional: () => cartStub,
}));
vi.mock('@/contexts/StoreWishlistContext', () => ({
  useStoreWishlist: () => ({ has: () => false, toggle: vi.fn() }),
}));

vi.mock('@/hooks/usePublicStore', () => ({
  usePublicStoreProducts: () => ({
    data: [
      { id: 'p1', name: 'تورتة الفراولة', description: '', price: 120, category: 'كيكات', image_url: null },
    ],
  }),
  isSoldOut: () => false,
}));
vi.mock('@/hooks/useProductRatings', () => ({ useProductRatings: () => ({ data: {} }) }));
// كتالوجا الكيك والكومبوهات فارغان، فقسماهما يُخفيان نفسيهما — وهو بالضبط ما
// يُثبت أن مفتاح الإظهار يحذف ولا يُظهر قسماً فارغاً.
vi.mock('@/hooks/useCombos', () => ({ useCombos: () => ({ combos: [], activeCombos: [], urlFor: () => undefined }) }));
vi.mock('@/hooks/useCatalogSession', () => ({
  useCatalogSession: () => ({ status: 'ready', catalog: { levels: [], cakes: [], images: [] }, urlFor: () => undefined }),
}));
vi.mock('@/lib/cakeSelect', () => ({ galleryCakes: () => [] }));

const row = (key: string, over: Partial<HomepageSectionRow> = {}): HomepageSectionRow => ({
  key: key as HomepageSectionRow['key'],
  is_visible: true,
  display_order: DEFAULT_ORDER[key as keyof typeof DEFAULT_ORDER],
  content: {},
  ...over,
});

const renderStore = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

/** معرّفات الأقسام بترتيب ظهورها في الـ DOM. */
const sectionOrder = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('section[id]')).map((el) => el.id);

beforeEach(() => {
  rows.value = [];
});

describe('Store renders from the homepage registry', () => {
  it('falls back to the shipped order and copy when no rows exist yet', async () => {
    const { container } = renderStore();

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('كل مناسبة تستحق كيكة مميزة.');
    expect(sectionOrder(container)).toEqual(['top', 'shop', 'events', 'branches', 'faq']);
  });

  it('drops a section the admin switched off', async () => {
    rows.value = [row('faq', { is_visible: false }), row('branches', { is_visible: false })];
    const { container } = renderStore();

    await waitFor(() => expect(sectionOrder(container)).not.toContain('faq'));
    expect(sectionOrder(container)).toEqual(['top', 'shop', 'events']);
    expect(screen.queryByText('الأسئلة الشائعة')).toBeNull();
  });

  it('follows the admin order', async () => {
    // الفروع قبل الشبكة، والأسئلة قبلهما.
    rows.value = [
      row('faq', { display_order: 3 }),
      row('branches', { display_order: 4 }),
      row('shop', { display_order: 5 }),
    ];
    const { container } = renderStore();

    await waitFor(() => expect(sectionOrder(container)[1]).toBe('faq'));
    expect(sectionOrder(container)).toEqual(['top', 'faq', 'branches', 'shop', 'events']);
  });

  it('renders edited copy in place of the shipped copy', async () => {
    rows.value = [row('hero', { content: { title: 'عنوان جديد من اللوحة' } })];
    renderStore();

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('عنوان جديد من اللوحة'),
    );
    // الحقول غير المحرَّرة تبقى على نصّها الأصلي — الدمج فوق الافتراضي.
    expect(screen.getByText(/تورتات طازجة بتصاميم أنيقة/)).toBeInTheDocument();
  });

  it('drops the nav link of a section it hid, so nothing scrolls nowhere', async () => {
    rows.value = [row('branches', { is_visible: false })];
    renderStore();

    await waitFor(() => expect(screen.queryByRole('button', { name: 'فروعنا' })).toBeNull());
    expect(screen.getAllByRole('button', { name: 'كل المنتجات' }).length).toBeGreaterThan(0);
  });

  it('hides an individual item without hiding its section', async () => {
    rows.value = [
      row('faq', {
        content: {
          eyebrow: 'قبل ما تطلب',
          title: 'الأسئلة الشائعة',
          items: [
            { q: 'سؤال ظاهر', a: 'إجابة ظاهرة', visible: true },
            { q: 'سؤال مخفي', a: 'إجابة مخفية', visible: false },
          ],
        },
      }),
    ];
    renderStore();

    await waitFor(() => expect(screen.getByText('سؤال ظاهر')).toBeInTheDocument());
    expect(screen.queryByText('سؤال مخفي')).toBeNull();
  });
});
