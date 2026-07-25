import type { StoreProduct } from '@/hooks/useCustomerStore';

/**
 * Combo definitions cloned from the Cake & Bloom design (names, taglines, hero
 * images, accents, "best"), with member ids mapped to our catalogue. Price is
 * derived from the members' real prices so the "وفّر" saving is honest.
 */
export interface ComboDef {
  id: string;
  name: string;
  tagline: string;
  items: string[];
  heroImage: string;
  accent: string;
  best?: boolean;
}

export const COMBO_DEFS: ComboDef[] = [
  { id: 'family', name: 'كومبو العائلة', tagline: 'لمّة العيلة تكتمل بالحلا', items: ['p4', 'p6', 'p2'], accent: '#b0506e', heroImage: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=800&h=600&q=85' },
  { id: 'mango', name: 'كومبو الصيف بالمنجا 🥭', tagline: 'موسم منجا جازان كامل', items: ['p2', 'p6', 'p1'], accent: '#e8942f', best: true, heroImage: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=800&h=600&q=85' },
  { id: 'birthday', name: 'كومبو عيد الميلاد', tagline: 'احتفال متكامل بضغطة واحدة', items: ['p1', 'p3', 'p4'], accent: '#9e3a5c', heroImage: 'https://images.unsplash.com/photo-1677840147140-252adb9ca347?auto=format&fit=crop&w=800&h=600&q=85' },
];

export interface ResolvedCombo extends ComboDef {
  members: StoreProduct[];
  price: number;
  original: number;
  save: number;
  pct: number;
}

/** Resolve combos against the live catalogue; drop members that are missing or sold out. */
export function resolveCombos(
  products: StoreProduct[] | undefined,
  isSoldOut: (p: StoreProduct) => boolean,
): ResolvedCombo[] {
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const out: ResolvedCombo[] = [];
  for (const def of COMBO_DEFS) {
    const members = def.items.map((id) => byId.get(id)).filter((p): p is StoreProduct => !!p && !isSoldOut(p));
    if (members.length < 2) continue;
    const original = members.reduce((s, m) => s + m.price, 0);
    const price = Math.round(original * 0.85);
    const save = original - price;
    out.push({ ...def, members, original, price, save, pct: Math.round((save / original) * 100) });
  }
  return out;
}
