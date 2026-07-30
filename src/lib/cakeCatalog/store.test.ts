/**
 * Cake catalog store — boot, self-repair and blob lifecycle.
 *
 * jsdom has neither IndexedDB nor `URL.createObjectURL`, which is exactly why
 * `createLocalCakeCatalogStore` takes injectable ports. Every store below is
 * built over a harness that owns the backings, so a test can reach past the
 * store and corrupt storage the way a real browser would (evicted IndexedDB,
 * a crash mid-cascade) and then assert how the next boot recovers.
 */

import { describe, expect, it, vi } from 'vitest';
import { createMemoryBlobStore, type BlobStore } from './blobStore';
import { referencedBlobIds } from './catalog';
import { createLocalCakeCatalogStore, type CakeCatalogStore } from './store';
import { META_STORAGE_KEY, SCHEMA_VERSION, type Catalog } from './types';

type MetaStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface Harness {
  blobs: BlobStore;
  meta: Map<string, string>;
  /** Every url handed to `urls.revoke`, in order. */
  revoked: string[];
  /** A fresh store over the SAME backings — i.e. a page reload. */
  makeStore(): CakeCatalogStore;
  storedCatalog(): Catalog | null;
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
    // The id counter is shared across stores so a reseed never collides with
    // ids the previous boot already handed out.
    makeStore: () =>
      createLocalCakeCatalogStore({
        blobs,
        metaStorage,
        urls: {
          create: () => `blob:test/${++urlCounter}`,
          revoke: (url) => void revoked.push(url),
        },
        newId: () => `id-${++idCounter}`,
        renderPlaceholder: async (plan) => new Blob([plan.label], { type: 'image/jpeg' }),
        decodeImage: async (file) => ({ blob: file, width: 480, height: 360 }),
      }),
    storedCatalog: () => {
      const raw = meta.get(META_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Catalog) : null;
    },
  };
}

describe('createLocalCakeCatalogStore — boot', () => {
  it('seeds on a fresh boot and mints a url for every referenced blob', async () => {
    const harness = createHarness();
    const result = await harness.makeStore().load();

    expect(result.seeded).toBe(true);
    expect(result.repaired).toBe(false);
    expect(result.catalog.levels).toHaveLength(4);
    expect(result.catalog.cakes).toHaveLength(3);
    // 120 + 12 + 3 nodes across the three demo cakes.
    expect(result.catalog.images).toHaveLength(135);
    expect(harness.meta.has(META_STORAGE_KEY)).toBe(true);
    expect(harness.storedCatalog()?.schemaVersion).toBe(SCHEMA_VERSION);

    const referenced = [...referencedBlobIds(result.catalog)];
    const persistedBlobs = new Set(await harness.blobs.keys());
    expect(referenced.filter((id) => !persistedBlobs.has(id))).toEqual([]);
    expect(Object.keys(result.urls).sort()).toEqual([...referenced].sort());
    // The seed backfills each record's byte size from the rendered placeholder.
    expect(result.catalog.images.every((img) => img.size > 0)).toBe(true);
  });

  it('does not reseed on a second boot over the same backings', async () => {
    const harness = createHarness();
    const first = await harness.makeStore().load();
    const second = await harness.makeStore().load();

    expect(second.seeded).toBe(false);
    expect(second.repaired).toBe(false);
    expect(second.catalog.cakes.map((cake) => cake.id)).toEqual(
      first.catalog.cakes.map((cake) => cake.id),
    );
    expect(second.catalog.images).toHaveLength(first.catalog.images.length);
  });

  it('wipes the blobs and reseeds when the persisted schemaVersion is stale', async () => {
    const harness = createHarness();
    harness.meta.set(
      META_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 0, levels: [], cakes: [], images: [] }),
    );
    await harness.blobs.put('stale-blob', new Blob(['stale'], { type: 'image/jpeg' }));

    const result = await harness.makeStore().load();

    expect(result.seeded).toBe(true);
    expect(await harness.blobs.get('stale-blob')).toBeNull();
    expect(harness.storedCatalog()?.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('reseeds instead of throwing when the persisted metadata is corrupt JSON', async () => {
    const harness = createHarness();
    harness.meta.set(META_STORAGE_KEY, '{"schemaVersion":1,"levels":[');

    const result = await harness.makeStore().load();

    expect(result.seeded).toBe(true);
    expect(result.catalog.cakes).toHaveLength(3);
    expect(harness.storedCatalog()?.cakes).toHaveLength(3);
  });
});

describe('createLocalCakeCatalogStore — self-repair', () => {
  it('drops an image whose blob vanished and rewrites the persisted metadata', async () => {
    const harness = createHarness();
    const first = await harness.makeStore().load();
    // A deep node, so the drop cannot be confused with a preview cascade.
    const victim = first.catalog.images.find((img) => img.path.length > 1);
    expect(victim).toBeDefined();
    await harness.blobs.delete([victim!.id]);

    const second = await harness.makeStore().load();

    expect(second.seeded).toBe(false);
    expect(second.repaired).toBe(true);
    expect(second.catalog.images).toHaveLength(first.catalog.images.length - 1);
    expect(second.catalog.images.some((img) => img.id === victim!.id)).toBe(false);
    expect(second.urls[victim!.id]).toBeUndefined();
    expect(harness.storedCatalog()?.images.some((img) => img.id === victim!.id)).toBe(false);
  });

  it('nulls a preview whose blob vanished', async () => {
    const harness = createHarness();
    const first = await harness.makeStore().load();
    const cake = first.catalog.cakes.find((candidate) => candidate.previewImageId);
    expect(cake).toBeDefined();
    await harness.blobs.delete([cake!.previewImageId!]);

    const second = await harness.makeStore().load();

    expect(second.repaired).toBe(true);
    expect(second.catalog.cakes.find((c) => c.id === cake!.id)?.previewImageId).toBeNull();
    expect(harness.storedCatalog()?.cakes.find((c) => c.id === cake!.id)?.previewImageId).toBeNull();
  });

  it('garbage-collects blobs nothing references any more', async () => {
    const harness = createHarness();
    await harness.makeStore().load();
    await harness.blobs.put('orphan-blob', new Blob(['orphan'], { type: 'image/jpeg' }));

    const result = await harness.makeStore().load();

    // An orphan blob is invisible to the metadata, so nothing was "repaired".
    expect(result.repaired).toBe(false);
    expect(await harness.blobs.get('orphan-blob')).toBeNull();
  });
});

describe('createLocalCakeCatalogStore — images', () => {
  it('putImage stores the blob and registers a url that deleteImages revokes', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    await store.load();

    const file = new Blob(['x'.repeat(64)], { type: 'image/png' });
    const saved = await store.putImage(file, 'زفاف.png');

    expect(saved.id).toMatch(/^id-\d+$/);
    expect(saved.url).toMatch(/^blob:test\/\d+$/);
    expect(saved.meta).toEqual({ fileName: 'زفاف.png', width: 480, height: 360, size: 64 });
    expect((await harness.blobs.get(saved.id))?.size).toBe(64);
    expect(harness.revoked).not.toContain(saved.url);

    await store.deleteImages([saved.id]);

    expect(await harness.blobs.get(saved.id)).toBeNull();
    expect(harness.revoked).toContain(saved.url);
  });

  it('deleteImages is a no-op for an empty list', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    await store.load();
    const deleteSpy = vi.spyOn(harness.blobs, 'delete');

    await store.deleteImages([]);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(harness.revoked).toEqual([]);
    deleteSpy.mockRestore();
  });
});

describe('createLocalCakeCatalogStore — lifecycle', () => {
  it('saveCatalog persists a mutated catalog for the next boot', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const { catalog } = await store.load();
    const target = catalog.cakes[0];

    await store.saveCatalog({
      ...catalog,
      cakes: catalog.cakes.map((cake) =>
        cake.id === target.id ? { ...cake, name: 'كعكة معدّلة', basePrice: 199 } : cake,
      ),
    });

    const reloaded = await harness.makeStore().load();
    const updated = reloaded.catalog.cakes.find((cake) => cake.id === target.id);

    expect(reloaded.seeded).toBe(false);
    expect(updated?.name).toBe('كعكة معدّلة');
    expect(updated?.basePrice).toBe(199);
  });

  it('reset wipes the old blobs, revokes the old urls and reseeds', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const first = await store.load();
    const staleImageId = first.catalog.images[0].id;

    const result = await store.reset();

    expect(result.seeded).toBe(true);
    expect(result.catalog.cakes).toHaveLength(3);
    expect(result.catalog.cakes.map((cake) => cake.id)).not.toEqual(
      first.catalog.cakes.map((cake) => cake.id),
    );
    expect(await harness.blobs.get(staleImageId)).toBeNull();
    expect(harness.revoked).toHaveLength(Object.keys(first.urls).length);
  });

  it('dispose revokes every outstanding url exactly once', async () => {
    const harness = createHarness();
    const store = harness.makeStore();
    const result = await store.load();
    const minted = Object.values(result.urls);

    store.dispose();

    expect([...harness.revoked].sort()).toEqual([...minted].sort());

    store.dispose();

    expect(harness.revoked).toHaveLength(minted.length);
  });
});

describe('createMemoryBlobStore', () => {
  it('supports put, get, putMany, keys, delete and clear', async () => {
    const blobs = createMemoryBlobStore();

    expect(await blobs.get('a')).toBeNull();
    expect(await blobs.keys()).toEqual([]);

    await blobs.put('a', new Blob(['aa']));
    expect((await blobs.get('a'))?.size).toBe(2);

    const entries: [string, Blob][] = [
      ['b', new Blob(['bbb'])],
      ['c', new Blob(['cccc'])],
    ];
    await blobs.putMany(entries);
    expect(await blobs.keys()).toEqual(['a', 'b', 'c']);

    await blobs.putMany([]);
    expect(await blobs.keys()).toEqual(['a', 'b', 'c']);

    await blobs.delete(['b']);
    expect(await blobs.get('b')).toBeNull();
    expect(await blobs.keys()).toEqual(['a', 'c']);

    await blobs.clear();
    expect(await blobs.keys()).toEqual([]);
  });

  it('writes through to a caller-supplied backing map', async () => {
    const backing = new Map<string, Blob>([['existing', new Blob(['x'])]]);
    const blobs = createMemoryBlobStore(backing);

    expect((await blobs.get('existing'))?.size).toBe(1);

    await blobs.put('added', new Blob(['yy']));
    expect(backing.get('added')?.size).toBe(2);
  });
});
