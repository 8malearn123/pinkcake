import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomCakes from '@/pages/CustomCakes';
import type { GalleryCake } from '@/lib/cakeSelect';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { storeName: 'Pink Cake' } }),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/contexts/StoreCartContext', () => ({
  useStoreCart: () => ({ count: 0, open: vi.fn() }),
}));

// The page derives its list through galleryCakes(catalog, urlFor); stubbing that
// pure selector keeps the test about the page, not about catalog filtering
// (which src/lib/__tests__/cakeSelect.test.ts already covers).
const cakes = vi.hoisted(() => ({ value: [] as GalleryCake[] }));
vi.mock('@/lib/cakeSelect', () => ({ galleryCakes: () => cakes.value }));
vi.mock('@/hooks/useCatalogSession', () => ({
  useCatalogSession: () => ({ status: 'ready', catalog: { levels: [], cakes: [], images: [] }, urlFor: () => undefined }),
}));

const gallery = (id: string, name: string, basePrice: number): GalleryCake => ({
  cake: { id, name, basePrice, serves: '6–8', leadTime: '24 ساعة', previewImageId: `img-${id}`, createdAt: 0 },
  previewUrl: `blob:${id}`,
});

// The page needs a react-query client for two reasons now: its masthead ticker
// reads the storefront promos (admin-authored in «التسويق»), and its footer reads
// the homepage section registry so it can drop links to switched-off sections.
// Retries off so a missing RPC resolves to the built-in fallback copy immediately.
const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CustomCakes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CustomCakes page', () => {
  beforeEach(() => {
    navigate.mockClear();
    cakes.value = [];
  });

  it('lists every designable cake — not just the three the home page shows', () => {
    cakes.value = [
      gallery('c1', 'احتفال كلاسيكي', 85),
      gallery('c2', 'قلب حلو', 60),
      gallery('c3', 'زفاف ملكي', 320),
      gallery('c4', 'عيد ميلاد', 120),
    ];
    renderPage();

    // Scoped to the grid — the footer carries its own «صمّم تورتة خاصة» link.
    const grid = within(screen.getByRole('main'));
    expect(grid.getAllByRole('button', { name: /^صمّم / })).toHaveLength(4);
    expect(screen.getByText('٤ تصميم جاهز للتخصيص')).toBeInTheDocument();
  });

  it('opens the studio pre-seeded with the picked cake', () => {
    cakes.value = [gallery('c1', 'احتفال كلاسيكي', 85)];
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'صمّم احتفال كلاسيكي' }));
    expect(navigate).toHaveBeenCalledWith('/customize', { state: { initial: { cakeId: 'c1' } } });
  });

  it('offers the catalogue as a fallback when nothing is designable yet', () => {
    renderPage();

    expect(screen.getByText('لا توجد تصاميم جاهزة بعد')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /تصفّح كل المنتجات/ }));
    expect(navigate).toHaveBeenCalledWith('/shop');
  });
});
