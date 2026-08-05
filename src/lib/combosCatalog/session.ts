/**
 * Combos catalog — the live session: one module-scoped owner of the loaded doc,
 * its object URLs, and the order in which writes happen.
 *
 * Same two forces that pushed the cake catalog's state out of React apply here:
 *
 * 1. **Remount must not rewind.** Both consumers are lazily-routed pages, so
 *    navigating between the storefront and the dashboard unmounts them. State
 *    lives here and React subscribes to it, so a remount rejoins the session
 *    instead of restoring a boot-time snapshot over the session's work.
 *
 * 2. **Writes must not interleave.** A mutation built from a render's
 *    closed-over doc is stale the moment anything else commits, and a hero
 *    upload awaits a decode + re-encode + IndexedDB write first — hundreds of
 *    milliseconds during which a second edit is entirely realistic. So every
 *    mutation is a *function of the current doc*, and they run one at a time
 *    through `queue`.
 *
 * No React and no toasts in here: outcomes are returned, the hook renders them.
 */

import { emptyDoc } from './doc';
import { createLocalCombosStore, CombosStorageError, type CombosStore, type SavedImage } from './store';
import { BlobQuotaError } from '@/lib/blobStore';
import { COMBOS_META_KEY, type ComboCascade, type CombosDoc } from './types';

export interface SessionState {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  doc: CombosDoc;
  urls: Record<string, string>;
  /** Set when a boot dropped hero references whose bytes were gone. */
  repaired: boolean;
}

/**
 * Deliberately a flat interface rather than a discriminated union: this repo
 * compiles with `strict: false`, under which TS does not narrow a union on a
 * boolean literal discriminant.
 */
export interface MutationOutcome {
  ok: boolean;
  reason?: 'storage' | 'failed';
  error?: unknown;
}

const OK: MutationOutcome = { ok: true };

let state: SessionState = {
  status: 'loading',
  error: null,
  doc: emptyDoc(),
  urls: {},
  repaired: false,
};

const listeners = new Set<() => void>();
let store: CombosStore | null = null;
let booting: Promise<void> | null = null;
/** Serialises every write; a rejection must not poison the chain. */
let queue: Promise<unknown> = Promise.resolve();

function publish(patch: Partial<SessionState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable between publishes — safe for useSyncExternalStore. */
export function getSnapshot(): SessionState {
  return state;
}

function getStore(): CombosStore {
  if (!store) store = createLocalCombosStore();
  return store;
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = () => task();
  const next = queue.then(run, run);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function toOutcome(error: unknown): MutationOutcome {
  const storage = error instanceof CombosStorageError || error instanceof BlobQuotaError;
  return { ok: false, reason: storage ? 'storage' : 'failed', error };
}

/**
 * Persist a cascade and publish it. The doc is the source of truth, so it is
 * written first; freeing the blobs it orphaned is best-effort, because boot GC
 * reaps anything left behind. Failing the whole mutation on a cleanup error
 * would leave the UI showing state that localStorage already holds.
 */
async function commit(result: ComboCascade): Promise<MutationOutcome> {
  const active = getStore();
  try {
    await active.saveDoc(result.doc);
  } catch (error) {
    return toOutcome(error);
  }

  const urls = { ...state.urls };
  for (const id of result.deadImageIds) delete urls[id];
  publish({ doc: result.doc, urls });

  if (result.deadImageIds.length > 0) {
    try {
      await active.deleteImages(result.deadImageIds);
    } catch {
      // Orphaned bytes only — the next boot's GC removes them.
    }
  }
  return OK;
}

let crossTabWired = false;

/**
 * A dashboard write in another tab fires a `storage` event here (never in the
 * writing tab), so a storefront left open picks up combo changes live.
 */
function wireCrossTabSync() {
  if (crossTabWired || typeof window === 'undefined') return;
  crossTabWired = true;
  window.addEventListener('storage', (event) => {
    if (event.key === COMBOS_META_KEY) void reloadSession();
  });
}

export function ensureLoaded(): Promise<void> {
  wireCrossTabSync();
  if (booting) return booting;
  booting = (async () => {
    publish({ status: 'loading', error: null });
    try {
      const result = await getStore().load();
      publish({
        status: 'ready',
        error: null,
        doc: result.doc,
        urls: result.urls,
        repaired: result.repaired,
      });
    } catch (error) {
      booting = null; // let a retry actually retry
      publish({
        status: 'error',
        error: error instanceof Error ? error.message : 'خطأ غير متوقع',
      });
    }
  })();
  return booting;
}

export function reloadSession(): Promise<void> {
  booting = null;
  return ensureLoaded();
}

/** The doc is read INSIDE the queue, so `build` always sees the latest. */
export function mutate(build: (doc: CombosDoc) => ComboCascade): Promise<MutationOutcome> {
  return enqueue(async () => {
    try {
      return await commit(build(state.doc));
    } catch (error) {
      return toOutcome(error);
    }
  });
}

/**
 * Store the bytes first, then build the cascade from whatever the doc looks like
 * once that has finished — the whole thing inside one queue slot, so a slow hero
 * upload can never be overtaken by a later edit.
 */
export function mutateWithImage(
  file: File,
  build: (doc: CombosDoc, saved: SavedImage) => ComboCascade,
): Promise<MutationOutcome> {
  return enqueue(async () => {
    try {
      const saved = await getStore().putImage(file);
      publish({ urls: { ...state.urls, [saved.id]: saved.url } });
      return await commit(build(state.doc, saved));
    } catch (error) {
      return toOutcome(error);
    }
  });
}

export function resetSession(): Promise<MutationOutcome> {
  return enqueue(async () => {
    try {
      const result = await getStore().reset();
      booting = Promise.resolve();
      publish({
        status: 'ready',
        error: null,
        doc: result.doc,
        urls: result.urls,
        repaired: false,
      });
      return OK;
    } catch (error) {
      return toOutcome(error);
    }
  });
}

/** Test seam — swaps the store and clears all session state. */
export function __resetSessionForTests(next?: CombosStore) {
  store = next ?? null;
  booting = null;
  queue = Promise.resolve();
  listeners.clear();
  state = { status: 'loading', error: null, doc: emptyDoc(), urls: {}, repaired: false };
}
