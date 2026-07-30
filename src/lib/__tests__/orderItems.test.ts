import { describe, it, expect } from 'vitest';
import { toOrderItems } from '@/lib/orderItems';
import type { CartItem } from '@/hooks/useCustomerStore';
import type { CartCakeDesign } from '@/lib/cakeStudio';

const DESIGN: CartCakeDesign = {
  v: 2,
  cakeId: 'cake-1',
  cakeName: 'قلب حلو',
  path: ['v-shape', 'v-flavor'],
  pathLabels: ['قلب', 'شوكولاتة'],
  levelLabels: ['الشكل', 'النكهة'],
  photoKey: 'cake-cake-1--v-shape--v-flavor',
  text: 'مبروك',
  addons: ['candle'],
};

const plainItem = (): CartItem => ({
  product: {
    id: 'p1',
    name: 'كيكة الشوكولاتة الفاخرة',
    description: 'طبقات شوكولاتة بلجيكية',
    price: 145,
    category: 'كيكات',
    image_url: 'https://example.test/a.jpg',
  },
  quantity: 2,
});

const designedItem = (): CartItem => ({
  product: {
    id: 'custom-1738000000000',
    name: 'كيكة مخصّصة — قلب حلو',
    description: 'قلب حلو · قلب · شوكولاتة · «مبروك»',
    price: 95,
    category: 'تصميم خاص',
    image_url: null,
    cake_design: DESIGN,
  },
  quantity: 1,
});

describe('toOrderItems', () => {
  it('preserves the original four keys for a plain product', () => {
    const [line] = toOrderItems([plainItem()]);
    expect(line.product_id).toBe('p1');
    expect(line.product_name).toBe('كيكة الشوكولاتة الفاخرة');
    expect(line.quantity).toBe(2);
    expect(line.unit_price).toBe(145);
    expect(line.cake_design).toBeNull();
  });

  /**
   * The backend casts `product_id` to uuid; a designed cake's `custom-…` id
   * would make the whole order throw. Identity travels in cake_design.cakeId.
   */
  it('nulls product_id for a designed cake and carries the design', () => {
    const [line] = toOrderItems([designedItem()]);
    expect(line.product_id).toBeNull();
    expect(line.cake_design).toEqual(DESIGN);
  });

  // Before this module existed, the description holding the whole design
  // summary was silently dropped at the cart → items mapping.
  it('carries the description as notes', () => {
    const [plain, designed] = toOrderItems([plainItem(), designedItem()]);
    expect(plain.notes).toBe('طبقات شوكولاتة بلجيكية');
    expect(designed.notes).toBe('قلب حلو · قلب · شوكولاتة · «مبروك»');
  });

  it('handles a missing description without inventing one', () => {
    const item = plainItem();
    item.product.description = null;
    expect(toOrderItems([item])[0].notes).toBeNull();
  });

  it('maps an empty cart to an empty payload', () => {
    expect(toOrderItems([])).toEqual([]);
  });
});
