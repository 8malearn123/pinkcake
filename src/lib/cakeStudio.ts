/**
 * Cake studio — what survives the retirement of the CSS-art builder.
 *
 * The customizer's option catalog now comes from the photo-driven cake catalog
 * (`src/lib/cakeCatalog`); this module keeps the finish-step add-ons, the quick
 * messages, the PhotoCake price, the shape of a design as it rides on an order,
 * and a frozen label map so orders placed under the old hardcoded catalog stay
 * legible forever.
 */

export interface Addon {
  id: string;
  name: string;
  ds: string;
  add: number;
  icon: string;
}

export const ADDONS: Addon[] = [
  { id: 'candle', name: 'شمعة رقم', ds: 'شمعة على شكل الرقم', add: 10, icon: 'flame' },
  { id: 'topper', name: 'توبر مناسبة', ds: 'توبر أكريليك مذهّب', add: 20, icon: 'topper' },
];

export const QUICK_MESSAGES = ['كل عام وأنت بخير', 'مبروك', 'عيد ميلاد سعيد', 'بالتوفيق', 'ألف مبروك', 'أحبك'];

// Edible photo print add-on ("PhotoCake"), charged when the customer attaches an image.
export const PHOTO_PRINT_PRICE = 45;

/**
 * A design as it rides on a cart line / order. Carries ids AND Arabic labels:
 * the catalog is browser-local, so labels are what actually survive the device
 * boundary — the kitchen must be able to read the design with zero images.
 * Object URLs never enter this payload.
 */
export interface CartCakeDesign {
  v: 2;
  cakeId: string;
  cakeName: string;
  /** valueIds, index === level depth. */
  path: string[];
  /** Arabic value names, index-aligned with `path`. */
  pathLabels: string[];
  /** Arabic level names, index-aligned with `path`. */
  levelLabels: string[];
  /** Durable asset key (`imageStorageKey`) — the future CDN key. */
  photoKey: string;
  /** Local catalog image id; resolves only in the browser that authored it. */
  photoImageId?: string;
  text?: string;
  addons?: string[];
  photoPrint?: boolean;
}

/** The retired builder's shape: option IDS from the old hardcoded catalog. */
export interface LegacyCakeDesign {
  shape: string;
  flavor: string | null;
  color: string;
  design: string;
  text?: string;
  addons?: { candle: boolean; topper: boolean };
}

export type AnyCakeDesign = CartCakeDesign | LegacyCakeDesign;

export function isLegacyDesign(d: AnyCakeDesign): d is LegacyCakeDesign {
  return !('path' in d) && 'shape' in d;
}

/**
 * Frozen Arabic names of the retired hardcoded catalog, copied verbatim from
 * the deleted `cakeBuilder.ts` arrays. Paid orders reference these ids forever;
 * without this map their kitchen brief would render as raw ids or nothing.
 */
export const LEGACY_OPTION_LABELS: Record<'shape' | 'flavor' | 'color' | 'design' | 'addon', Record<string, string>> = {
  shape: {
    bento: 'بينتو ميني',
    classic: 'كلاسيكية',
    tier2: 'طابقين',
    tier3: 'ثلاث طوابق',
    cupcake: 'كب كيك',
    number: 'شكل رقم',
  },
  flavor: {
    vanilla: 'فانيليا بوربون',
    chocolate: 'شوكولاتة بلجيكية',
    saffron: 'زعفران وهيل',
    lotus: 'لوتس بسكوف',
    pistachio: 'فستق حلبي',
    redvelvet: 'ريد فيلفِت',
  },
  color: {
    ivory: 'عاجي',
    blush: 'وردي فاتح',
    rose: 'روز',
    nude: 'نود',
    sage: 'سيج',
    powder: 'أزرق هادئ',
    lilac: 'لافندر',
    cocoa: 'كاكاو',
  },
  design: {
    minimal: 'مينيمال',
    drip: 'دريب',
    pearls: 'لؤلؤ',
    berries: 'توت طازج',
    floral: 'ورد سكّري',
    gold: 'ورقة ذهب',
  },
  addon: {
    candle: 'شمعة رقم',
    topper: 'توبر مناسبة',
  },
};

/** Label a legacy id, falling back to the raw id so nothing renders blank. */
export function legacyLabel(kind: keyof typeof LEGACY_OPTION_LABELS, id: string | null | undefined): string {
  if (!id) return '—';
  return LEGACY_OPTION_LABELS[kind][id] ?? id;
}
