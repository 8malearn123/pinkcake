import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoreHero } from '@/components/store/StoreHero';
import { SECTION_DEFAULTS } from '@/lib/homepage/schema';
import type { StoreProduct } from '@/hooks/useCustomerStore';

const featured: StoreProduct = {
  id: 'p1',
  name: 'كيكة الشوكولاتة الفاخرة',
  description: 'طبقات شوكولاتة بلجيكية مع كريمة الغاناش',
  price: 145,
  category: 'كيكات',
  image_url: null,
};

const noop = () => {};

describe('StoreHero featured pick', () => {
  it('renders the real product name and price, and opens it on click', () => {
    const onViewFeatured = vi.fn();
    render(<StoreHero onCta={noop} featured={featured} onViewFeatured={onViewFeatured} />);

    const card = screen.getByRole('button', { name: `عرض ${featured.name}` });
    expect(card).toHaveTextContent('اختيار هذا الأسبوع');
    // Arabic-Indic digits, so the card can never advertise a price the product doesn't have
    expect(card).toHaveTextContent('١٤٥');

    fireEvent.click(card);
    expect(onViewFeatured).toHaveBeenCalledTimes(1);
  });

  it('omits the card entirely when there is no product to link to', () => {
    render(<StoreHero onCta={noop} />);
    expect(screen.queryByText('اختيار هذا الأسبوع')).toBeNull();
  });
});

describe('StoreHero content', () => {
  it('falls back to the shipped copy when no content is supplied', () => {
    render(<StoreHero onCta={noop} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('كل مناسبة تستحق كيكة مميزة.');
  });

  it('renders the admin copy and routes each CTA to its own target', () => {
    const onCta = vi.fn();
    render(
      <StoreHero
        onCta={onCta}
        content={{
          ...SECTION_DEFAULTS.hero,
          title: 'عنوان من اللوحة',
          primaryCta: { label: 'زر أول', target: '#combos', visible: true },
          secondaryCta: { label: 'زر ثانٍ', target: '/events', visible: true },
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'زر أول' }));
    fireEvent.click(screen.getByRole('button', { name: 'زر ثانٍ' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('عنوان من اللوحة');
    expect(onCta).toHaveBeenNthCalledWith(1, '#combos');
    expect(onCta).toHaveBeenNthCalledWith(2, '/events');
  });

  it('drops a CTA the admin switched off', () => {
    render(
      <StoreHero
        onCta={noop}
        content={{
          ...SECTION_DEFAULTS.hero,
          secondaryCta: { ...SECTION_DEFAULTS.hero.secondaryCta, visible: false },
        }}
      />,
    );
    expect(screen.queryByRole('button', { name: 'صمم تورتة خاصة' })).toBeNull();
  });
});
