/**
 * Cake catalog — binary storage.
 *
 * Image bytes live in IndexedDB, not localStorage: localStorage's ~5 MB quota
 * plus base64's 33% inflation makes it useless for photos, while IndexedDB
 * stores Blobs natively with a far larger budget.
 *
 * `indexedDB` is referenced ONLY inside method bodies and the connection is
 * opened lazily on first use. jsdom has no IndexedDB, so touching it at import
 * time would break every test file that transitively imports this module.
 */

import { IDB_NAME, IDB_STORE } from './types';

export interface BlobStore {
  get(id: string): Promise<Blob | null>;
  /** One transaction for the whole set — boot needs every referenced blob at once. */
  getMany(ids: readonly string[]): Promise<Map<string, Blob>>;
  put(id: string, blob: Blob): Promise<void>;
  putMany(entries: readonly (readonly [string, Blob])[]): Promise<void>;
  delete(ids: readonly string[]): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

/** Thrown when the browser refuses the write — almost always a full quota. */
export class BlobQuotaError extends Error {
  readonly reason: unknown;
  constructor(reason?: unknown) {
    super('blob store write rejected');
    this.name = 'BlobQuotaError';
    this.reason = reason;
  }
}

export function createIdbBlobStore(): BlobStore {
  let connection: Promise<IDBDatabase> | null = null;

  const open = () => {
    if (connection) return connection;
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    // Don't cache a failed connection — a later call should retry.
    connection.catch(() => {
      connection = null;
    });
    return connection;
  };

  const write = async (run: (store: IDBObjectStore) => void) => {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new BlobQuotaError(tx.error));
      tx.onabort = () => reject(new BlobQuotaError(tx.error));
      run(tx.objectStore(IDB_STORE));
    });
  };

  const read = async <T>(run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> => {
    const db = await open();
    return new Promise<T | null>((resolve) => {
      const request = run(db.transaction(IDB_STORE).objectStore(IDB_STORE));
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    });
  };

  return {
    async get(id) {
      return read<Blob>((store) => store.get(id) as IDBRequest<Blob>);
    },
    // Boot needs every referenced blob; one transaction beats N round-trips.
    async getMany(ids) {
      const found = new Map<string, Blob>();
      if (ids.length === 0) return found;
      const db = await open();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(IDB_STORE);
        const objectStore = tx.objectStore(IDB_STORE);
        for (const id of ids) {
          const request = objectStore.get(id) as IDBRequest<Blob>;
          request.onsuccess = () => {
            if (request.result) found.set(id, request.result);
          };
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      });
      return found;
    },
    async put(id, blob) {
      await write((store) => store.put(blob, id));
    },
    // One transaction for the whole batch — the seed writes 135 blobs at once.
    async putMany(entries) {
      if (entries.length === 0) return;
      await write((store) => {
        for (const [id, blob] of entries) store.put(blob, id);
      });
    },
    async delete(ids) {
      if (ids.length === 0) return;
      await write((store) => {
        for (const id of ids) store.delete(id);
      });
    },
    async keys() {
      const keys = await read<IDBValidKey[]>((store) => store.getAllKeys());
      return (keys ?? []).map(String);
    },
    async clear() {
      await write((store) => store.clear());
    },
  };
}

/** In-memory stand-in for jsdom and for unit tests. */
export function createMemoryBlobStore(initial?: Map<string, Blob>): BlobStore {
  const blobs = initial ?? new Map<string, Blob>();
  return {
    async get(id) {
      return blobs.get(id) ?? null;
    },
    async getMany(ids) {
      const found = new Map<string, Blob>();
      for (const id of ids) {
        const blob = blobs.get(id);
        if (blob) found.set(id, blob);
      }
      return found;
    },
    async put(id, blob) {
      blobs.set(id, blob);
    },
    async putMany(entries) {
      for (const [id, blob] of entries) blobs.set(id, blob);
    },
    async delete(ids) {
      for (const id of ids) blobs.delete(id);
    },
    async keys() {
      return [...blobs.keys()];
    },
    async clear() {
      blobs.clear();
    },
  };
}

export function getDefaultBlobStore(): BlobStore {
  return typeof indexedDB === 'undefined' ? createMemoryBlobStore() : createIdbBlobStore();
}
