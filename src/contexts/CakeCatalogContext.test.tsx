import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { CakeCatalogProvider, useCakeCatalog } from './CakeCatalogContext';
import { __resetSessionForTests } from '@/lib/cakeCatalog/session';
import { createMemoryCakeCatalogStore } from '@/lib/cakeCatalog/store';
import { newId } from '@/lib/cakeCatalog/catalog';
import type { CakeCatalogStore } from '@/lib/cakeCatalog/store';

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

/**
 * These mount the real provider against an in-memory store — jsdom has no
 * IndexedDB and no createObjectURL, which is exactly why the store takes
 * injectable backings. They exist because the two worst bugs this feature had
 * were both in the wiring between React and the store, invisible to the pure
 * unit tests: a remount rewinding to the boot snapshot, and two overlapping
 * writes racing off the same stale catalog.
 */

let store: CakeCatalogStore;
let api: ReturnType<typeof useCakeCatalog> | null = null;

function Probe() {
  api = useCakeCatalog();
  return (
    <div>
      <span data-testid="status">{api.status}</span>
      <span data-testid="cakes">{api.catalog.cakes.length}</span>
      <span data-testid="images">{api.catalog.images.length}</span>
      <span data-testid="levels">{api.catalog.levels.map((l) => l.name).join('|')}</span>
    </div>
  );
}

const mount = () =>
  render(
    <CakeCatalogProvider>
      <Probe />
    </CakeCatalogProvider>,
  );

const ready = () => waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ready'));

const pngFile = (name: string) =>
  new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });

beforeEach(() => {
  api = null;
  store = createMemoryCakeCatalogStore({ newId });
  __resetSessionForTests(store);
});

describe('CakeCatalogProvider', () => {
  it('boots the seeded catalog', async () => {
    mount();
    await ready();

    expect(Number(screen.getByTestId('cakes').textContent)).toBe(3);
    expect(Number(screen.getByTestId('images').textContent)).toBe(135);
  });

  /**
   * Regression: the provider is mounted by a lazily-routed page, so leaving
   * /cake-design unmounts it. A module-level cache of the boot LoadResult made
   * the remount restore the boot catalog — and the next write then persisted
   * that snapshot over everything done in between.
   */
  it('keeps edits across an unmount/remount and does not rewind on the next write', async () => {
    const first = mount();
    await ready();

    await act(async () => {
      await api!.addLevel('طبقة إضافية');
    });
    expect(screen.getByTestId('levels')).toHaveTextContent('طبقة إضافية');

    first.unmount();
    mount();
    await ready();

    // The remount must show the edited catalog, not the boot snapshot.
    expect(screen.getByTestId('levels')).toHaveTextContent('طبقة إضافية');

    // And a write after the remount must not resurrect the pre-edit state.
    await act(async () => {
      await api!.addLevel('طبقة ثالثة');
    });
    const persisted = (await store.load()).catalog;
    expect(persisted.levels.map((l) => l.name)).toEqual(
      expect.arrayContaining(['طبقة إضافية', 'طبقة ثالثة']),
    );
  });

  /**
   * Regression: every mutation used to be built from the `catalog` a render had
   * closed over, so two writes issued together both branched off the same
   * snapshot and the later one silently discarded the earlier — losing an image
   * row while its blob stayed on disk.
   */
  it('serialises concurrent writes instead of losing the loser', async () => {
    mount();
    await ready();

    await act(async () => {
      await Promise.all([
        api!.addLevel('أ'),
        api!.addLevel('ب'),
        api!.addLevel('ج'),
      ]);
    });

    const names = api!.catalog.levels.map((l) => l.name);
    expect(names).toEqual(expect.arrayContaining(['أ', 'ب', 'ج']));
    // Persisted state must agree with what the UI is showing.
    expect((await store.load()).catalog.levels.map((l) => l.name)).toEqual(names);
  });

  it('does not lose an edit issued while an image save is still in flight', async () => {
    mount();
    await ready();

    const cakeId = api!.catalog.cakes[0].id;
    const path = [api!.catalog.levels[0].values[0].id];
    const before = api!.catalog.images.length;

    await act(async () => {
      await Promise.all([
        api!.saveVariantImage(cakeId, path, pngFile('a.png')),
        api!.addLevel('أثناء الرفع'),
      ]);
    });

    expect(api!.catalog.levels.map((l) => l.name)).toContain('أثناء الرفع');
    // Replacing an existing node keeps the count; the level add must survive too.
    expect(api!.catalog.images.length).toBe(before);
    const persisted = (await store.load()).catalog;
    expect(persisted.levels.map((l) => l.name)).toContain('أثناء الرفع');
    expect(persisted.images.length).toBe(before);
  });

  it('rejects a duplicate value name without mutating the catalog', async () => {
    mount();
    await ready();

    const existing = api!.catalog.levels[0].values[0].name;
    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await api!.addValue(0, `  ${existing}  `);
    });

    expect(accepted).toBe(false);
    expect(api!.catalog.levels[0].values).toHaveLength(3);
  });

  it('rejects a non-image file before anything reaches storage', async () => {
    mount();
    await ready();

    const cakeId = api!.catalog.cakes[0].id;
    const path = [api!.catalog.levels[0].values[1].id];
    const before = api!.catalog.images.length;

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await api!.saveVariantImage(
        cakeId,
        path,
        new File(['nope'], 'notes.txt', { type: 'text/plain' }),
      );
    });

    expect(accepted).toBe(false);
    expect(api!.catalog.images.length).toBe(before);
  });

  it('drops the object URL of an image it deletes', async () => {
    mount();
    await ready();

    const victim = api!.catalog.images[0];
    expect(api!.urlFor(victim.id)).toBeTruthy();

    await act(async () => {
      await api!.removeVariantImage(victim.id);
    });

    expect(api!.urlFor(victim.id)).toBeUndefined();
    expect(api!.catalog.images.some((i) => i.id === victim.id)).toBe(false);
  });
});
