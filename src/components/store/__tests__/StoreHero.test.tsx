import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoreHero } from '@/components/store/StoreHero';
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
    render(<StoreHero onShop={noop} onCustomize={noop} featured={featured} onViewFeatured={onViewFeatured} />);

    const card = screen.getByRole('button', { name: `عرض ${featured.name}` });
    expect(card).toHaveTextContent('اختيار هذا الأسبوع');
    // Arabic-Indic digits, so the card can never advertise a price the product doesn't have
    expect(card).toHaveTextContent('١٤٥');

    fireEvent.click(card);
    expect(onViewFeatured).toHaveBeenCalledTimes(1);
  });

  it('omits the card entirely when there is no product to link to', () => {
    render(<StoreHero onShop={noop} onCustomize={noop} />);
    expect(screen.queryByText('اختيار هذا الأسبوع')).toBeNull();
  });
});
