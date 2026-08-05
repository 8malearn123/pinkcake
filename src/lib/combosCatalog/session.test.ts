/**
 * Combos session — the write path staff actually drive, end to end.
 *
 * These exercise the real singleton (boot → mutate → persist → publish) over an
 * injected store, then run the result through `resolveCombos` exactly as the
 * storefront does. That is the seam where a dashboard edit becomes a card on the
 * home page, so it is worth asserting as one flow rather than two halves.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as session from './session';
import {
  addCombo,
  deleteCombo,
  orderedCombos,
  reorderCombos,
  setActive,
  setBest,
  setHeroImage,
} from './doc';
import { createMemoryCombosStore } from './store';
import type { ComboDraft } from './types';
import { resolveCombos } from '@/lib/combos';
import type { StoreProduct } from '@/hooks/useCustomerStore';

const CATALOGUE: StoreProduct[] = [
  { id: 'p1', name: 'كيكة', description: null, price: 100, category: 'كيكات', image_url: null },
  { id: 'p2', name: 'تشيز كيك', description: null, price: 60, category: 'كيكات', image_url: null },
  { id: 'p3', name: 'ماكرون', description: null, price: 40, category: 'حلويات', image_url: null },
];

const isSoldOut = (p: StoreProduct) => p.is_available === false || p.stock === 0;

function draft(overrides: Partial<ComboDraft> = {}): ComboDraft {
  return {
    name: 'كومبو جديد',
    tagline: 'من الاختبار',
    items: ['p1', 'p2'],
    discountPct: 20,
    accent: '#123456',
    best: false,
    isActive: true,
    ...overrides,
  };
}

/** What the storefront would render right now. */
function storefront() {
  const { doc, urls } = session.getSnapshot();
  return resolveCombos(
    orderedCombos(doc),
    CATALOGUE,
    isSoldOut,
    (id) => (id ? urls[id] : undefined),
  );
}

let store: ReturnType<typeof createMemoryCombosStore>;

beforeEach(async () => {
  store = createMemoryCombosStore();
  session.__resetSessionForTests(store);
  await session.ensureLoaded();
});

afterEach(() => {
  session.__resetSessionForTests();
});

describe('boot', () => {
  it('comes up ready with the seeded combos', () => {
    const snapshot = session.getSnapshot();

    expect(snapshot.status).toBe('ready');
    expect(snapshot.doc.combos).toHaveLength(3);
  });

  it('publishes to subscribers on every write', async () => {
    let notifications = 0;
    const unsubscribe = session.subscribe(() => void notifications++);

    await session.mutate((doc) => addCombo(doc, draft()));

    expect(notifications).toBeGreaterThan(0);
    unsubscribe();
  });

  it('drops seeded combos whose member ids this catalogue lacks', () => {
    // The seeds carry demo ids (p1…p6); this catalogue only has p1..p3, so
    // «كومبو العائلة» (p4, p6, p2) keeps one member and is dropped, while the
    // other two keep two. This is the go-live case the dashboard flags.
    const rendered = storefront();

    expect(rendered.map((c) => c.name)).toEqual([
      'كومبو الصيف بالمنجا 🥭',
      'كومبو عيد الميلاد',
    ]);
    expect(rendered.every((c) => c.members.length >= 2)).toBe(true);
  });

  it('renders nothing at all when no seeded member exists in the catalogue', () => {
    const uuidCatalogue: StoreProduct[] = [
      { id: 'uuid-a', name: 'أ', description: null, price: 10, category: null, image_url: null },
      { id: 'uuid-b', name: 'ب', description: null, price: 10, category: null, image_url: null },
    ];

    const { doc } = session.getSnapshot();
    expect(resolveCombos(orderedCombos(doc), uuidCatalogue, isSoldOut, () => undefined)).toEqual([]);
  });
});

describe('the dashboard → storefront flow', () => {
  it('a created combo appears on the storefront, priced from live members', async () => {
    const outcome = await session.mutate((doc) =>
      addCombo(doc, draft({ items: ['p1', 'p2', 'p3'], discountPct: 25 })),
    );
    expect(outcome.ok).toBe(true);

    const card = storefront().find((c) => c.name === 'كومبو جديد');

    expect(card).toBeDefined();
    expect(card?.original).toBe(200);
    expect(card?.price).toBe(150);
    expect(card?.save).toBe(50);
  });

  it('hiding a combo removes its card without deleting it', async () => {
    await session.mutate((doc) => addCombo(doc, draft()));
    const id = session.getSnapshot().doc.combos.at(-1)!.id;

    await session.mutate((doc) => setActive(doc, id, false));

    expect(storefront().some((c) => c.id === id)).toBe(false);
    expect(session.getSnapshot().doc.combos.some((c) => c.id === id)).toBe(true);
  });

  it('marking a combo best leaves exactly one featured card', async () => {
    await session.mutate((doc) => addCombo(doc, draft()));
    const id = session.getSnapshot().doc.combos.at(-1)!.id;

    await session.mutate((doc) => setBest(doc, id));

    const featured = storefront().filter((c) => c.best);
    expect(featured).toHaveLength(1);
    expect(featured[0].id).toBe(id);
  });

  it('reordering changes the storefront order', async () => {
    const before = session.getSnapshot().doc.combos.map((c) => c.id);

    await session.mutate((doc) => reorderCombos(doc, [...before].reverse()));

    expect(session.getSnapshot().doc.combos.map((c) => c.id)).toEqual([...before].reverse());
  });

  it('hiding every combo empties the band', async () => {
    for (const combo of session.getSnapshot().doc.combos) {
      await session.mutate((doc) => setActive(doc, combo.id, false));
    }

    expect(storefront()).toEqual([]);
  });

  it('a combo edited down to one resolvable member stops rendering', async () => {
    await session.mutate((doc) => addCombo(doc, draft({ items: ['p1', 'ghost'] })));
    const id = session.getSnapshot().doc.combos.at(-1)!.id;

    expect(storefront().some((c) => c.id === id)).toBe(false);
  });
});

describe('persistence', () => {
  it('survives a reload — a fresh session over the same backing', async () => {
    await session.mutate((doc) => addCombo(doc, draft({ name: 'يبقى بعد التحديث' })));

    // Same store object = same localStorage + IndexedDB, new session state.
    session.__resetSessionForTests(store);
    await session.ensureLoaded();

    expect(session.getSnapshot().doc.combos.some((c) => c.name === 'يبقى بعد التحديث')).toBe(true);
  });

  it('a deletion survives a reload too', async () => {
    const id = session.getSnapshot().doc.combos[0].id;
    await session.mutate((doc) => deleteCombo(doc, id));

    session.__resetSessionForTests(store);
    await session.ensureLoaded();

    expect(session.getSnapshot().doc.combos).toHaveLength(2);
  });

  it('resetSession restores the shipped three', async () => {
    await session.mutate((doc) => deleteCombo(doc, session.getSnapshot().doc.combos[0].id));
    await session.mutate((doc) => addCombo(doc, draft()));

    const outcome = await session.resetSession();

    expect(outcome.ok).toBe(true);
    expect(session.getSnapshot().doc.combos).toHaveLength(3);
    expect(session.getSnapshot().doc.combos.some((c) => c.name === 'كومبو جديد')).toBe(false);
  });
});

describe('write ordering', () => {
  it('serialises concurrent mutations instead of losing one', async () => {
    // Fired without awaiting between them: each builder must see the previous
    // result, which is exactly what the queue guarantees.
    await Promise.all([
      session.mutate((doc) => addCombo(doc, draft({ name: 'أ' }))),
      session.mutate((doc) => addCombo(doc, draft({ name: 'ب' }))),
      session.mutate((doc) => addCombo(doc, draft({ name: 'ج' }))),
    ]);

    const names = session.getSnapshot().doc.combos.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['أ', 'ب', 'ج']));
    expect(session.getSnapshot().doc.combos).toHaveLength(6);
  });

  it('a hero upload lands with its combo in one write', async () => {
    const file = new File(['bytes'], 'hero.jpg', { type: 'image/jpeg' });
    const id = 'fixed-id';

    const outcome = await session.mutateWithImage(file, (doc, saved) => {
      const added = addCombo(doc, draft({ items: ['p1', 'p2'] }), () => id);
      return setHeroImage(added.doc, id, saved.id);
    });

    expect(outcome.ok).toBe(true);
    const combo = session.getSnapshot().doc.combos.find((c) => c.id === id);
    expect(combo?.heroImageId).not.toBeNull();
    expect(storefront().find((c) => c.id === id)?.heroImage).toMatch(/^blob:/);
  });

  it('replacing a hero frees the previous blob', async () => {
    const id = 'fixed-id';
    const first = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    const second = new File(['b'], 'b.jpg', { type: 'image/jpeg' });

    await session.mutateWithImage(first, (doc, saved) => {
      const added = addCombo(doc, draft(), () => id);
      return setHeroImage(added.doc, id, saved.id);
    });
    const firstImageId = session.getSnapshot().doc.combos.find((c) => c.id === id)!.heroImageId!;

    await session.mutateWithImage(second, (doc, saved) => setHeroImage(doc, id, saved.id));

    const urls = session.getSnapshot().urls;
    expect(urls[firstImageId]).toBeUndefined();
    expect(session.getSnapshot().doc.combos.find((c) => c.id === id)!.heroImageId).not.toBe(
      firstImageId,
    );
  });
});
