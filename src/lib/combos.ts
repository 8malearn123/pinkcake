import type { StoreProduct } from '@/hooks/useCustomerStore';
import { comboHeroSrc } from '@/lib/combosCatalog/doc';
import { MIN_COMBO_MEMBERS, type ComboItem } from '@/lib/combosCatalog/types';

/**
 * Turn the admin-authored combos into cards the storefront can render.
 *
 * Nothing about the money is stored: the price is derived from the members'
 * REAL catalogue prices and the combo's own discount, so the «وفّر» badge always
 * matches what the cart charges. A combo whose members have changed price since
 * it was authored reprices itself on the next render.
 */

export interface ResolvedCombo extends ComboItem {
  /** The hero to render — uploaded photo, else the pasted URL. */
  heroImage: string;
  members: StoreProduct[];
  price: number;
  original: number;
  save: number;
  pct: number;
}

/** Price a set of members at a given discount. Shared with the dashboard preview. */
export function priceCombo(members: readonly { price: number }[], discountPct: number) {
  const original = members.reduce((sum, member) => sum + member.price, 0);
  const price = Math.round(original * (1 - discountPct / 100));
  const save = original - price;
  return { original, price, save, pct: original > 0 ? Math.round((save / original) * 100) : 0 };
}

/**
 * Resolve combos against the live catalogue.
 *
 * Hidden combos never reach the storefront, members that are missing or sold out
 * are dropped, and a combo left with fewer than two members is skipped entirely
 * — a bundle of one isn't a bundle, and advertising a saving on it would be a
 * lie. When a combo disappears this way the dashboard flags it, so the silence
 * is never silent to staff.
 */
export function resolveCombos(
  defs: readonly ComboItem[],
  products: StoreProduct[] | undefined,
  isSoldOut: (p: StoreProduct) => boolean,
  urlFor: (imageId: string | null | undefined) => string | undefined,
): ResolvedCombo[] {
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const out: ResolvedCombo[] = [];
  for (const def of [...defs].sort((a, b) => a.displayOrder - b.displayOrder)) {
    if (!def.isActive) continue;
    const members = def.items
      .map((id) => byId.get(id))
      .filter((p): p is StoreProduct => !!p && !isSoldOut(p));
    if (members.length < MIN_COMBO_MEMBERS) continue;
    out.push({
      ...def,
      heroImage: comboHeroSrc(def, urlFor),
      members,
      ...priceCombo(members, def.discountPct),
    });
  }
  return out;
}

/**
 * Members that survive the catalogue lookup — what the dashboard needs to warn
 * that a combo is about to vanish from the storefront. Sold-out products still
 * count here: they come back in stock, a deleted product does not.
 */
export function resolvableMembers(
  def: ComboItem,
  products: readonly { id: string }[] | undefined,
): number {
  const ids = new Set((products ?? []).map((p) => p.id));
  return def.items.filter((id) => ids.has(id)).length;
}
