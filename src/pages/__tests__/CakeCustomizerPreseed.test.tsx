import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CakeCustomizer from '@/pages/CakeCustomizer';
import { imagesByNodeKey } from '@/lib/cakeCatalog/catalog';
import type { Catalog } from '@/lib/cakeCatalog/types';

vi.mock('@/contexts/StoreCartContext', () => ({
  useStoreCart: () => ({ addToCart: vi.fn() }),
}));

const catalog: Catalog = {
  schemaVersion: 1,
  levels: [
    {
      id: 'lv-shape',
      name: 'الشكل',
      values: [
        { id: 'heart', name: 'قلب', priceDelta: 10, referenceImageId: null },
        { id: 'round', name: 'دائري', priceDelta: 0, referenceImageId: null },
      ],
    },
  ],
  cakes: [
    {
      id: 'c1',
      name: 'احتفال كلاسيكي',
      basePrice: 85,
      serves: '6–8',
      leadTime: '24 ساعة',
      previewImageId: 'img-preview',
      createdAt: 0,
    },
  ],
  images: [
    { id: 'img-preview', cakeId: 'c1', path: [], fileName: 'p.jpg', width: 1, height: 1, size: 1, createdAt: 0 },
    { id: 'img-heart', cakeId: 'c1', path: ['heart'], fileName: 'h.jpg', width: 1, height: 1, size: 1, createdAt: 0 },
  ],
};

vi.mock('@/hooks/useCatalogSession', () => ({
  useCatalogSession: () => ({
    status: 'ready',
    catalog,
    urlFor: (id?: string | null) => (id ? `blob:${id}` : undefined),
    byKey: imagesByNodeKey(catalog.images),
  }),
}));

const renderAt = (state?: unknown) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/customize', state }]}>
      <CakeCustomizer />
    </MemoryRouter>,
  );

/**
 * The storefront's designable-cake surfaces navigate with
 * `{ state: { initial: { cakeId } } }`. That seam existed in the studio with no
 * callers; these lock in that it actually skips the gallery, because a silent
 * regression there would look like nothing more than "the link still works".
 */
describe('CakeCustomizer pre-seed', () => {
  it('lands directly on the first design step for the passed cake', () => {
    renderAt({ initial: { cakeId: 'c1' } });

    expect(screen.getByRole('heading', { name: 'اختر الشكل' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'اختر كيكتك' })).toBeNull();
    // The picked cake's photographed option is on screen, not a generic gallery
    expect(screen.getByText('قلب')).toBeInTheDocument();
  });

  it('still opens the gallery when no cake was passed', () => {
    renderAt(undefined);

    expect(screen.getByRole('heading', { name: 'اختر كيكتك' })).toBeInTheDocument();
  });

  it('falls back to the gallery for a cake that no longer exists', () => {
    renderAt({ initial: { cakeId: 'deleted-cake' } });

    expect(screen.getByRole('heading', { name: 'اختر كيكتك' })).toBeInTheDocument();
  });
});
