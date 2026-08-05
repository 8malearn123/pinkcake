/**
 * Combos doc — the pure mutation layer.
 *
 * These are the invariants the dashboard relies on but never enforces itself:
 * exactly one «الأكثر توفيراً», a dense display order, and an orphaned hero blob
 * reported on every path that could strand one. Nothing here touches storage or
 * React, so a regression shows up as a failing assertion rather than a lost
 * photo in someone's browser.
 */

import { describe, expect, it } from 'vitest';
import {
  addCombo,
  chain,
  clearHeroImage,
  comboHeroSrc,
  deleteCombo,
  emptyDoc,
  isCombosDocShape,
  orderedCombos,
  repairDoc,
  reorderCombos,
  setActive,
  setBest,
  setHeroImage,
  updateCombo,
} from './doc';
import { buildSeedDoc } from './seed';
import { COMBOS_SCHEMA_VERSION, type ComboDraft, type CombosDoc } from './types';

function draft(overrides: Partial<ComboDraft> = {}): ComboDraft {
  return {
    name: 'كومبو تجريبي',
    tagline: 'وصف',
    items: ['p1', 'p2'],
    discountPct: 15,
    accent: '#9e3a5c',
    isActive: true,
    best: false,
    ...overrides,
  };
}

/** Sequential ids so assertions can name the combo they mean. */
function idFactory() {
  let n = 0;
  return () => `c${++n}`;
}

function docWith(...drafts: ComboDraft[]): CombosDoc {
  const makeId = idFactory();
  return drafts.reduce((acc, d) => addCombo(acc, d, makeId).doc, emptyDoc());
}

describe('addCombo', () => {
  it('appends with a dense display order and trims the copy', () => {
    const doc = docWith(draft({ name: '  أول  ' }), draft({ name: 'ثاني' }));

    expect(doc.combos.map((c) => c.name)).toEqual(['أول', 'ثاني']);
    expect(doc.combos.map((c) => c.displayOrder)).toEqual([0, 1]);
  });

  it('clamps a discount outside 0..90', () => {
    const high = docWith(draft({ discountPct: 150 }));
    const low = docWith(draft({ discountPct: -20 }));

    expect(high.combos[0].discountPct).toBe(90);
    expect(low.combos[0].discountPct).toBe(0);
  });

  it('normalises an empty hero url to null rather than an empty string', () => {
    const doc = docWith(draft({ heroImageUrl: '   ' }));
    expect(doc.combos[0].heroImageUrl).toBeNull();
  });

  it('unseats the incumbent when the new combo claims best', () => {
    const first = docWith(draft({ best: true }));
    const both = addCombo(first, draft({ name: 'ثاني', best: true }), () => 'c2').doc;

    expect(both.combos.filter((c) => c.best).map((c) => c.id)).toEqual(['c2']);
  });
});

describe('updateCombo', () => {
  it('grants best to one combo and strips it from every other', () => {
    const doc = docWith(draft({ best: true }), draft({ name: 'ثاني' }), draft({ name: 'ثالث' }));

    const { doc: next } = updateCombo(doc, 'c3', draft({ name: 'ثالث', best: true }));

    expect(next.combos.filter((c) => c.best).map((c) => c.id)).toEqual(['c3']);
  });

  it('leaves nobody best when the incumbent gives it up', () => {
    const doc = docWith(draft({ best: true }), draft({ name: 'ثاني' }));

    const { doc: next } = updateCombo(doc, 'c1', draft({ best: false }));

    expect(next.combos.some((c) => c.best)).toBe(false);
  });

  it('does not disturb best when a non-best combo is edited', () => {
    const doc = docWith(draft({ best: true }), draft({ name: 'ثاني' }));

    const { doc: next } = updateCombo(doc, 'c2', draft({ name: 'ثاني معدّل', best: false }));

    expect(next.combos.find((c) => c.id === 'c1')?.best).toBe(true);
    expect(next.combos.find((c) => c.id === 'c2')?.name).toBe('ثاني معدّل');
  });

  it('keeps the uploaded hero when the draft omits heroImageUrl', () => {
    const doc = setHeroImage(docWith(draft()), 'c1', 'img-1').doc;
    const withUrl = updateCombo(doc, 'c1', draft({ heroImageUrl: 'https://x/y.jpg' })).doc;

    const patched = updateCombo(withUrl, 'c1', { ...draft(), heroImageUrl: undefined }).doc;

    expect(patched.combos[0].heroImageUrl).toBe('https://x/y.jpg');
    expect(patched.combos[0].heroImageId).toBe('img-1');
  });

  it('is a no-op for an unknown id', () => {
    const doc = docWith(draft());
    const { doc: next } = updateCombo(doc, 'missing', draft({ name: 'شيء آخر' }));

    expect(next.combos).toHaveLength(1);
    expect(next.combos[0].name).toBe('كومبو تجريبي');
  });
});

describe('deleteCombo', () => {
  it('reports the hero blob it stranded and re-densifies the order', () => {
    let doc = docWith(draft(), draft({ name: 'ثاني' }), draft({ name: 'ثالث' }));
    doc = setHeroImage(doc, 'c2', 'img-2').doc;

    const { doc: next, deadImageIds } = deleteCombo(doc, 'c2');

    expect(deadImageIds).toEqual(['img-2']);
    expect(next.combos.map((c) => c.id)).toEqual(['c1', 'c3']);
    expect(next.combos.map((c) => c.displayOrder)).toEqual([0, 1]);
  });

  it('reports nothing for a combo that only had a url hero', () => {
    const doc = docWith(draft({ heroImageUrl: 'https://x/y.jpg' }));
    expect(deleteCombo(doc, 'c1').deadImageIds).toEqual([]);
  });

  it('is a no-op for an unknown id', () => {
    const doc = docWith(draft());
    expect(deleteCombo(doc, 'missing').doc.combos).toHaveLength(1);
  });
});

describe('hero images', () => {
  it('reports the replaced blob when a new hero is set', () => {
    const doc = setHeroImage(docWith(draft()), 'c1', 'img-1').doc;

    const { doc: next, deadImageIds } = setHeroImage(doc, 'c1', 'img-2');

    expect(deadImageIds).toEqual(['img-1']);
    expect(next.combos[0].heroImageId).toBe('img-2');
  });

  it('reports nothing when the same hero is set twice', () => {
    const doc = setHeroImage(docWith(draft()), 'c1', 'img-1').doc;
    expect(setHeroImage(doc, 'c1', 'img-1').deadImageIds).toEqual([]);
  });

  it('clearing falls back to the url without losing it', () => {
    let doc = docWith(draft({ heroImageUrl: 'https://x/y.jpg' }));
    doc = setHeroImage(doc, 'c1', 'img-1').doc;

    const { doc: next, deadImageIds } = clearHeroImage(doc, 'c1');

    expect(deadImageIds).toEqual(['img-1']);
    expect(next.combos[0].heroImageId).toBeNull();
    expect(comboHeroSrc(next.combos[0], () => undefined)).toBe('https://x/y.jpg');
  });

  it('prefers the uploaded blob over the url', () => {
    const doc = setHeroImage(docWith(draft({ heroImageUrl: 'https://x/y.jpg' })), 'c1', 'img-1').doc;

    expect(comboHeroSrc(doc.combos[0], (id) => (id === 'img-1' ? 'blob:live' : undefined))).toBe(
      'blob:live',
    );
  });

  it('resolves to an empty string when a combo has no image at all', () => {
    const doc = docWith(draft());
    expect(comboHeroSrc(doc.combos[0], () => undefined)).toBe('');
  });
});

describe('setBest / setActive', () => {
  it('setBest(null) clears the flag everywhere', () => {
    const doc = docWith(draft({ best: true }), draft({ name: 'ثاني' }));
    expect(setBest(doc, null).doc.combos.some((c) => c.best)).toBe(false);
  });

  it('setActive toggles just the target', () => {
    const doc = docWith(draft(), draft({ name: 'ثاني' }));
    const { doc: next } = setActive(doc, 'c1', false);

    expect(next.combos.find((c) => c.id === 'c1')?.isActive).toBe(false);
    expect(next.combos.find((c) => c.id === 'c2')?.isActive).toBe(true);
  });
});

describe('reorderCombos', () => {
  it('applies the requested order and renumbers', () => {
    const doc = docWith(draft(), draft({ name: 'ثاني' }), draft({ name: 'ثالث' }));

    const { doc: next } = reorderCombos(doc, ['c3', 'c1', 'c2']);

    expect(next.combos.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);
    expect(next.combos.map((c) => c.displayOrder)).toEqual([0, 1, 2]);
  });

  it('keeps combos the caller forgot instead of dropping them', () => {
    const doc = docWith(draft(), draft({ name: 'ثاني' }), draft({ name: 'ثالث' }));

    const { doc: next } = reorderCombos(doc, ['c3']);

    expect(next.combos.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);
  });

  it('ignores ids the doc does not know', () => {
    const doc = docWith(draft(), draft({ name: 'ثاني' }));

    const { doc: next } = reorderCombos(doc, ['ghost', 'c2', 'c1']);

    expect(next.combos.map((c) => c.id)).toEqual(['c2', 'c1']);
  });
});

describe('chain', () => {
  it('accumulates the orphans of both mutations', () => {
    const doc = setHeroImage(docWith(draft(), draft({ name: 'ثاني' })), 'c1', 'img-1').doc;
    const withSecond = setHeroImage(doc, 'c2', 'img-2').doc;

    const result = chain(deleteCombo(withSecond, 'c1'), (d) => setHeroImage(d, 'c2', 'img-3'));

    expect(result.deadImageIds).toEqual(['img-1', 'img-2']);
    expect(result.doc.combos.map((c) => c.id)).toEqual(['c2']);
  });
});

describe('repairDoc', () => {
  it('drops a hero whose bytes are gone and reports the change', () => {
    const doc = setHeroImage(docWith(draft({ heroImageUrl: 'https://x/y.jpg' })), 'c1', 'img-1').doc;

    const report = repairDoc(doc, new Set());

    expect(report.changed).toBe(true);
    expect(report.doc.combos[0].heroImageId).toBeNull();
    expect(report.doc.combos[0].heroImageUrl).toBe('https://x/y.jpg');
  });

  it('leaves a doc whose blobs all survive untouched', () => {
    const doc = setHeroImage(docWith(draft()), 'c1', 'img-1').doc;

    const report = repairDoc(doc, new Set(['img-1']));

    expect(report.changed).toBe(false);
    expect(report.doc).toBe(doc);
  });

  it('demotes every extra best down to the first', () => {
    const doc = docWith(draft(), draft({ name: 'ثاني' }));
    // Two combos both flagged best — only reachable from a doc an older build wrote.
    const corrupt: CombosDoc = {
      ...doc,
      combos: doc.combos.map((c) => ({ ...c, best: true })),
    };

    const report = repairDoc(corrupt, new Set());

    expect(report.changed).toBe(true);
    expect(report.doc.combos.filter((c) => c.best).map((c) => c.id)).toEqual(['c1']);
  });

  it('re-densifies a display order that drifted', () => {
    const doc = docWith(draft(), draft({ name: 'ثاني' }));
    const corrupt: CombosDoc = {
      ...doc,
      combos: doc.combos.map((c, i) => ({ ...c, displayOrder: i * 10 })),
    };

    const report = repairDoc(corrupt, new Set());

    expect(report.changed).toBe(true);
    expect(report.doc.combos.map((c) => c.displayOrder)).toEqual([0, 1]);
  });
});

describe('orderedCombos', () => {
  it('sorts by display order regardless of array position', () => {
    const doc = docWith(draft(), draft({ name: 'ثاني' }), draft({ name: 'ثالث' }));
    const shuffled: CombosDoc = { ...doc, combos: [doc.combos[2], doc.combos[0], doc.combos[1]] };

    expect(orderedCombos(shuffled).map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
  });
});

describe('isCombosDocShape', () => {
  it('accepts a seeded doc', () => {
    expect(isCombosDocShape(buildSeedDoc(idFactory(), 0))).toBe(true);
  });

  it('accepts an empty doc', () => {
    expect(isCombosDocShape(emptyDoc())).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['a doc with no combos array', { schemaVersion: COMBOS_SCHEMA_VERSION }],
    ['a wrong schema version', { schemaVersion: 99, combos: [] }],
    ['a combo missing fields', { schemaVersion: COMBOS_SCHEMA_VERSION, combos: [{ id: 'x' }] }],
  ])('rejects %s', (_label, value) => {
    expect(isCombosDocShape(value)).toBe(false);
  });
});

describe('buildSeedDoc', () => {
  it('ships three active combos with exactly one marked best', () => {
    const doc = buildSeedDoc(idFactory(), 0);

    expect(doc.combos).toHaveLength(3);
    expect(doc.combos.every((c) => c.isActive)).toBe(true);
    expect(doc.combos.filter((c) => c.best)).toHaveLength(1);
    expect(doc.combos.map((c) => c.displayOrder)).toEqual([0, 1, 2]);
  });

  it('ships url heroes and no uploaded blobs', () => {
    const doc = buildSeedDoc(idFactory(), 0);

    expect(doc.combos.every((c) => !!c.heroImageUrl)).toBe(true);
    expect(doc.combos.every((c) => c.heroImageId === null)).toBe(true);
  });
});
