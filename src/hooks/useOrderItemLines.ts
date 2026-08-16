import { useMemo } from 'react';
import { usePublicStoreProducts } from '@/hooks/usePublicStore';
import type { StoreProduct } from '@/hooks/useCustomerStore';

/**
 * Recovers the product behind each order line so the order pages can show the
 * cake instead of listing it.
 *
 * None of the three customer RPCs return an image: `get_my_order_details`,
 * `get_my_orders` and `get_order_by_tracking_code` each build `items` from a
 * hardcoded `jsonb_build_object` of scalars with no join to `products`. So we
 * match on `product_name` against the public catalogue — the same join
 * `useReorder` already ships.
 *
 * `get_products_for_public_store` is SECURITY DEFINER and anon-executable, so
 * this works for guests on /track as well as signed-in customers, and it is
 * demo-mapped. Never block a render on it: while `products` is undefined every
 * line simply carries `product: null` and shows the branded fallback tile, then
 * upgrades in place with no layout shift when the query resolves.
 *
 * A miss is EXPECTED and must look intentional — renamed products, products
 * turned `is_active = false` (filtered out of the RPC), combo lines,
 * event/ضيافة lines and staff-typed free-text names all fall through. The real
 * fix is a follow-up migration adding `'product_id', oi.product_id` and
 * `'image_url', p.image_url` to the jsonb_build_object in all three RPCs with a
 * LEFT JOIN on products.
 */

export interface OrderLineInput {
  id?: string;
  product_name: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
}

export interface OrderLine extends OrderLineInput {
  product: StoreProduct | null;
}

export function useOrderItemLines(items: OrderLineInput[] | null | undefined) {
  const { data: products } = usePublicStoreProducts();

  return useMemo(() => {
    const byName = new Map((products ?? []).map((p) => [p.name.trim(), p]));
    const lines: OrderLine[] = (items ?? []).map((item) => ({
      ...item,
      product: byName.get(item.product_name.trim()) ?? null,
    }));
    const matched = lines
      .map((l) => l.product)
      .filter((p): p is StoreProduct => p !== null);

    return { lines, matched, matchedIds: matched.map((p) => p.id) };
  }, [products, items]);
}
