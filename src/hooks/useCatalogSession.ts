import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { imagesByNodeKey } from '@/lib/cakeCatalog/catalog';
import * as session from '@/lib/cakeCatalog/session';
import type { CatalogImage } from '@/lib/cakeCatalog/types';

/**
 * Read-only view of the cake catalog session for the storefront studio.
 *
 * Same singleton the admin dashboard writes through, so a photo uploaded in
 * «تصميم الكيك» appears in /customize instantly in this tab — and via the
 * session's `storage` listener when the dashboard is open in another tab.
 * The customizer never mutates.
 */
export function useCatalogSession() {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);

  useEffect(() => {
    void session.ensureLoaded();
  }, []);

  const { catalog, urls, status } = snapshot;

  const urlFor = useMemo(
    () => (imageId: string | null | undefined) => (imageId ? urls[imageId] : undefined),
    [urls],
  );

  const byKey: ReadonlyMap<string, CatalogImage> = useMemo(
    () => imagesByNodeKey(catalog.images),
    [catalog.images],
  );

  return { status, catalog, urlFor, byKey };
}
