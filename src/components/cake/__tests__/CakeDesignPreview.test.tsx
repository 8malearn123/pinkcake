import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CakeDesignPreview } from '@/components/cake/CakeDesignPreview';
import type { CartCakeDesign, LegacyCakeDesign } from '@/lib/cakeStudio';

const urlForMock = vi.fn((imageId: string | null | undefined): string | undefined => undefined);

vi.mock('@/hooks/useCatalogSession', () => ({
  useCatalogSession: () => ({
    status: 'ready',
    catalog: { levels: [], cakes: [], images: [] },
    urlFor: (imageId: string | null | undefined) => urlForMock(imageId),
    byKey: new Map(),
  }),
}));

const legacyDesign: LegacyCakeDesign = {
  shape: 'tier3',
  flavor: 'vanilla',
  color: 'ivory',
  design: 'floral',
  text: 'مبارك الزواج',
  addons: { candle: false, topper: true },
};

const v2Design: CartCakeDesign = {
  v: 2,
  cakeId: 'demo-cake',
  cakeName: 'احتفال كلاسيكي',
  path: ['v-shape', 'v-flavor'],
  pathLabels: ['دائرية', 'شوكولاتة'],
  levelLabels: ['الشكل', 'النكهة'],
  photoKey: 'cake-demo-cake--v-shape--v-flavor',
  photoImageId: 'img-1',
  text: 'كل عام وأنت بخير',
  addons: ['candle'],
};

describe('CakeDesignPreview', () => {
  beforeEach(() => {
    urlForMock.mockReset();
    urlForMock.mockReturnValue(undefined);
  });

  it('renders nothing for a null design', () => {
    const { container } = render(<CakeDesignPreview design={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a legacy design as an Arabic text brief with no image', () => {
    render(<CakeDesignPreview design={legacyDesign} />);
    expect(screen.getByText('ثلاث طوابق')).toBeInTheDocument();
    expect(screen.getByText('فانيليا بوربون')).toBeInTheDocument();
    expect(screen.getByText('عاجي')).toBeInTheDocument();
    expect(screen.getByText('ورد سكّري')).toBeInTheDocument();
    expect(screen.getByText('توبر مناسبة')).toBeInTheDocument();
    expect(screen.getByText('«مبارك الزواج»')).toBeInTheDocument();
    expect(screen.getByText(/النظام السابق/)).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('renders the resolved photo with the breadcrumb for a v2 design', () => {
    urlForMock.mockReturnValue('blob:fake-cake-photo');
    render(<CakeDesignPreview design={v2Design} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'blob:fake-cake-photo');
    expect(urlForMock).toHaveBeenCalledWith('img-1');
    expect(screen.getByText('احتفال كلاسيكي · دائرية · شوكولاتة')).toBeInTheDocument();
    expect(screen.getByText('شمعة رقم')).toBeInTheDocument();
  });

  it('falls back to the text brief with the photoKey when the photo does not resolve', () => {
    render(<CakeDesignPreview design={v2Design} />);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('الشكل')).toBeInTheDocument();
    expect(screen.getByText('دائرية')).toBeInTheDocument();
    expect(screen.getByText('النكهة')).toBeInTheDocument();
    expect(screen.getByText('شوكولاتة')).toBeInTheDocument();
    expect(screen.getByText(/غير متوفرة/)).toBeInTheDocument();
    expect(screen.getByText('cake-demo-cake--v-shape--v-flavor')).toBeInTheDocument();
  });

  it('does not throw on a malformed v2 payload missing its label arrays', () => {
    const malformed = {
      v: 2,
      cakeId: 'x',
      cakeName: 'كيكة',
      path: ['a'],
      photoKey: 'cake-x--a',
    } as unknown as CartCakeDesign;
    expect(() => render(<CakeDesignPreview design={malformed} />)).not.toThrow();
    expect(screen.getByText(/غير متوفرة/)).toBeInTheDocument();
  });
});
