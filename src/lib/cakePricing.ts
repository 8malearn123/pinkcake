/**
 * Cake studio — one computation for the whole price.
 *
 * The old studio's summary card hand-rendered four rows while the total came
 * from a separate `price()` call — two sources that could disagree silently.
 * `lines` and `total` now come out of the same pass, and a unit test pins
 * `sum(lines) === total`.
 */

import { ADDONS, PHOTO_PRINT_PRICE } from './cakeStudio';
import type { CatalogCake, CatalogLevel } from '@/lib/cakeCatalog/types';

export interface PriceLine {
  key: string;
  label: string;
  amount: number;
}

export interface StudioPrice {
  base: number;
  options: number;
  addons: number;
  photo: number;
  total: number;
  lines: PriceLine[];
}

export function priceStudio(input: {
  cake: CatalogCake | null;
  levels: readonly CatalogLevel[];
  path: readonly string[];
  addons: Record<string, boolean>;
  hasPhoto: boolean;
}): StudioPrice {
  const { cake, levels, path, addons, hasPhoto } = input;
  const lines: PriceLine[] = [];

  const base = cake?.basePrice ?? 0;
  if (cake) lines.push({ key: 'base', label: cake.name, amount: base });

  let options = 0;
  path.forEach((valueId, depth) => {
    const level = levels[depth];
    const value = level?.values.find((v) => v.id === valueId);
    // An unknown id contributes 0, never NaN — cascades can outdate a pick.
    if (!value) return;
    options += value.priceDelta;
    if (value.priceDelta !== 0) {
      lines.push({ key: `option:${valueId}`, label: `${level.name} — ${value.name}`, amount: value.priceDelta });
    }
  });

  let addonsTotal = 0;
  for (const addon of ADDONS) {
    if (!addons[addon.id]) continue;
    addonsTotal += addon.add;
    lines.push({ key: `addon:${addon.id}`, label: addon.name, amount: addon.add });
  }

  const photo = hasPhoto ? PHOTO_PRINT_PRICE : 0;
  if (photo) lines.push({ key: 'photo', label: 'طباعة صورة صالحة للأكل', amount: photo });

  return { base, options, addons: addonsTotal, photo, total: base + options + addonsTotal + photo, lines };
}
