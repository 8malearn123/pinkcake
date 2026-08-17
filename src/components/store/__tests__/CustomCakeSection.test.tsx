import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CustomCakeSection } from '@/components/store/CustomCakeSection';
import type { GalleryCake } from '@/lib/cakeSelect';

const cake = (id: string, name: string, basePrice: number): GalleryCake => ({
  cake: {
    id,
    name,
    basePrice,
    serves: '6–8',
    leadTime: '24 ساعة',
    previewImageId: `img-${id}`,
    createdAt: 0,
  },
  previewUrl: `blob:${id}`,
});

const five: GalleryCake[] = [
  cake('c1', 'احتفال كلاسيكي', 85),
  cake('c2', 'قلب حلو', 60),
  cake('c3', 'زفاف ملكي', 320),
  cake('c4', 'عيد ميلاد', 120),
  cake('c5', 'تخرّج', 150),
];

const noop = () => {};

describe('CustomCakeSection', () => {
  it('shows only the first three cakes, priced in Arabic-Indic digits', () => {
    render(<CustomCakeSection cakes={five} loading={false} onPick={noop} onCta={noop} />);

    expect(screen.getByRole('button', { name: 'صمّم احتفال كلاسيكي' })).toHaveTextContent('٨٥');
    expect(screen.getByRole('button', { name: 'صمّم قلب حلو' })).toHaveTextContent('٦٠');
    expect(screen.getByRole('button', { name: 'صمّم زفاف ملكي' })).toHaveTextContent('٣٢٠');
    // The remaining two live behind "view all", not on the home page
    expect(screen.queryByRole('button', { name: 'صمّم عيد ميلاد' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'صمّم تخرّج' })).toBeNull();
  });

  it('hands the picked cake id up so the studio can be pre-seeded', () => {
    const onPick = vi.fn();
    render(<CustomCakeSection cakes={five} loading={false} onPick={onPick} onCta={noop} />);

    fireEvent.click(screen.getByRole('button', { name: 'صمّم قلب حلو' }));
    expect(onPick).toHaveBeenCalledWith('c2');
  });

  it('routes the single CTA to the target the admin picked', () => {
    const onCta = vi.fn();
    render(<CustomCakeSection cakes={five} loading={false} onPick={noop} onCta={onCta} />);

    fireEvent.click(screen.getByRole('button', { name: /شاهد كل التصاميم/ }));
    expect(onCta).toHaveBeenCalledWith('/custom-cakes');
  });

  it('renders nothing when there is no designable cake to advertise', () => {
    const { container } = render(
      <CustomCakeSection cakes={[]} loading={false} onPick={noop} onCta={noop} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('holds the layout with placeholders while the catalog hydrates', () => {
    // An empty-but-loading catalog must not collapse the section: it sits right
    // under the hero, so a late pop-in would shove the fold.
    const { container } = render(
      <CustomCakeSection cakes={[]} loading onPick={noop} onCta={noop} />,
    );
    expect(container).not.toBeEmptyDOMElement();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('صمّم كيكتك');
    expect(screen.queryByRole('button', { name: /^صمّم .+/ })).toBeNull();
  });
});
