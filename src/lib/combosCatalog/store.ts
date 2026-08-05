/**
 * Combos catalog — the persistence port and its browser-local implementation.
 *
 * The doc (names, members, discounts, image records) is a single JSON document
 * in localStorage; hero photo bytes are Blobs in its own IndexedDB database.
 * Everything the UI touches goes through the six methods below, and the store
 * hands back displayable URLs rather than Blobs — that single choice is what
 * lets a Supabase adapter drop in later:
 *
 *   load()         → select combos + storage.getPublicUrl() per hero
 *   saveDoc()      → upsert/delete rows (every mutation in `doc.ts` already
 *                    returns the exact cascade, so it need not be a full write)
 *   putImage()     → storage.upload() into a `combo-heroes` bucket
 *   deleteImages() → storage.remove()
 *   dispose()      → a no-op
 */

import {
  emptyDoc,
  isCombosDocShape,
  newId,
  referencedBlobIds,
  repairDoc,
} from './doc';
import { buildSeedDoc } from './seed';
import { createMemoryBlobStore, getDefaultBlobStore, type BlobStore } from '@/lib/blobStore';
import {
  COMBOS_IDB_NAME,
  COMBOS_IDB_STORE,
  COMBOS_META_KEY,
  type CombosDoc,
} from './types';

export interface LoadResult {
  doc: CombosDoc;
  /** imageId → displayable URL, for every hero the doc still references. */
  urls: Record<string, string>;
  seeded: boolean;
  repaired: boolean;
}

export interface SavedImage {
  id: string;
  url: string;
}

export interface CombosStore {
  load(): Promise<LoadResult>;
  saveDoc(doc: CombosDoc): Promise<void>;
  putImage(file: Blob): Promise<SavedImage>;
  /** Deletes the blobs and revokes their URLs. */
  deleteImages(ids: readonly string[]): Promise<void>;
  reset(): Promise<LoadResult>;
  /** Revoke every outstanding URL — call when the last consumer unmounts. */
  dispose(): void;
}

export interface UrlFactory {
  create(blob: Blob): string;
  revoke(url: string): void;
}

type MetaStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LocalCombosStoreOptions {
  metaStorage?: MetaStorage;
  blobs?: BlobStore;
  urls?: UrlFactory;
  newId?: () => string;
  /** Injectable so tests never touch a canvas. */
  decodeImage?: (file: Blob) => Promise<{ blob: Blob }>;
}

/** The doc or the blobs refused the write — in practice, a full quota. */
export class CombosStorageError extends Error {
  readonly reason: unknown;
  constructor(reason?: unknown) {
    super('combos catalog write rejected');
    this.name = 'CombosStorageError';
    this.reason = reason;
  }
}

function defaultMetaStorage(): MetaStorage {
  if (typeof localStorage !== 'undefined') return localStorage;
  const memory = new Map<string, string>();
  return {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => void memory.set(k, v),
    removeItem: (k) => void memory.delete(k),
  };
}

function defaultUrlFactory(): UrlFactory {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    let counter = 0;
    return { create: () => `blob:unsupported/${++counter}`, revoke: () => {} };
  }
  return { create: (blob) => URL.createObjectURL(blob), revoke: (url) => URL.revokeObjectURL(url) };
}

export function createLocalCombosStore(options: LocalCombosStoreOptions = {}): CombosStore {
  const meta = options.metaStorage ?? defaultMetaStorage();
  const blobs = options.blobs ?? getDefaultBlobStore(COMBOS_IDB_NAME, COMBOS_IDB_STORE);
  const urlFactory = options.urls ?? defaultUrlFactory();
  const makeId = options.newId ?? newId;

  /** Every URL this store minted, so `dispose` and `deleteImages` can revoke them. */
  const liveUrls = new Map<string, string>();

  const track = (id: string, blob: Blob) => {
    const existing = liveUrls.get(id);
    if (existing) urlFactory.revoke(existing);
    const url = urlFactory.create(blob);
    liveUrls.set(id, url);
    return url;
  };

  const release = (ids: Iterable<string>) => {
    for (const id of ids) {
      const url = liveUrls.get(id);
      if (url) {
        urlFactory.revoke(url);
        liveUrls.delete(id);
      }
    }
  };

  const decodeImage =
    options.decodeImage ??
    (async (file: Blob) => {
      const { decodeAndDownscale } = await import('@/lib/imageDownscale');
      return decodeAndDownscale(file);
    });

  const persist = async (doc: CombosDoc) => {
    try {
      meta.setItem(COMBOS_META_KEY, JSON.stringify(doc));
    } catch (error) {
      throw new CombosStorageError(error);
    }
  };

  const readMeta = (): CombosDoc | null => {
    try {
      const raw = meta.getItem(COMBOS_META_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isCombosDocShape(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  /** Wipe everything, then lay down the three combos the storefront shipped with. */
  const seed = async (): Promise<CombosDoc> => {
    await blobs.clear();
    release([...liveUrls.keys()]);
    meta.removeItem(COMBOS_META_KEY);

    const doc = buildSeedDoc(makeId);
    await persist(doc);
    return doc;
  };

  const hydrate = async (doc: CombosDoc, seeded: boolean, repaired: boolean): Promise<LoadResult> => {
    const needed = [...referencedBlobIds(doc)];
    const found = await blobs.getMany(needed);
    const urls: Record<string, string> = {};
    for (const [id, blob] of found) urls[id] = track(id, blob);
    return { doc, urls, seeded, repaired };
  };

  const load = async (): Promise<LoadResult> => {
    const stored = readMeta();
    if (!stored) return hydrate(await seed(), true, false);

    const existingBlobIds = new Set(await blobs.keys());
    const report = repairDoc(stored, existingBlobIds);

    // Garbage-collect blobs nothing references any more, so a crash mid-cascade
    // leaks bytes for one session rather than until the quota blows.
    const needed = referencedBlobIds(report.doc);
    const orphans = [...existingBlobIds].filter((id) => !needed.has(id));
    if (orphans.length > 0) await blobs.delete(orphans);

    if (report.changed) await persist(report.doc);
    return hydrate(report.doc, false, report.changed);
  };

  return {
    load,
    saveDoc: persist,

    async putImage(file) {
      const { blob } = await decodeImage(file);
      const id = makeId();
      // Blob first, doc second: a crash between them leaves an orphan blob
      // (which boot GC reaps) rather than a record pointing at nothing.
      await blobs.put(id, blob);
      return { id, url: track(id, blob) };
    },

    async deleteImages(ids) {
      if (ids.length === 0) return;
      await blobs.delete(ids);
      release(ids);
    },

    async reset() {
      return hydrate(await seed(), true, false);
    },

    dispose() {
      release([...liveUrls.keys()]);
    },
  };
}

/** Convenience for tests: a fully in-memory store with no browser dependencies. */
export function createMemoryCombosStore(
  options: Omit<LocalCombosStoreOptions, 'blobs'> & { blobs?: BlobStore } = {},
): CombosStore {
  let counter = 0;
  const memory = new Map<string, string>();
  return createLocalCombosStore({
    blobs: createMemoryBlobStore(),
    metaStorage: {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    },
    urls: { create: () => `blob:memory/${++counter}`, revoke: () => {} },
    decodeImage: async (file) => ({ blob: file }),
    ...options,
  });
}

export { emptyDoc };
