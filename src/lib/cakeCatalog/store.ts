/**
 * Cake catalog — the persistence port and its browser-local implementation.
 *
 * Metadata (levels, cakes, image records) is a single JSON document in
 * localStorage; image bytes are Blobs in IndexedDB. Everything the UI touches
 * goes through the six methods below, and the store hands back displayable
 * URLs rather than Blobs — that single choice is what lets a Supabase adapter
 * drop in later (`load` = selects + getPublicUrl, `putImage` = storage.upload,
 * `deleteImages` = storage.remove, `dispose` = a no-op).
 *
 * Note the whole-document `saveCatalog`: right for localStorage, wrong for SQL.
 * The seam that survives is that every mutation in `catalog.ts` already returns
 * `{catalog, deadImageIds, clearedPreviewCakeIds}`, so a SQL adapter has the
 * exact deltas it needs to issue targeted statements.
 */

import {
  emptyCatalog,
  isCatalogShape,
  newId,
  referencedBlobIds,
  repairCatalog,
} from './catalog';
import { createMemoryBlobStore, getDefaultBlobStore, type BlobStore } from './blobStore';
import { buildSeedCatalog, type PlaceholderPlan } from './seed';
import {
  LEGACY_META_KEYS,
  META_STORAGE_KEY,
  type Catalog,
  type ImageFileMeta,
} from './types';

export interface LoadResult {
  catalog: Catalog;
  /** imageId → displayable URL, for everything the catalog still references. */
  urls: Record<string, string>;
  seeded: boolean;
  repaired: boolean;
}

export interface SavedImage {
  id: string;
  url: string;
  meta: ImageFileMeta;
}

export interface CakeCatalogStore {
  load(): Promise<LoadResult>;
  saveCatalog(catalog: Catalog): Promise<void>;
  putImage(file: Blob, fileName: string): Promise<SavedImage>;
  /** Deletes the blobs and revokes their URLs. */
  deleteImages(ids: readonly string[]): Promise<void>;
  reset(): Promise<LoadResult>;
  /** Revoke every outstanding URL — call on provider unmount. */
  dispose(): void;
}

export interface UrlFactory {
  create(blob: Blob): string;
  revoke(url: string): void;
}

type MetaStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LocalStoreOptions {
  metaStorage?: MetaStorage;
  blobs?: BlobStore;
  urls?: UrlFactory;
  newId?: () => string;
  /** Injectable so tests never touch a canvas. */
  renderPlaceholder?: (plan: PlaceholderPlan) => Promise<Blob | null>;
  /** Injectable so tests never touch a canvas. */
  decodeImage?: (file: Blob) => Promise<{ blob: Blob; width: number; height: number }>;
}

/** Metadata or blobs refused the write — in practice, a full quota. */
export class CatalogStorageError extends Error {
  readonly reason: unknown;
  constructor(reason?: unknown) {
    super('cake catalog write rejected');
    this.name = 'CatalogStorageError';
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

export function createLocalCakeCatalogStore(options: LocalStoreOptions = {}): CakeCatalogStore {
  const meta = options.metaStorage ?? defaultMetaStorage();
  const blobs = options.blobs ?? getDefaultBlobStore();
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

  const renderPlaceholder =
    options.renderPlaceholder ??
    (async (plan: PlaceholderPlan) => {
      const { makePlaceholderBlob } = await import('./placeholder');
      return makePlaceholderBlob(plan.label, plan.caption, plan.tint);
    });

  const decodeImage =
    options.decodeImage ??
    (async (file: Blob) => {
      const { decodeAndDownscale } = await import('./placeholder');
      return decodeAndDownscale(file);
    });

  const persist = async (catalog: Catalog) => {
    try {
      meta.setItem(META_STORAGE_KEY, JSON.stringify(catalog));
    } catch (error) {
      throw new CatalogStorageError(error);
    }
  };

  const readMeta = (): Catalog | null => {
    try {
      const raw = meta.getItem(META_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isCatalogShape(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  /** Wipe everything, then generate the demo catalog and its placeholder blobs. */
  const seed = async (): Promise<Catalog> => {
    await blobs.clear();
    release([...liveUrls.keys()]);
    meta.removeItem(META_STORAGE_KEY);
    for (const key of LEGACY_META_KEYS) meta.removeItem(key);

    const { catalog, imagePlan } = buildSeedCatalog(makeId);
    const sizes = new Map<string, number>();
    const entries: [string, Blob][] = [];

    for (const plan of imagePlan) {
      const blob =
        (await renderPlaceholder(plan)) ?? new Blob([plan.caption], { type: 'image/jpeg' });
      sizes.set(plan.imageId, blob.size);
      entries.push([plan.imageId, blob]);
    }

    // One transaction for all ~135 blobs, not 135 transactions.
    await blobs.putMany(entries);

    const seeded: Catalog = {
      ...catalog,
      images: catalog.images.map((img) => ({ ...img, size: sizes.get(img.id) ?? 0 })),
    };
    await persist(seeded);
    return seeded;
  };

  const hydrate = async (catalog: Catalog, seeded: boolean, repaired: boolean): Promise<LoadResult> => {
    // One batched read, not one round-trip per image: a seeded catalog already
    // references 135 blobs and this runs before the page can show anything.
    const needed = [...referencedBlobIds(catalog)];
    const found = await blobs.getMany(needed);
    const urls: Record<string, string> = {};
    for (const [id, blob] of found) urls[id] = track(id, blob);
    return { catalog, urls, seeded, repaired };
  };

  const load = async (): Promise<LoadResult> => {
    const stored = readMeta();
    if (!stored) return hydrate(await seed(), true, false);

    const existingBlobIds = new Set(await blobs.keys());
    const report = repairCatalog(stored, existingBlobIds);

    // Garbage-collect blobs nothing references any more. The prototype never
    // did this, so a crash mid-cascade leaked bytes until the quota blew.
    const needed = referencedBlobIds(report.catalog);
    const orphans = [...existingBlobIds].filter((id) => !needed.has(id));
    if (orphans.length > 0) await blobs.delete(orphans);

    if (report.changed) await persist(report.catalog);
    return hydrate(report.catalog, false, report.changed);
  };

  return {
    load,
    saveCatalog: persist,

    async putImage(file, fileName) {
      const { blob, width, height } = await decodeImage(file);
      const id = makeId();
      // Blob first, metadata second: a crash between them leaves an orphan blob
      // (which boot GC reaps) rather than a record pointing at nothing.
      await blobs.put(id, blob);
      return {
        id,
        url: track(id, blob),
        meta: { fileName, width, height, size: blob.size },
      };
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
export function createMemoryCakeCatalogStore(
  options: Omit<LocalStoreOptions, 'blobs'> = {},
): CakeCatalogStore {
  let counter = 0;
  const memory = new Map<string, string>();
  return createLocalCakeCatalogStore({
    blobs: createMemoryBlobStore(),
    metaStorage: {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    },
    urls: { create: () => `blob:memory/${++counter}`, revoke: () => {} },
    renderPlaceholder: async (plan) => new Blob([plan.label], { type: 'image/jpeg' }),
    decodeImage: async (file) => ({ blob: file, width: 480, height: 360 }),
    ...options,
  });
}

export { emptyCatalog };
