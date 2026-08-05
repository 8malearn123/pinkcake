/**
 * Combos store — boot, self-repair and blob lifecycle.
 *
 * jsdom has neither IndexedDB nor `URL.createObjectURL`, which is exactly why
 * `createLocalCombosStore` takes injectable ports. Every store below is built
 * over a harness that owns the backings, so a test can reach past the store and
 * corrupt storage the way a real browser would (evicted IndexedDB, a crash
 * mid-cascade) and then assert how the next boot recovers.
 */

import { describe, expect, it } from 'vitest';
import { createMemoryBlobStore, type BlobStore } from '@/lib/blobStore';
import { deleteCombo, referencedBlobIds, setHeroImage } from './doc';
import { createLocalCombosStore, CombosStorageError, type CombosStore } from './store';
import { COMBOS_META_KEY, COMBOS_SCHEMA_VERSION, type CombosDoc } from './types';

type MetaStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface Harness {
  blobs: BlobStore;
  meta: Map<string, string>;
  /** Every url handed to `urls.revoke`, in order. */
  revoked: string[];
  /** A fresh store over the SAME backings — i.e. a page reload. */
  makeStore(): CombosStore;
  storedDoc(): CombosDoc | null;
}

function createHarness(): Harness {
  const blobs = createMemoryBlobStore();
  const meta = new Map<string, string>();
  const revoked: string[] = [];
  let idCounter = 0;
  let urlCounter = 0;

  const metaStorage: MetaStorage = {
    getItem: (key) => meta.get(key) ?? null,
    setItem: (key, value) => void meta.set(key, value),
    removeItem: (key) => void meta.delete(key),
  };

  return {
    blobs,
    meta,
    revoked,
    makeStore: () =>
      createLocalCombosStore({
        metaStorage,
        blobs,
        urls: {
          create: () => `blob:test/${++urlCounter}`,
          revoke: (url) => void revoked.push(url),
        },
        newId: () => `id-${++idCounter}`,
        decodeImage: async (file) => ({ blob: file }),
      }),
    storedDoc: () => {
      const raw = meta.get(COMBOS_META_KEY);
      return raw ? (JSON.parse(raw) as CombosDoc) : null;
    },
  };
}

const blob = (text: string) => new Blob([text], { type: 'image/jpeg' });

describe('load', () => {
  it('seeds the three shipped combos on a first-ever boot', async () => {
    const harness = createHarness();

    const result = await harness.makeStore().load();

    expect(result.seeded).toBe(true);
    expect(result.doc.combos).toHaveLength(3);
    expect(result.doc.schemaVersion).toBe(COMBOS_SCHEMA_VERSION);
    expect(harness.storedDoc()?.combos).toHaveLength(3);
  });

  it('reloads what was saved instead of reseeding', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const first = await store.load();

    await store.saveDoc(deleteCombo(first.doc, first.doc.combos[0].id).doc);
    const second = await harness.makeStore().load();

    expect(second.seeded).toBe(false);
    expect(second.doc.combos).toHaveLength(2);
  });

  it('reseeds when the persisted doc is not a combos doc', async () => {
    const harness = createHarness();
    harness.meta.set(COMBOS_META_KEY, JSON.stringify({ schemaVersion: 99, combos: 'nope' }));

    const result = await harness.makeStore().load();

    expect(result.seeded).toBe(true);
    expect(result.doc.combos).toHaveLength(3);
  });

  it('reseeds when the persisted doc is unparseable', async () => {
    const harness = createHarness();
    harness.meta.set(COMBOS_META_KEY, '{ not json');

    expect((await harness.makeStore().load()).seeded).toBe(true);
  });

  it('hydrates a url for every hero the doc still references', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const first = await store.load();
    const saved = await store.putImage(blob('hero'));
    await store.saveDoc(setHeroImage(first.doc, first.doc.combos[0].id, saved.id).doc);

    const reloaded = await harness.makeStore().load();

    expect(Object.keys(reloaded.urls)).toEqual([saved.id]);
  });

  it('drops a hero reference whose bytes were evicted and reports the repair', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const first = await store.load();
    const saved = await store.putImage(blob('hero'));
    const comboId = first.doc.combos[0].id;
    await store.saveDoc(setHeroImage(first.doc, comboId, saved.id).doc);

    // Safari evicting IndexedDB while localStorage survives.
    await harness.blobs.clear();
    const reloaded = await harness.makeStore().load();

    expect(reloaded.repaired).toBe(true);
    expect(reloaded.doc.combos.find((c) => c.id === comboId)?.heroImageId).toBeNull();
    expect(harness.storedDoc()?.combos.find((c) => c.id === comboId)?.heroImageId).toBeNull();
  });

  it('garbage-collects blobs nothing references any more', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    await store.load();
    // A crash between "bytes written" and "doc saved" leaves exactly this.
    await store.putImage(blob('orphan'));

    expect(await harness.blobs.keys()).toHaveLength(1);
    await harness.makeStore().load();

    expect(await harness.blobs.keys()).toHaveLength(0);
  });

  it('keeps blobs the doc still points at', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const first = await store.load();
    const saved = await store.putImage(blob('hero'));
    await store.saveDoc(setHeroImage(first.doc, first.doc.combos[0].id, saved.id).doc);

    const reloaded = await harness.makeStore().load();

    expect(await harness.blobs.keys()).toEqual([saved.id]);
    expect(referencedBlobIds(reloaded.doc).has(saved.id)).toBe(true);
  });
});

describe('putImage / deleteImages', () => {
  it('stores the bytes and hands back a displayable url', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    await store.load();

    const saved = await store.putImage(blob('hero'));

    expect(saved.url).toMatch(/^blob:test\//);
    expect(await harness.blobs.get(saved.id)).not.toBeNull();
  });

  it('deletes the bytes and revokes the url', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    await store.load();
    const saved = await store.putImage(blob('hero'));

    await store.deleteImages([saved.id]);

    expect(await harness.blobs.get(saved.id)).toBeNull();
    expect(harness.revoked).toContain(saved.url);
  });

  it('ignores an empty delete', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    await store.load();

    await store.deleteImages([]);

    expect(harness.revoked).toEqual([]);
  });
});

describe('reset', () => {
  it('wipes edits and uploads, then lays the seed back down', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const first = await store.load();
    const saved = await store.putImage(blob('hero'));
    await store.saveDoc(setHeroImage(first.doc, first.doc.combos[0].id, saved.id).doc);

    const result = await store.reset();

    expect(result.seeded).toBe(true);
    expect(result.doc.combos).toHaveLength(3);
    expect(await harness.blobs.keys()).toHaveLength(0);
    expect(harness.revoked).toContain(saved.url);
  });
});

describe('dispose', () => {
  it('revokes every url it minted', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    await store.load();
    const a = await store.putImage(blob('a'));
    const b = await store.putImage(blob('b'));

    store.dispose();

    expect(harness.revoked).toEqual(expect.arrayContaining([a.url, b.url]));
  });
});

describe('quota failures', () => {
  it('surfaces a rejected doc write as a CombosStorageError', async () => {
    const store = createLocalCombosStore({
      metaStorage: {
        getItem: () => null,
        setItem: () => {
          throw new DOMException('quota', 'QuotaExceededError');
        },
        removeItem: () => {},
      },
      blobs: createMemoryBlobStore(),
      urls: { create: () => 'blob:x', revoke: () => {} },
      decodeImage: async (file) => ({ blob: file }),
    });

    // The seed is the first thing that tries to persist, so boot is where it lands.
    await expect(store.load()).rejects.toBeInstanceOf(CombosStorageError);
  });
});
