/**
 * Combos catalog — the starting set.
 *
 * These are the three combos the storefront shipped hardcoded (they used to
 * live in `src/lib/combos.ts`), reproduced verbatim so a fresh browser renders
 * exactly what the site rendered before combos became editable. Staff now own
 * them: rename, reprice, repoint at real products, replace the stock photos.
 *
 * Note the member ids (`p1`…`p6`) — those are the DEMO catalogue's ids. Against
 * a real Supabase catalogue product ids are UUIDs, so these seeds resolve to
 * nothing and the dashboard flags them as «لن يظهر في المتجر» until someone
 * picks real products. That is the intended prompt, not a bug.
 */

import { COMBOS_SCHEMA_VERSION, type CombosDoc, type ComboItem } from './types';

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=600&q=85`;

type SeedSpec = Omit<ComboItem, 'id' | 'createdAt' | 'displayOrder' | 'heroImageId'>;

const SEEDS: SeedSpec[] = [
  {
    name: 'كومبو العائلة',
    tagline: 'لمّة العيلة تكتمل بالحلا',
    items: ['p4', 'p6', 'p2'],
    discountPct: 15,
    accent: '#8d4955',
    heroImageUrl: unsplash('1470124182917-cc6e71b22ecc'),
    best: false,
    isActive: true,
  },
  {
    name: 'كومبو الصيف بالمنجا 🥭',
    tagline: 'موسم منجا جازان كامل',
    items: ['p2', 'p6', 'p1'],
    discountPct: 15,
    accent: '#e8942f',
    heroImageUrl: unsplash('1542826438-bd32f43d626f'),
    best: true,
    isActive: true,
  },
  {
    name: 'كومبو عيد الميلاد',
    tagline: 'احتفال متكامل بضغطة واحدة',
    items: ['p1', 'p3', 'p4'],
    discountPct: 15,
    accent: '#612e37',
    heroImageUrl: unsplash('1677840147140-252adb9ca347'),
    best: false,
    isActive: true,
  },
];

export function buildSeedDoc(makeId: () => string, now: number = Date.now()): CombosDoc {
  return {
    schemaVersion: COMBOS_SCHEMA_VERSION,
    combos: SEEDS.map((seed, index) => ({
      ...seed,
      id: makeId(),
      heroImageId: null,
      displayOrder: index,
      createdAt: now,
    })),
  };
}
