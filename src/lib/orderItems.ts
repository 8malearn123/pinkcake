/**
 * Cart → order-items payload, extracted from CartSheet so the exact shape the
 * backend receives is unit-testable without rendering the sheet.
 */

import type { CartItem } from '@/hooks/useCustomerStore';
import type { CartCakeDesign } from '@/lib/cakeStudio';

export interface OrderItemPayload {
  /**
   * Null for designed cakes: their cart ids are `custom-<timestamp>`, and the
   * backend's `(_item->>'product_id')::uuid` cast rejects those outright. The
   * design's identity travels in `cake_design.cakeId` instead.
   */
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  cake_design: CartCakeDesign | null;
  /**
   * The line's human-readable summary. For designed cakes the whole design
   * breadcrumb lives in `description` — before this module existed it was
   * silently dropped at exactly this mapping.
   */
  notes: string | null;
}

export function toOrderItems(cart: readonly CartItem[]): OrderItemPayload[] {
  return cart.map((item) => {
    const design = item.product.cake_design ?? null;
    return {
      product_id: design ? null : item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
      cake_design: design,
      notes: item.product.description ?? null,
    };
  });
}
