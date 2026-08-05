/**
 * Combos catalog — pure domain logic.
 *
 * No React, no storage, no browser APIs: every function here takes a doc and
 * returns a new one plus the exact blobs it orphaned. That is what makes the
 * whole write path testable without a component, and what would let a SQL
 * adapter issue targeted statements instead of a whole-document write.
 *
 * Invariants live HERE, not in the form — a combo edited from two places must
 * come out the same both times:
 *   · at most one combo is `best`
 *   · `displayOrder` is always a dense 0..n-1 in array order
 *   · replacing or clearing a hero reports the blob it stranded
 */

import {
  COMBOS_SCHEMA_VERSION,
  MAX_DISCOUNT_PCT,
  type ComboCascade,
  type ComboDraft,
  type ComboItem,
  type CombosDoc,
} from './types';

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function emptyDoc(): CombosDoc {
  return { schemaVersion: COMBOS_SCHEMA_VERSION, combos: [] };
}

/** Clamp to a whole percentage the pricing maths can trust. */
export function clampDiscount(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(MAX_DISCOUNT_PCT, Math.max(0, Math.round(pct)));
}

/** Renumber `displayOrder` to match array position — call after every reshuffle. */
function renumber(combos: ComboItem[]): ComboItem[] {
  return combos.map((combo, index) =>
    combo.displayOrder === index ? combo : { ...combo, displayOrder: index },
  );
}

/**
 * Enforce "at most one best". `winner` keeps the flag; everyone else loses it.
 * A null winner means nobody claimed it, so the existing flags are cleared and
 * the storefront falls back to the first combo.
 */
function soleBest(combos: ComboItem[], winner: string | null): ComboItem[] {
  return combos.map((combo) => {
    const best = combo.id === winner;
    return combo.best === best ? combo : { ...combo, best };
  });
}

/** Sorted by display order — the order the storefront and the table both use. */
export function orderedCombos(doc: CombosDoc): ComboItem[] {
  return [...doc.combos].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * The hero to actually render: an uploaded photo wins, a pasted URL is the
 * fallback, and '' means "this combo has no image yet". One definition, because
 * the storefront card and the dashboard row must never disagree about which
 * picture a combo is showing.
 */
export function comboHeroSrc(
  combo: ComboItem,
  urlFor: (imageId: string | null | undefined) => string | undefined,
): string {
  return urlFor(combo.heroImageId) ?? combo.heroImageUrl ?? '';
}

function cascade(doc: CombosDoc, combos: ComboItem[], deadImageIds: string[] = []): ComboCascade {
  return { doc: { ...doc, combos: renumber(combos) }, deadImageIds };
}

/**
 * Apply a second mutation to the result of the first, accumulating the orphans
 * of both. Saving a combo and its hero photo is two mutations that must land as
 * one write — otherwise a failure between them persists half the edit.
 */
export function chain(first: ComboCascade, next: (doc: CombosDoc) => ComboCascade): ComboCascade {
  const second = next(first.doc);
  return { doc: second.doc, deadImageIds: [...first.deadImageIds, ...second.deadImageIds] };
}

export function addCombo(doc: CombosDoc, draft: ComboDraft, makeId: () => string = newId): ComboCascade {
  const combo: ComboItem = {
    id: makeId(),
    name: draft.name.trim(),
    tagline: draft.tagline.trim(),
    items: [...draft.items],
    discountPct: clampDiscount(draft.discountPct),
    accent: draft.accent,
    heroImageId: null,
    heroImageUrl: draft.heroImageUrl?.trim() || null,
    best: false,
    isActive: draft.isActive,
    displayOrder: doc.combos.length,
    createdAt: Date.now(),
  };
  const combos = [...doc.combos, combo];
  // A brand-new combo may claim `best`, which unseats whoever held it.
  return cascade(doc, draft.best ? soleBest(combos, combo.id) : combos);
}

/**
 * Patch an existing combo. Clearing `heroImageUrl` while a blob hero is set is
 * NOT a hero deletion — use `clearHeroImage` for that, so the orphaned blob is
 * always reported rather than silently stranded.
 */
export function updateCombo(doc: CombosDoc, id: string, draft: ComboDraft): ComboCascade {
  const combos = doc.combos.map((combo) =>
    combo.id === id
      ? {
          ...combo,
          name: draft.name.trim(),
          tagline: draft.tagline.trim(),
          items: [...draft.items],
          discountPct: clampDiscount(draft.discountPct),
          accent: draft.accent,
          heroImageUrl:
            draft.heroImageUrl === undefined ? combo.heroImageUrl : draft.heroImageUrl?.trim() || null,
          isActive: draft.isActive,
        }
      : combo,
  );

  if (!doc.combos.some((combo) => combo.id === id)) return cascade(doc, combos);

  // `best` is a document-wide invariant, so it can't be patched row-locally:
  // granting it must unseat the incumbent, revoking it must leave nobody set.
  const current = doc.combos.find((combo) => combo.id === id);
  if (draft.best) return cascade(doc, soleBest(combos, id));
  if (current?.best) return cascade(doc, soleBest(combos, null));
  return cascade(doc, combos);
}

export function deleteCombo(doc: CombosDoc, id: string): ComboCascade {
  const target = doc.combos.find((combo) => combo.id === id);
  if (!target) return cascade(doc, doc.combos);
  return cascade(
    doc,
    doc.combos.filter((combo) => combo.id !== id),
    target.heroImageId ? [target.heroImageId] : [],
  );
}

/**
 * Point a combo at a freshly stored blob. Any hero it was already showing is
 * reported dead — replacing a photo must not leak the old bytes.
 */
export function setHeroImage(doc: CombosDoc, id: string, imageId: string): ComboCascade {
  const previous = doc.combos.find((combo) => combo.id === id)?.heroImageId;
  return cascade(
    doc,
    doc.combos.map((combo) => (combo.id === id ? { ...combo, heroImageId: imageId } : combo)),
    previous && previous !== imageId ? [previous] : [],
  );
}

/** Drop the uploaded hero; the combo falls back to `heroImageUrl` if it has one. */
export function clearHeroImage(doc: CombosDoc, id: string): ComboCascade {
  const previous = doc.combos.find((combo) => combo.id === id)?.heroImageId;
  return cascade(
    doc,
    doc.combos.map((combo) => (combo.id === id ? { ...combo, heroImageId: null } : combo)),
    previous ? [previous] : [],
  );
}

/** Grant «الأكثر توفيراً» to one combo, or pass null to leave it unclaimed. */
export function setBest(doc: CombosDoc, id: string | null): ComboCascade {
  return cascade(doc, soleBest(doc.combos, id));
}

export function setActive(doc: CombosDoc, id: string, isActive: boolean): ComboCascade {
  return cascade(
    doc,
    doc.combos.map((combo) => (combo.id === id ? { ...combo, isActive } : combo)),
  );
}

/**
 * Reorder to the given id sequence. Ids the doc doesn't know are ignored and
 * combos the caller forgot keep their relative order at the end, so a stale
 * drag can shuffle the list but never drop a combo off it.
 */
export function reorderCombos(doc: CombosDoc, orderedIds: readonly string[]): ComboCascade {
  const byId = new Map(doc.combos.map((combo) => [combo.id, combo]));
  const moved: ComboItem[] = [];
  for (const id of orderedIds) {
    const combo = byId.get(id);
    if (combo) {
      moved.push(combo);
      byId.delete(id);
    }
  }
  return cascade(doc, [...moved, ...byId.values()]);
}

/** Blob ids the doc still points at — everything else in storage is garbage. */
export function referencedBlobIds(doc: CombosDoc): Set<string> {
  const ids = new Set<string>();
  for (const combo of doc.combos) {
    if (combo.heroImageId) ids.add(combo.heroImageId);
  }
  return ids;
}

function isComboItem(value: unknown): value is ComboItem {
  if (typeof value !== 'object' || value === null) return false;
  const combo = value as Record<string, unknown>;
  return (
    typeof combo.id === 'string' &&
    typeof combo.name === 'string' &&
    typeof combo.tagline === 'string' &&
    Array.isArray(combo.items) &&
    combo.items.every((item) => typeof item === 'string') &&
    typeof combo.discountPct === 'number' &&
    typeof combo.accent === 'string' &&
    (combo.heroImageId === null || typeof combo.heroImageId === 'string') &&
    (combo.heroImageUrl === null || typeof combo.heroImageUrl === 'string') &&
    typeof combo.best === 'boolean' &&
    typeof combo.isActive === 'boolean' &&
    typeof combo.displayOrder === 'number' &&
    typeof combo.createdAt === 'number'
  );
}

export function isCombosDocShape(value: unknown): value is CombosDoc {
  if (typeof value !== 'object' || value === null) return false;
  const doc = value as Record<string, unknown>;
  return (
    doc.schemaVersion === COMBOS_SCHEMA_VERSION &&
    Array.isArray(doc.combos) &&
    doc.combos.every(isComboItem)
  );
}

export interface RepairReport {
  doc: CombosDoc;
  changed: boolean;
}

/**
 * Reconcile a persisted doc against the blobs that actually survived. A cleared
 * browser cache, a failed write or a half-applied cascade can all leave a
 * `heroImageId` pointing at nothing; rather than render a broken image we drop
 * the reference and let the combo fall back to its URL. Also re-establishes the
 * document-wide invariants in case an older build wrote a doc that broke them.
 */
export function repairDoc(doc: CombosDoc, existingBlobIds: ReadonlySet<string>): RepairReport {
  let changed = false;

  let combos = doc.combos.map((combo) => {
    if (combo.heroImageId && !existingBlobIds.has(combo.heroImageId)) {
      changed = true;
      return { ...combo, heroImageId: null };
    }
    return combo;
  });

  const bestIds = combos.filter((combo) => combo.best).map((combo) => combo.id);
  if (bestIds.length > 1) {
    changed = true;
    combos = soleBest(combos, bestIds[0]);
  }

  const renumbered = renumber(combos);
  if (renumbered.some((combo, index) => combo !== combos[index])) changed = true;

  return { doc: changed ? { ...doc, combos: renumbered } : doc, changed };
}
